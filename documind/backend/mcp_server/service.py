from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from .context_store import ActiveContextStore


@dataclass(frozen=True)
class MCPTimeouts:
    search_seconds: int = 8
    ask_seconds: int = 25
    ingest_seconds: int = 20


class DocuMindMCPService:
    def __init__(
        self,
        *,
        api_client: Any,
        timeouts: MCPTimeouts | None = None,
        context_store: ActiveContextStore | None = None,
        default_context_id: str = "default",
    ):
        self._api_client = api_client
        self._timeouts = timeouts or MCPTimeouts()
        self._context_store = context_store or ActiveContextStore("~/.documind/contexts.json")
        self._default_context_id = default_context_id.strip() or "default"

    def _resolve_context_id(self, context_id: str | None) -> str:
        resolved = str(context_id or "").strip()
        return resolved or self._default_context_id

    @staticmethod
    def _error(
        *,
        error: str,
        text: str,
        http_status: int | None = None,
        extra_meta: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        meta: dict[str, Any] = {"error": error}
        if http_status is not None:
            meta["http_status"] = http_status
        if extra_meta:
            meta.update(extra_meta)
        return {
            "status": "error",
            "data": data or {},
            "meta": meta,
            "text": text,
        }

    @staticmethod
    def _success(*, data: dict[str, Any], meta: dict[str, Any], text: str) -> dict[str, Any]:
        return {
            "status": "success",
            "data": data,
            "meta": meta,
            "text": text,
        }

    @staticmethod
    def _map_http_error(status_code: int) -> str:
        if status_code == 404:
            return "not_found"
        if status_code == 422:
            return "validation_error"
        if status_code in {408, 504}:
            return "timeout"
        return "server_error"

    @staticmethod
    def _top_k(value: int) -> int:
        return min(max(value, 1), 20)

    @staticmethod
    def _is_useful_answer(answer: Any, sources: Any) -> bool:
        return bool(str(answer or "").strip()) and isinstance(sources, list) and len(sources) > 0

    @staticmethod
    def _extract_list_payload(data: dict[str, Any]) -> list[dict[str, Any]]:
        raw = data.get("data")
        if not isinstance(raw, list):
            return []
        return [item for item in raw if isinstance(item, dict)]

    def _fetch_instances(self) -> tuple[int, dict[str, Any]]:
        return self._api_client.get_json("/instances", {}, self._timeouts.search_seconds)

    def _fetch_knowledge_bases(self, *, instance_id: str | None = None) -> tuple[int, dict[str, Any]]:
        params: dict[str, Any] = {}
        if instance_id:
            params["instance_id"] = instance_id
        return self._api_client.get_json("/knowledge-bases", params, self._timeouts.search_seconds)

    def _resolve_target(
        self,
        *,
        instance_id: str,
        namespace_id: str,
        context_id: str | None,
        operation: str,
    ) -> tuple[str, str, bool, str] | dict[str, Any]:
        resolved_instance_id = instance_id.strip()
        resolved_namespace_id = namespace_id.strip()
        resolved_context_id = self._resolve_context_id(context_id)

        if resolved_instance_id and resolved_namespace_id:
            return resolved_instance_id, resolved_namespace_id, False, resolved_context_id

        active = self._context_store.get(resolved_context_id)
        if not active:
            return self._error(
                error="validation_error",
                text=(
                    f"{operation} requires instance_id + namespace_id or an active context. "
                    "Call set_active_context first."
                ),
                extra_meta={
                    "reason": "context_missing",
                    "action_required": "set_active_context",
                    "context_id": resolved_context_id,
                },
            )

        return (
            resolved_instance_id or active.instance_id,
            resolved_namespace_id or active.namespace_id,
            True,
            resolved_context_id,
        )

    def get_active_context(self, *, context_id: str | None = None) -> dict[str, Any]:
        resolved_context_id = self._resolve_context_id(context_id)
        active = self._context_store.get(resolved_context_id)
        if not active:
            return self._error(
                error="validation_error",
                text="No active context found. Call set_active_context first.",
                extra_meta={
                    "reason": "context_missing",
                    "action_required": "set_active_context",
                    "context_id": resolved_context_id,
                },
            )

        return self._success(
            data=active.as_dict(),
            meta={"context_id": resolved_context_id},
            text=f"Active context is {active.instance_id}/{active.namespace_id}.",
        )

    def set_active_context(
        self,
        *,
        instance_id: str,
        namespace_id: str,
        context_id: str | None = None,
    ) -> dict[str, Any]:
        resolved_instance_id = instance_id.strip()
        resolved_namespace_id = namespace_id.strip()
        resolved_context_id = self._resolve_context_id(context_id)

        if not resolved_instance_id or not resolved_namespace_id:
            return self._error(
                error="validation_error",
                text="instance_id and namespace_id are required to set context.",
            )

        try:
            status_code, response_data = self._fetch_instances()
        except httpx.TimeoutException:
            return self._error(error="timeout", text="set context timed out while listing instances.")
        except Exception:
            return self._error(error="server_error", text="set context failed while listing instances.")

        if status_code != 200:
            mapped = self._map_http_error(status_code)
            detail = str(response_data.get("detail", "Failed to list instances"))
            return self._error(error=mapped, text=detail, http_status=status_code)

        instances = self._extract_list_payload(response_data)
        if not any(str(item.get("id", "")).strip() == resolved_instance_id for item in instances):
            return self._error(
                error="not_found",
                text=f"Instance not found: {resolved_instance_id}",
                data={"instance_id": resolved_instance_id},
            )

        namespace_known = False
        available_namespaces: list[str] = []
        try:
            kb_status, kb_data = self._fetch_knowledge_bases(instance_id=resolved_instance_id)
        except Exception:
            kb_status = 500
            kb_data = {}
        if kb_status == 200:
            items = self._extract_list_payload(kb_data)
            namespace_set = {
                str(item.get("namespace_id", "")).strip()
                for item in items
                if str(item.get("namespace_id", "")).strip()
            }
            available_namespaces = sorted(namespace_set)
            namespace_known = resolved_namespace_id in namespace_set

        active = self._context_store.set(
            context_id=resolved_context_id,
            instance_id=resolved_instance_id,
            namespace_id=resolved_namespace_id,
        )
        return self._success(
            data={
                **active.as_dict(),
                "namespace_known": namespace_known,
                "available_namespaces": available_namespaces,
            },
            meta={
                "context_id": resolved_context_id,
                "instance_id": resolved_instance_id,
                "namespace_id": resolved_namespace_id,
            },
            text=f"Active context set to {resolved_instance_id}/{resolved_namespace_id}.",
        )

    def list_instances(self) -> dict[str, Any]:
        try:
            status_code, response_data = self._fetch_instances()
        except httpx.TimeoutException:
            return self._error(error="timeout", text="list instances timed out.")
        except Exception:
            return self._error(error="server_error", text="list instances failed.")

        if status_code != 200:
            mapped = self._map_http_error(status_code)
            detail = str(response_data.get("detail", "List instances failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=status_code,
            )

        items = self._extract_list_payload(response_data)
        return self._success(
            data={"instances": items},
            meta={"count": len(items)},
            text=f"Found {len(items)} instance(s).",
        )

    def list_namespaces(self, *, instance_id: str = "", context_id: str | None = None) -> dict[str, Any]:
        resolved_instance_id = instance_id.strip()
        resolved_context_id = self._resolve_context_id(context_id)
        context_used = False
        if not resolved_instance_id:
            active = self._context_store.get(resolved_context_id)
            if not active:
                return self._error(
                    error="validation_error",
                    text="instance_id is required or set_active_context must be called first.",
                    extra_meta={
                        "reason": "context_missing",
                        "action_required": "set_active_context",
                        "context_id": resolved_context_id,
                    },
                )
            resolved_instance_id = active.instance_id
            context_used = True

        try:
            status_code, response_data = self._fetch_knowledge_bases(instance_id=resolved_instance_id)
        except httpx.TimeoutException:
            return self._error(error="timeout", text="list namespaces timed out.")
        except Exception:
            return self._error(error="server_error", text="list namespaces failed.")

        if status_code != 200:
            mapped = self._map_http_error(status_code)
            detail = str(response_data.get("detail", "List namespaces failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=status_code,
            )

        items = self._extract_list_payload(response_data)
        namespace_set = {
            str(item.get("namespace_id", "")).strip()
            for item in items
            if str(item.get("namespace_id", "")).strip()
        }
        namespaces = sorted(namespace_set)
        return self._success(
            data={"namespaces": namespaces},
            meta={
                "instance_id": resolved_instance_id,
                "count": len(namespaces),
                "context_used": context_used,
                "context_id": resolved_context_id,
            },
            text=f"Found {len(namespaces)} namespace(s).",
        )

    def search_docs(
        self,
        *,
        query: str,
        instance_id: str = "",
        namespace_id: str = "",
        top_k: int = 5,
        context_id: str | None = None,
    ) -> dict[str, Any]:
        if not query.strip():
            return self._error(
                error="validation_error",
                text="query is required.",
            )

        resolved_target = self._resolve_target(
            instance_id=instance_id,
            namespace_id=namespace_id,
            context_id=context_id,
            operation="search_docs",
        )
        if isinstance(resolved_target, dict):
            return resolved_target
        resolved_instance_id, resolved_namespace_id, context_used, resolved_context_id = resolved_target

        resolved_top_k = self._top_k(top_k)
        primary_payload = {
            "instance_id": resolved_instance_id,
            "namespace_id": resolved_namespace_id,
            "query": query,
            "top_k": resolved_top_k,
        }

        try:
            primary_status, primary_data = self._api_client.post_json(
                "/search/instance",
                primary_payload,
                self._timeouts.search_seconds,
            )
        except httpx.TimeoutException:
            return self._error(error="timeout", text="search request timed out.")
        except Exception:
            return self._error(error="server_error", text="search request failed.")

        if primary_status != 200:
            mapped = self._map_http_error(primary_status)
            detail = str(primary_data.get("detail", "Search request failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=primary_status,
                extra_meta={
                    "fallback_used": False,
                    "context_used": context_used,
                    "context_id": resolved_context_id,
                    "instance_id": resolved_instance_id,
                    "namespace_id": resolved_namespace_id,
                },
            )

        primary_results = primary_data.get("results", [])
        if primary_results:
            return self._success(
                data={"results": primary_results},
                meta={
                    "instance_id": resolved_instance_id,
                    "namespace_id": resolved_namespace_id,
                    "top_k": resolved_top_k,
                    "fallback_used": False,
                    "path": "/search/instance",
                    "context_used": context_used,
                    "context_id": resolved_context_id,
                },
                text=f"Found {len(primary_results)} result(s).",
            )

        fallback_payload = {
            "instance_id": resolved_instance_id,
            "namespace_id": resolved_namespace_id,
            "query": query,
            "top_k": resolved_top_k,
            "mode": "hybrid",
            "hybrid": {"method": "rrf", "dense_weight": 0.7, "keyword_weight": 0.3},
        }

        try:
            fallback_status, fallback_data = self._api_client.post_json(
                "/search/advanced",
                fallback_payload,
                self._timeouts.search_seconds,
            )
        except httpx.TimeoutException:
            return self._error(
                error="timeout",
                text="search fallback timed out.",
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )
        except Exception:
            return self._error(
                error="server_error",
                text="search fallback failed.",
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )

        if fallback_status != 200:
            mapped = self._map_http_error(fallback_status)
            detail = str(fallback_data.get("detail", "Search fallback failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=fallback_status,
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )

        fallback_results = fallback_data.get("results", [])
        return self._success(
            data={"results": fallback_results},
            meta={
                "instance_id": resolved_instance_id,
                "namespace_id": resolved_namespace_id,
                "top_k": resolved_top_k,
                "fallback_used": True,
                "path": "/search/advanced",
                "context_used": context_used,
                "context_id": resolved_context_id,
            },
            text=f"Found {len(fallback_results)} result(s) after fallback.",
        )

    def ask_docs(
        self,
        *,
        question: str,
        instance_id: str = "",
        namespace_id: str = "",
        top_k: int = 5,
        context_id: str | None = None,
    ) -> dict[str, Any]:
        if not question.strip():
            return self._error(
                error="validation_error",
                text="question is required.",
            )

        resolved_target = self._resolve_target(
            instance_id=instance_id,
            namespace_id=namespace_id,
            context_id=context_id,
            operation="ask_docs",
        )
        if isinstance(resolved_target, dict):
            return resolved_target
        resolved_instance_id, resolved_namespace_id, context_used, resolved_context_id = resolved_target

        resolved_top_k = self._top_k(top_k)
        primary_payload = {
            "instance_id": resolved_instance_id,
            "namespace_id": resolved_namespace_id,
            "question": question,
            "top_k": resolved_top_k,
            "llm_profile": "fast",
            "latency_sensitive": True,
        }

        try:
            primary_status, primary_data = self._api_client.post_json(
                "/query/instance",
                primary_payload,
                self._timeouts.ask_seconds,
            )
        except httpx.TimeoutException:
            return self._error(error="timeout", text="ask request timed out.")
        except Exception:
            return self._error(error="server_error", text="ask request failed.")

        if primary_status != 200:
            mapped = self._map_http_error(primary_status)
            detail = str(primary_data.get("detail", "Ask request failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=primary_status,
                extra_meta={
                    "fallback_used": False,
                    "context_used": context_used,
                    "context_id": resolved_context_id,
                    "instance_id": resolved_instance_id,
                    "namespace_id": resolved_namespace_id,
                },
            )

        primary_answer = primary_data.get("answer", "")
        primary_sources = primary_data.get("sources", [])
        if self._is_useful_answer(primary_answer, primary_sources):
            return self._success(
                data={
                    "answer": primary_answer,
                    "sources": primary_sources,
                    "response_ms": primary_data.get("response_ms"),
                    "llm_profile": primary_data.get("llm_profile"),
                },
                meta={
                    "instance_id": resolved_instance_id,
                    "namespace_id": resolved_namespace_id,
                    "top_k": resolved_top_k,
                    "fallback_used": False,
                    "path": "/query/instance",
                    "context_used": context_used,
                    "context_id": resolved_context_id,
                },
                text=f"Generated answer with {len(primary_sources)} source(s).",
            )

        fallback_payload = {
            "instance_id": resolved_instance_id,
            "namespace_id": resolved_namespace_id,
            "question": question,
            "top_k": resolved_top_k,
            "llm_profile": "fast",
            "latency_sensitive": True,
            "mode": "hybrid",
            "hybrid": {"method": "rrf", "dense_weight": 0.7, "keyword_weight": 0.3},
        }

        try:
            fallback_status, fallback_data = self._api_client.post_json(
                "/query/advanced",
                fallback_payload,
                self._timeouts.ask_seconds,
            )
        except httpx.TimeoutException:
            return self._error(
                error="timeout",
                text="ask fallback timed out.",
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )
        except Exception:
            return self._error(
                error="server_error",
                text="ask fallback failed.",
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )

        if fallback_status != 200:
            mapped = self._map_http_error(fallback_status)
            detail = str(fallback_data.get("detail", "Ask fallback failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=fallback_status,
                extra_meta={"fallback_used": True, "context_used": context_used, "context_id": resolved_context_id},
            )

        fallback_answer = fallback_data.get("answer", "")
        fallback_sources = fallback_data.get("sources", [])
        return self._success(
            data={
                "answer": fallback_answer,
                "sources": fallback_sources,
                "response_ms": fallback_data.get("response_ms"),
                "llm_profile": fallback_data.get("llm_profile"),
            },
            meta={
                "instance_id": resolved_instance_id,
                "namespace_id": resolved_namespace_id,
                "top_k": resolved_top_k,
                "fallback_used": True,
                "path": "/query/advanced",
                "context_used": context_used,
                "context_id": resolved_context_id,
            },
            text=f"Generated answer with {len(fallback_sources)} source(s) after fallback.",
        )

    def ingest_text(
        self,
        *,
        content: str,
        instance_id: str = "",
        namespace_id: str = "",
        source_ref: str = "inline",
        context_id: str | None = None,
    ) -> dict[str, Any]:
        if not content.strip():
            return self._error(
                error="validation_error",
                text="content is required.",
            )

        resolved_target = self._resolve_target(
            instance_id=instance_id,
            namespace_id=namespace_id,
            context_id=context_id,
            operation="ingest_text",
        )
        if isinstance(resolved_target, dict):
            return resolved_target
        resolved_instance_id, resolved_namespace_id, context_used, resolved_context_id = resolved_target

        payload = {
            "instance_id": resolved_instance_id,
            "namespace_id": resolved_namespace_id,
            "source_type": "text",
            "content": content,
            "source_ref": source_ref,
        }

        try:
            status_code, response_data = self._api_client.post_json(
                "/resources",
                payload,
                self._timeouts.ingest_seconds,
            )
        except httpx.TimeoutException:
            return self._error(error="timeout", text="ingest request timed out.")
        except Exception:
            return self._error(error="server_error", text="ingest request failed.")

        if status_code != 200:
            mapped = self._map_http_error(status_code)
            detail = str(response_data.get("detail", "Ingest request failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=status_code,
                extra_meta={
                    "context_used": context_used,
                    "context_id": resolved_context_id,
                    "instance_id": resolved_instance_id,
                    "namespace_id": resolved_namespace_id,
                },
            )

        chunks_indexed = int(response_data.get("chunks_indexed", 0))
        return self._success(
            data={
                "kb_id": response_data.get("kb_id", ""),
                "resource_id": response_data.get("resource_id", ""),
                "chunks_indexed": chunks_indexed,
            },
            meta={
                "instance_id": resolved_instance_id,
                "namespace_id": resolved_namespace_id,
                "context_used": context_used,
                "context_id": resolved_context_id,
            },
            text=f"Indexed {chunks_indexed} chunk(s).",
        )

    def list_knowledge_bases(self, *, instance_id: str | None = None) -> dict[str, Any]:
        params: dict[str, Any] = {}
        if instance_id:
            params["instance_id"] = instance_id

        try:
            status_code, response_data = self._api_client.get_json(
                "/knowledge-bases",
                params,
                self._timeouts.search_seconds,
            )
        except httpx.TimeoutException:
            return self._error(error="timeout", text="list knowledge bases timed out.")
        except Exception:
            return self._error(error="server_error", text="list knowledge bases failed.")

        if status_code != 200:
            mapped = self._map_http_error(status_code)
            detail = str(response_data.get("detail", "List knowledge bases failed"))
            return self._error(
                error=mapped,
                text=detail,
                http_status=status_code,
            )

        items = self._extract_list_payload(response_data)
        return self._success(
            data={"knowledge_bases": items},
            meta={"instance_id": instance_id or "", "count": len(items)},
            text=f"Found {len(items)} knowledge base(s).",
        )
