from __future__ import annotations

import asyncio
import base64
import re
import uuid
import xml.etree.ElementTree as ET
from collections import deque
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urldefrag, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import ValidationError

from app.embeddings import EmbeddingModel, embedding_router
from app.models.schemas import ResourceCrawlIngestRequest, ResourceCrawlRequest, ResourceIngestRequest
from app.routing import LLMProfile
from app.runtime import container, make_collection_name


class DocumentationCrawler:
    TRACKING_QUERY_PARAMS = {
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "gclid",
        "fbclid",
        "ref",
        "source",
    }
    ASSET_EXTENSIONS = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".ico",
        ".js",
        ".css",
        ".zip",
        ".tar",
        ".gz",
        ".mp4",
        ".mp3",
        ".woff",
        ".woff2",
    }
    DOC_HINT_SEGMENTS = {
        "docs",
        "documentation",
        "guide",
        "guides",
        "manual",
        "reference",
        "api",
        "kb",
        "help",
    }

    def __init__(self, timeout_seconds: float = 20.0):
        self.timeout_seconds = timeout_seconds

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        value = (raw_url or "").strip()
        if not value:
            return ""
        if not value.startswith(("http://", "https://")):
            value = f"https://{value}"
        value, _ = urldefrag(value)
        parsed = urlparse(value)
        if not parsed.netloc:
            return ""
        path_lower = (parsed.path or "/").lower()
        if any(path_lower.endswith(ext) for ext in DocumentationCrawler.ASSET_EXTENSIONS):
            return ""
        path = parsed.path or "/"
        path = "/" + "/".join(segment for segment in path.split("/") if segment)
        path = path or "/"
        if path != "/":
            path = path.rstrip("/")
        query_pairs = [
            (key, val)
            for key, val in parse_qsl(parsed.query, keep_blank_values=False)
            if key.lower() not in DocumentationCrawler.TRACKING_QUERY_PARAMS
        ]
        query = urlencode(query_pairs, doseq=True)
        rebuilt = parsed._replace(
            scheme="https",
            netloc=parsed.netloc.lower(),
            path=path,
            params="",
            query=query,
            fragment="",
        )
        return rebuilt.geturl()

    @staticmethod
    def normalize_scope_path(scope_path: str | None) -> str:
        value = (scope_path or "").strip()
        if not value:
            return "/"
        if not value.startswith("/"):
            value = f"/{value}"
        value = "/" + "/".join(segment for segment in value.split("/") if segment)
        value = value or "/"
        if value != "/":
            value = value.rstrip("/")
        return value

    def infer_scope_path(self, root_url: str) -> str:
        parsed = urlparse(root_url)
        path_parts = [segment for segment in parsed.path.split("/") if segment]
        if not path_parts:
            return "/"
        if path_parts[0].lower() in self.DOC_HINT_SEGMENTS and len(path_parts) >= 2:
            return f"/{path_parts[0]}/{path_parts[1]}"
        return f"/{path_parts[0]}"

    def resolve_scope(
        self,
        *,
        root_url: str,
        scope_mode: str,
        scope_path: str | None,
    ) -> tuple[str, str, str]:
        normalized_root = self.normalize_url(root_url)
        if not normalized_root:
            raise ValueError("Invalid URL")
        resolved_mode = (scope_mode or "strict_docs").strip().lower()
        if resolved_mode not in {"strict_docs", "same_domain"}:
            raise ValueError("scope_mode must be one of: strict_docs, same_domain")
        resolved_scope_path = (
            self.normalize_scope_path(scope_path)
            if scope_path
            else self.infer_scope_path(normalized_root)
        )
        if resolved_mode == "same_domain":
            resolved_scope_path = "/"
        return normalized_root, resolved_mode, resolved_scope_path

    @classmethod
    def is_in_scope(
        cls,
        root_url: str,
        candidate_url: str,
        *,
        scope_mode: str,
        scope_path: str,
    ) -> bool:
        root = urlparse(root_url)
        candidate = urlparse(candidate_url)
        if root.netloc != candidate.netloc:
            return False
        if scope_mode == "same_domain":
            return True

        normalized_scope_path = cls.normalize_scope_path(scope_path)
        if normalized_scope_path == "/":
            return True
        candidate_path = cls.normalize_scope_path(candidate.path)
        return candidate_path == normalized_scope_path or candidate_path.startswith(
            f"{normalized_scope_path}/"
        )

    @staticmethod
    def _is_html_response(response: httpx.Response) -> bool:
        content_type = response.headers.get("content-type", "").lower()
        if "text/html" in content_type:
            return True
        return "<html" in response.text[:1024].lower()

    def _extract_links_from_html(self, base_url: str, html: str) -> set[str]:
        soup = BeautifulSoup(html, "html.parser")
        links: set[str] = set()
        for anchor in soup.find_all("a", href=True):
            href = (anchor.get("href") or "").strip()
            if not href:
                continue
            if href.startswith(("mailto:", "tel:", "javascript:", "#")):
                continue
            absolute = urljoin(base_url, href)
            normalized = self.normalize_url(absolute)
            if normalized:
                links.add(normalized)

        for link_tag in soup.find_all("link", href=True):
            rel_values = [
                (value or "").strip().lower() for value in (link_tag.get("rel") or [])
            ]
            if not {"canonical", "next", "prev"}.intersection(rel_values):
                continue
            href = (link_tag.get("href") or "").strip()
            if not href:
                continue
            absolute = urljoin(base_url, href)
            normalized = self.normalize_url(absolute)
            if normalized:
                links.add(normalized)

        for meta in soup.find_all("meta"):
            if (meta.get("property") or "").strip().lower() != "og:url":
                continue
            content = (meta.get("content") or "").strip()
            if not content:
                continue
            absolute = urljoin(base_url, content)
            normalized = self.normalize_url(absolute)
            if normalized:
                links.add(normalized)
        return links

    def _sitemap_candidates(
        self,
        root_url: str,
        *,
        scope_mode: str,
        scope_path: str,
    ) -> list[str]:
        parsed = urlparse(root_url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        candidates: list[str] = [
            urljoin(base, "/sitemap.xml"),
            urljoin(base, "/sitemap_index.xml"),
        ]

        if scope_mode == "strict_docs":
            normalized_scope_path = self.normalize_scope_path(scope_path)
            if normalized_scope_path != "/":
                scope_path_without_leading = normalized_scope_path.lstrip("/")
                candidates.extend(
                    [
                        urljoin(base, f"{normalized_scope_path}/sitemap.xml"),
                        urljoin(base, f"/{scope_path_without_leading}.xml"),
                    ]
                )

        robots_url = urljoin(base, "/robots.txt")
        try:
            response = httpx.get(robots_url, timeout=self.timeout_seconds, follow_redirects=True)
            if response.status_code < 400:
                for line in response.text.splitlines():
                    match = re.match(r"^\s*Sitemap:\s*(\S+)\s*$", line, re.IGNORECASE)
                    if match:
                        normalized = self.normalize_url(match.group(1))
                        if normalized:
                            candidates.append(normalized)
        except Exception:
            pass

        unique: list[str] = []
        seen: set[str] = set()
        for candidate in candidates:
            normalized = self.normalize_url(candidate)
            if normalized and normalized not in seen:
                seen.add(normalized)
                unique.append(normalized)
        return unique

    @staticmethod
    def _parse_sitemap_locs(xml_text: str) -> list[str]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            return []
        ns_prefix = ""
        if root.tag.startswith("{"):
            ns_prefix = root.tag.split("}", 1)[0] + "}"
        loc_tag = f".//{ns_prefix}loc"
        locs: list[str] = []
        for element in root.findall(loc_tag):
            value = (element.text or "").strip()
            if value:
                locs.append(value)
        return locs

    def _discover_from_sitemaps(
        self,
        root_url: str,
        max_pages: int,
        *,
        scope_mode: str,
        scope_path: str,
    ) -> list[str]:
        queue = deque(
            self._sitemap_candidates(
                root_url,
                scope_mode=scope_mode,
                scope_path=scope_path,
            )
        )
        visited_sitemaps: set[str] = set()
        discovered_links: set[str] = set()

        while queue and len(discovered_links) < max_pages:
            sitemap_url = queue.popleft()
            if sitemap_url in visited_sitemaps:
                continue
            visited_sitemaps.add(sitemap_url)

            try:
                response = httpx.get(
                    sitemap_url,
                    timeout=self.timeout_seconds,
                    follow_redirects=True,
                )
                response.raise_for_status()
                locs = self._parse_sitemap_locs(response.text)
            except Exception:
                continue

            for loc in locs:
                normalized = self.normalize_url(loc)
                if not normalized:
                    continue

                path_lower = urlparse(normalized).path.lower()
                if path_lower.endswith(".xml") and normalized not in visited_sitemaps:
                    queue.append(normalized)
                    continue

                if self.is_in_scope(
                    root_url,
                    normalized,
                    scope_mode=scope_mode,
                    scope_path=scope_path,
                ):
                    discovered_links.add(normalized)
                if len(discovered_links) >= max_pages:
                    break

        return sorted(discovered_links)[:max_pages]

    def _discover_from_html(
        self,
        root_url: str,
        max_pages: int,
        *,
        scope_mode: str,
        scope_path: str,
    ) -> list[str]:
        discovered: list[str] = [root_url]
        visited: set[str] = set()
        queue = deque([root_url])

        while queue and len(discovered) < max_pages:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)

            try:
                response = httpx.get(
                    current,
                    timeout=self.timeout_seconds,
                    follow_redirects=True,
                )
                response.raise_for_status()
            except Exception:
                continue

            final_url = self.normalize_url(str(response.url))
            if (
                final_url
                and final_url not in discovered
                and self.is_in_scope(
                    root_url,
                    final_url,
                    scope_mode=scope_mode,
                    scope_path=scope_path,
                )
            ):
                discovered.append(final_url)
                if len(discovered) >= max_pages:
                    break

            if not self._is_html_response(response):
                continue

            source_url = final_url or current
            for link in sorted(self._extract_links_from_html(source_url, response.text)):
                if not self.is_in_scope(
                    root_url,
                    link,
                    scope_mode=scope_mode,
                    scope_path=scope_path,
                ):
                    continue
                if link in visited or link in queue or link in discovered:
                    continue
                queue.append(link)

        return discovered[:max_pages]

    def discover(
        self,
        *,
        root_url: str,
        crawl_subpages: bool,
        max_pages: int,
        scope_mode: str = "strict_docs",
        scope_path: str | None = None,
    ) -> list[str]:
        normalized_root, resolved_scope_mode, resolved_scope_path = self.resolve_scope(
            root_url=root_url,
            scope_mode=scope_mode,
            scope_path=scope_path,
        )

        if not crawl_subpages:
            return [normalized_root]

        sitemap_links = self._discover_from_sitemaps(
            normalized_root,
            max_pages,
            scope_mode=resolved_scope_mode,
            scope_path=resolved_scope_path,
        )
        if sitemap_links:
            if normalized_root not in sitemap_links:
                sitemap_links.insert(0, normalized_root)
            return sitemap_links[:max_pages]

        return self._discover_from_html(
            normalized_root,
            max_pages,
            scope_mode=resolved_scope_mode,
            scope_path=resolved_scope_path,
        )


class ResourceRouter:
    def __init__(self):
        self.router = APIRouter(prefix="/resources", tags=["resources"])
        self.router.add_api_route("", self.ingest_resource, methods=["POST"])
        self.router.add_api_route("", self.list_resources, methods=["GET"])
        self.router.add_api_route("/crawl/preview", self.crawl_preview, methods=["POST"])
        self.router.add_api_route("/crawl/ingest", self.crawl_ingest, methods=["POST"])
        self._crawler = DocumentationCrawler()

    @staticmethod
    def _default_source_ref(
        *,
        source_type: str,
        source_ref: str,
        fallback_content: str = "",
        file_name: str = "",
    ) -> str:
        candidate = (source_ref or "").strip()
        if candidate:
            return candidate

        if file_name:
            return file_name

        content = (fallback_content or "").strip()
        if source_type == "url" and content.startswith(("http://", "https://")):
            return content
        if source_type == "markdown":
            return "inline-markdown.md"
        if source_type == "html":
            return "inline-content.html"
        if source_type == "text":
            return "inline-content.txt"
        return f"inline-{source_type}"

    @staticmethod
    def _normalize_and_limit_urls(urls: list[str], *, max_pages: int) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for raw_url in urls:
            value = DocumentationCrawler.normalize_url(raw_url)
            if not value or value in seen:
                continue
            seen.add(value)
            normalized.append(value)
            if len(normalized) >= max_pages:
                break
        return normalized

    @staticmethod
    def _resolve_seed_urls(primary_url: str, extra_seed_urls: list[str]) -> list[str]:
        ordered_urls: list[str] = [primary_url, *(extra_seed_urls or [])]
        normalized_urls: list[str] = []
        seen: set[str] = set()
        for candidate in ordered_urls:
            normalized = DocumentationCrawler.normalize_url(candidate)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            normalized_urls.append(normalized)
        return normalized_urls

    @staticmethod
    def _score_link(
        *,
        url: str,
        root_url: str,
        scope_mode: str,
        scope_path: str,
    ) -> dict[str, object]:
        parsed = urlparse(url)
        root_parsed = urlparse(root_url)
        path_lower = parsed.path.lower()
        reasons: list[str] = []
        score = 0

        if parsed.netloc == root_parsed.netloc:
            score += 30
            reasons.append("same_domain")

        if path_lower.startswith("/docs") or "/docs/" in path_lower:
            score += 25
            reasons.append("docs_path")

        if DocumentationCrawler.is_in_scope(
            root_url,
            url,
            scope_mode=scope_mode,
            scope_path=scope_path,
        ):
            score += 25
            reasons.append("within_scope")

        root_depth = len([segment for segment in root_parsed.path.split("/") if segment])
        link_depth = len([segment for segment in parsed.path.split("/") if segment])
        if link_depth <= root_depth + 2:
            score += 10
            reasons.append("close_to_seed")

        if any(
            token in path_lower
            for token in ("overview", "intro", "guide", "reference", "api", "tutorial")
        ):
            score += 10
            reasons.append("documentation_keyword")

        if not parsed.query:
            score += 5
            reasons.append("clean_url")

        score = max(0, min(100, score))
        return {
            "url": url,
            "score": score,
            "reasons": reasons,
        }

    def _build_link_items(
        self,
        *,
        links: list[str],
        root_url: str,
        scope_mode: str,
        scope_path: str,
    ) -> list[dict[str, object]]:
        items = [
            self._score_link(
                url=link,
                root_url=root_url,
                scope_mode=scope_mode,
                scope_path=scope_path,
            )
            for link in links
        ]
        return sorted(items, key=lambda item: (-int(item["score"]), str(item["url"])))

    def _resolve_kb(
        self,
        *,
        kb_id: str | None,
        instance_id: str | None,
        namespace_id: str,
        source_type: str,
        auto_create: bool,
    ) -> dict:
        kb: dict | None = None
        if kb_id:
            kb = container.store.get_knowledge_base(kb_id)
        elif instance_id:
            kb = container.store.find_kb_by_namespace(instance_id, namespace_id)
            if not kb and auto_create:
                instance = container.store.get_instance(instance_id)
                if not instance:
                    raise HTTPException(status_code=404, detail="Instance not found")

                profile = container.routing.recommend_embedding_profile(
                    source_type=source_type,
                    hint_text=namespace_id,
                )
                model = embedding_router.model_for_profile(profile)
                kb_id_new = str(uuid.uuid4())
                collection_name = make_collection_name(instance_id, kb_id_new)
                dim = embedding_router.dimension_for(model)
                container.vectordb.create_collection(name=collection_name, dim=dim, distance="cosine")
                kb = container.store.create_knowledge_base(
                    kb_id=kb_id_new,
                    instance_id=instance_id,
                    name=f"{namespace_id.replace('_', ' ').title()} KB",
                    namespace_id=namespace_id,
                    collection_name=collection_name,
                    embedding_model=model.value,
                    embedding_profile=profile.value,
                    embedding_dim=dim,
                    llm_profile=LLMProfile.BALANCED.value,
                    distance_metric="cosine",
                )

        if not kb:
            raise HTTPException(
                status_code=404,
                detail="Knowledge base not found. Provide a valid kb_id or create a KB for instance_id + namespace_id.",
            )

        return kb

    async def _discover_links(
        self,
        *,
        url: str,
        crawl_subpages: bool,
        max_pages: int,
        scope_mode: str,
        scope_path: str | None,
    ) -> tuple[list[str], str, str, str]:
        try:
            normalized_root, resolved_scope_mode, resolved_scope_path = (
                self._crawler.resolve_scope(
                    root_url=url,
                    scope_mode=scope_mode,
                    scope_path=scope_path,
                )
            )
            links = await asyncio.to_thread(
                self._crawler.discover,
                root_url=normalized_root,
                crawl_subpages=crawl_subpages,
                max_pages=max_pages,
                scope_mode=resolved_scope_mode,
                scope_path=resolved_scope_path,
            )
            return links, normalized_root, resolved_scope_mode, resolved_scope_path
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    async def _discover_links_for_seeds(
        self,
        *,
        url: str,
        seed_urls: list[str],
        crawl_subpages: bool,
        max_pages: int,
        scope_mode: str,
        scope_path: str | None,
    ) -> tuple[list[str], str, str, str, list[str]]:
        merged_seed_urls = self._resolve_seed_urls(url, seed_urls)
        if not merged_seed_urls:
            raise HTTPException(status_code=400, detail="No valid seed URLs provided")

        all_links: list[str] = []
        response_root_url = merged_seed_urls[0]
        response_scope_mode = scope_mode
        response_scope_path = scope_path or "/"

        for index, seed_url in enumerate(merged_seed_urls):
            links, normalized_root, resolved_scope_mode, resolved_scope_path = (
                await self._discover_links(
                    url=seed_url,
                    crawl_subpages=crawl_subpages,
                    max_pages=max_pages,
                    scope_mode=scope_mode,
                    scope_path=scope_path,
                )
            )
            if index == 0:
                response_root_url = normalized_root
                response_scope_mode = resolved_scope_mode
                response_scope_path = resolved_scope_path
            all_links.extend(links)

        deduped_links = self._normalize_and_limit_urls(all_links, max_pages=max_pages)
        return (
            deduped_links,
            response_root_url,
            response_scope_mode,
            response_scope_path,
            merged_seed_urls,
        )

    async def ingest_resource(
        self,
        request: Request,
        kb_id: str | None = Form(default=None),
        instance_id: str | None = Form(default=None),
        namespace_id: str = Form(default="company_docs"),
        source_type: str | None = Form(default=None),
        content: str | None = Form(default=None),
        file: UploadFile | None = File(default=None),
        source_ref: str = Form(default=""),
        user_id: str = Form(default=""),
        session_id: str = Form(default=""),
    ):
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            try:
                body = ResourceIngestRequest.model_validate(await request.json())
            except ValidationError as exc:
                raise HTTPException(status_code=422, detail=exc.errors()) from exc

            kb_id = body.kb_id
            instance_id = body.instance_id
            namespace_id = body.namespace_id
            source_type = body.source_type
            content = body.content
            source_ref = body.source_ref
            user_id = body.user_id
            session_id = body.session_id

        if not source_type:
            raise HTTPException(status_code=422, detail="source_type is required")

        source_type = source_type.strip().lower()
        kb = self._resolve_kb(
            kb_id=kb_id,
            instance_id=instance_id,
            namespace_id=namespace_id,
            source_type=source_type,
            auto_create=True,
        )

        resolved_kb_id = str(kb["id"])

        if file is not None and not content:
            raw = await file.read()
            if source_type == "pdf":
                content = base64.b64encode(raw).decode("utf-8")
            else:
                content = raw.decode("utf-8", errors="replace")

        if not content:
            raise HTTPException(status_code=400, detail="Provide either content or file")

        resolved_source_ref = self._default_source_ref(
            source_type=source_type,
            source_ref=source_ref,
            fallback_content=content,
            file_name=file.filename if file else "",
        )

        resource = container.store.create_resource(
            knowledge_base_id=resolved_kb_id,
            source_type=source_type,
            source_ref=resolved_source_ref,
            status="processing",
        )

        metadata = {
            "resource_id": resource["id"],
            "kb_id": resolved_kb_id,
            "instance_id": kb["instance_id"],
            "namespace_id": kb["namespace_id"],
            "source_ref": resolved_source_ref,
            "user_id": user_id,
            "session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            model = EmbeddingModel(kb["embedding_model"])
            chunks_indexed = await asyncio.to_thread(
                container.ingestion.ingest,
                collection_name=kb["collection_name"],
                source_type=source_type,
                content=content,
                metadata=metadata,
                embedding_model=model,
                expected_dim=int(kb["embedding_dim"]),
            )
            container.store.update_resource(resource["id"], status="done", chunks_indexed=chunks_indexed)
            return {
                "status": "success",
                "kb_id": resolved_kb_id,
                "resource_id": resource["id"],
                "chunks_indexed": chunks_indexed,
            }
        except Exception as exc:
            container.store.update_resource(resource["id"], status="failed")
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    async def crawl_preview(self, body: ResourceCrawlRequest):
        kb = self._resolve_kb(
            kb_id=body.kb_id,
            instance_id=body.instance_id,
            namespace_id=body.namespace_id,
            source_type="url",
            auto_create=False,
        )

        links, normalized_root, resolved_scope_mode, resolved_scope_path, merged_seed_urls = (
            await self._discover_links_for_seeds(
            url=body.url,
            seed_urls=body.seed_urls,
            crawl_subpages=body.crawl_subpages,
            max_pages=body.max_pages,
            scope_mode=body.scope_mode,
            scope_path=body.scope_path,
            )
        )

        link_items = self._build_link_items(
            links=links,
            root_url=normalized_root,
            scope_mode=resolved_scope_mode,
            scope_path=resolved_scope_path,
        )
        ordered_links = [str(item["url"]) for item in link_items]

        return {
            "status": "success",
            "kb_id": str(kb["id"]),
            "instance_id": kb["instance_id"],
            "namespace_id": kb["namespace_id"],
            "root_url": normalized_root,
            "crawl_subpages": body.crawl_subpages,
            "scope_mode": resolved_scope_mode,
            "scope_path": resolved_scope_path,
            "seed_urls": merged_seed_urls,
            "count": len(ordered_links),
            "links": ordered_links,
            "link_items": link_items,
        }

    async def crawl_ingest(self, body: ResourceCrawlIngestRequest):
        kb = self._resolve_kb(
            kb_id=body.kb_id,
            instance_id=body.instance_id,
            namespace_id=body.namespace_id,
            source_type="url",
            auto_create=True,
        )
        resolved_kb_id = str(kb["id"])

        discovered_links = body.urls
        if not discovered_links:
            discovered_links, _, _, _, _ = await self._discover_links_for_seeds(
                url=body.url,
                seed_urls=body.seed_urls,
                crawl_subpages=body.crawl_subpages,
                max_pages=body.max_pages,
                scope_mode=body.scope_mode,
                scope_path=body.scope_path,
            )

        normalized_links = self._normalize_and_limit_urls(
            discovered_links,
            max_pages=body.max_pages,
        )
        if not body.crawl_subpages and normalized_links:
            normalized_links = [normalized_links[0]]

        if not normalized_links:
            raise HTTPException(status_code=400, detail="No crawlable links found")

        try:
            model = EmbeddingModel(kb["embedding_model"])
        except ValueError as exc:
            raise HTTPException(status_code=500, detail="Invalid embedding model for knowledge base") from exc

        results: list[dict] = []
        success_count = 0
        failed_count = 0
        skipped_count = 0
        total_chunks = 0
        existing_source_refs: set[str] = set()
        if body.skip_existing:
            existing_resources = container.store.list_resources(resolved_kb_id)
            existing_source_refs = {
                str(resource.get("source_ref", ""))
                for resource in existing_resources
                if str(resource.get("source_ref", "")).strip()
            }

        for link in normalized_links:
            if body.skip_existing and link in existing_source_refs:
                skipped_count += 1
                results.append(
                    {
                        "url": link,
                        "status": "skipped",
                        "reason": "already_ingested",
                    }
                )
                continue

            resource = container.store.create_resource(
                knowledge_base_id=resolved_kb_id,
                source_type="url",
                source_ref=link,
                status="processing",
            )

            metadata = {
                "resource_id": resource["id"],
                "kb_id": resolved_kb_id,
                "instance_id": kb["instance_id"],
                "namespace_id": kb["namespace_id"],
                "source_ref": link,
                "created_at": datetime.utcnow().isoformat(),
            }

            try:
                chunks_indexed = await asyncio.to_thread(
                    container.ingestion.ingest,
                    collection_name=kb["collection_name"],
                    source_type="url",
                    content=link,
                    metadata=metadata,
                    embedding_model=model,
                    expected_dim=int(kb["embedding_dim"]),
                )
                container.store.update_resource(
                    resource["id"],
                    status="done",
                    chunks_indexed=chunks_indexed,
                )
                results.append(
                    {
                        "url": link,
                        "status": "success",
                        "resource_id": resource["id"],
                        "chunks_indexed": chunks_indexed,
                    }
                )
                success_count += 1
                total_chunks += chunks_indexed
            except Exception as exc:
                container.store.update_resource(resource["id"], status="failed")
                results.append(
                    {
                        "url": link,
                        "status": "failed",
                        "resource_id": resource["id"],
                        "error": str(exc),
                    }
                )
                failed_count += 1

        return {
            "status": "success" if success_count > 0 or skipped_count > 0 else "error",
            "kb_id": resolved_kb_id,
            "instance_id": kb["instance_id"],
            "namespace_id": kb["namespace_id"],
            "total_links": len(normalized_links),
            "success_count": success_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "total_chunks_indexed": total_chunks,
            "results": results,
        }

    async def list_resources(
        self,
        kb_id: str | None = Query(default=None),
        instance_id: str | None = Query(default=None),
        namespace_id: str = Query(default="company_docs"),
    ):
        kb: dict | None = None
        if kb_id:
            kb = container.store.get_knowledge_base(kb_id)
        elif instance_id:
            kb = container.store.find_kb_by_namespace(instance_id, namespace_id)
        else:
            raise HTTPException(status_code=422, detail="Provide kb_id or instance_id")

        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        return container.store.list_resources(str(kb["id"]))


router = ResourceRouter().router
