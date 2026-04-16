from __future__ import annotations

import io
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.embeddings import EmbeddingProfile
from app.routers.resources import router as resources_router


class ResourceRouterTests(unittest.TestCase):
    def _build_client(self, fake_container: SimpleNamespace) -> TestClient:
        app = FastAPI()
        app.include_router(resources_router)
        patcher = patch("app.routers.resources.container", fake_container)
        patcher.start()
        self.addCleanup(patcher.stop)
        return TestClient(app)

    def test_ingest_accepts_json_text_payload(self) -> None:
        fake_store = MagicMock()
        fake_store.get_knowledge_base.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_collection",
        }
        fake_store.create_resource.return_value = {"id": "res-1"}

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.return_value = 1

        fake_container = SimpleNamespace(store=fake_store, ingestion=fake_ingestion)
        client = self._build_client(fake_container)

        response = client.post(
            "/resources",
            json={
                "kb_id": "kb-1",
                "source_type": "text",
                "content": "Hello from JSON text payload",
                "source_ref": "inline-text",
                "user_id": "user-1",
                "session_id": "sess-1",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["resource_id"], "res-1")
        self.assertEqual(body["chunks_indexed"], 1)

        fake_store.create_resource.assert_called_once()
        create_resource_kwargs = fake_store.create_resource.call_args.kwargs
        self.assertEqual(create_resource_kwargs["source_type"], "text")

        fake_ingestion.ingest.assert_called_once()
        ingest_kwargs = fake_ingestion.ingest.call_args.kwargs
        self.assertEqual(ingest_kwargs["source_type"], "text")
        self.assertEqual(ingest_kwargs["content"], "Hello from JSON text payload")

    def test_ingest_accepts_instance_namespace_without_kb_id(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_collection",
        }
        fake_store.create_resource.return_value = {"id": "res-1"}

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.return_value = 2

        fake_container = SimpleNamespace(store=fake_store, ingestion=fake_ingestion)
        client = self._build_client(fake_container)

        response = client.post(
            "/resources",
            json={
                "instance_id": "inst-1",
                "namespace_id": "company_docs",
                "source_type": "text",
                "content": "hello without kb id",
                "source_ref": "inline.txt",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["resource_id"], "res-1")
        self.assertEqual(body["chunks_indexed"], 2)
        self.assertEqual(body["kb_id"], "kb-1")

        fake_store.find_kb_by_namespace.assert_called_once_with("inst-1", "company_docs")
        fake_store.create_resource.assert_called_once()
        create_resource_kwargs = fake_store.create_resource.call_args.kwargs
        self.assertEqual(create_resource_kwargs["knowledge_base_id"], "kb-1")

    def test_list_resources_accepts_instance_namespace_without_kb_id(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {"id": "kb-1"}
        fake_store.list_resources.return_value = [{"id": "res-1", "knowledge_base_id": "kb-1", "status": "done"}]

        fake_container = SimpleNamespace(store=fake_store, ingestion=MagicMock())
        client = self._build_client(fake_container)

        response = client.get(
            "/resources",
            params={"instance_id": "inst-1", "namespace_id": "company_docs"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        fake_store.find_kb_by_namespace.assert_called_once_with("inst-1", "company_docs")
        fake_store.list_resources.assert_called_once_with("kb-1")

    def test_ingest_auto_creates_kb_when_missing_for_instance_namespace(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = None
        fake_store.get_instance.return_value = {"id": "inst-1"}
        fake_store.create_knowledge_base.return_value = {
            "id": "kb-new",
            "instance_id": "inst-1",
            "namespace_id": "project_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_inst_kbnew",
        }
        fake_store.create_resource.return_value = {"id": "res-1"}

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.return_value = 1

        fake_routing = MagicMock()
        fake_routing.recommend_embedding_profile.return_value = EmbeddingProfile.GENERAL_TEXT_SEARCH

        fake_vectordb = MagicMock()

        fake_container = SimpleNamespace(
            store=fake_store,
            ingestion=fake_ingestion,
            routing=fake_routing,
            vectordb=fake_vectordb,
        )
        client = self._build_client(fake_container)

        response = client.post(
            "/resources",
            json={
                "instance_id": "inst-1",
                "namespace_id": "project_docs",
                "source_type": "text",
                "content": "auto create kb path",
                "source_ref": "inline.txt",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["kb_id"], "kb-new")
        fake_store.create_knowledge_base.assert_called_once()
        fake_vectordb.create_collection.assert_called_once()

    def test_ingest_accepts_markdown_file_upload(self) -> None:
        fake_store = MagicMock()
        fake_store.get_knowledge_base.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_collection",
        }
        fake_store.create_resource.return_value = {"id": "res-1"}

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.return_value = 1

        fake_container = SimpleNamespace(store=fake_store, ingestion=fake_ingestion)
        client = self._build_client(fake_container)

        response = client.post(
            "/resources",
            data={"kb_id": "kb-1", "source_type": "markdown", "source_ref": "notes.md"},
            files={"file": ("notes.md", io.BytesIO(b"# Heading\nhello markdown"), "text/markdown")},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["resource_id"], "res-1")
        self.assertEqual(body["chunks_indexed"], 1)

        fake_ingestion.ingest.assert_called_once()
        ingest_kwargs = fake_ingestion.ingest.call_args.kwargs
        self.assertEqual(ingest_kwargs["source_type"], "markdown")
        self.assertEqual(ingest_kwargs["content"], "# Heading\nhello markdown")

    def test_ingest_defaults_source_ref_when_missing(self) -> None:
        fake_store = MagicMock()
        fake_store.get_knowledge_base.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_collection",
        }
        fake_store.create_resource.return_value = {"id": "res-1"}

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.return_value = 1

        fake_container = SimpleNamespace(store=fake_store, ingestion=fake_ingestion)
        client = self._build_client(fake_container)

        response = client.post(
            "/resources",
            json={
                "kb_id": "kb-1",
                "source_type": "text",
                "content": "inline text payload",
            },
        )

        self.assertEqual(response.status_code, 200)
        create_resource_kwargs = fake_store.create_resource.call_args.kwargs
        self.assertEqual(create_resource_kwargs["source_ref"], "inline-content.txt")

    def test_crawl_preview_returns_discovered_links(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
        }
        fake_container = SimpleNamespace(store=fake_store, ingestion=MagicMock())
        client = self._build_client(fake_container)

        with patch(
            "app.routers.resources.DocumentationCrawler.discover",
            return_value=[
                "https://docs.example.com",
                "https://docs.example.com/getting-started",
            ],
        ):
            response = client.post(
                "/resources/crawl/preview",
                json={
                    "instance_id": "inst-1",
                    "namespace_id": "company_docs",
                    "url": "https://docs.example.com",
                    "crawl_subpages": True,
                    "max_pages": 10,
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["count"], 2)
        self.assertEqual(
            body["links"],
            [
                "https://docs.example.com",
                "https://docs.example.com/getting-started",
            ],
        )

    def test_crawl_preview_exposes_scope_metadata(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
        }
        fake_container = SimpleNamespace(store=fake_store, ingestion=MagicMock())
        client = self._build_client(fake_container)

        with patch(
            "app.routers.resources.DocumentationCrawler.discover",
            return_value=["https://docs.example.com/start"],
        ):
            response = client.post(
                "/resources/crawl/preview",
                json={
                    "instance_id": "inst-1",
                    "namespace_id": "company_docs",
                    "url": "https://docs.example.com/start",
                    "crawl_subpages": True,
                    "scope_mode": "strict_docs",
                    "scope_path": "/docs/example",
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["scope_mode"], "strict_docs")
        self.assertEqual(body["scope_path"], "/docs/example")

    def test_crawl_preview_passes_scope_options_to_crawler(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
        }
        fake_container = SimpleNamespace(store=fake_store, ingestion=MagicMock())
        client = self._build_client(fake_container)

        with patch(
            "app.routers.resources.DocumentationCrawler.discover",
            return_value=["https://docs.example.com/start"],
        ) as discover_mock:
            response = client.post(
                "/resources/crawl/preview",
                json={
                    "instance_id": "inst-1",
                    "namespace_id": "company_docs",
                    "url": "https://docs.example.com/start",
                    "crawl_subpages": True,
                    "scope_mode": "strict_docs",
                    "scope_path": "/docs",
                },
            )

        self.assertEqual(response.status_code, 200)
        discover_kwargs = discover_mock.call_args.kwargs
        self.assertEqual(discover_kwargs["scope_mode"], "strict_docs")
        self.assertEqual(discover_kwargs["scope_path"], "/docs")

    def test_crawl_preview_returns_scored_link_items(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
        }
        fake_container = SimpleNamespace(store=fake_store, ingestion=MagicMock())
        client = self._build_client(fake_container)

        with patch(
            "app.routers.resources.DocumentationCrawler.discover",
            return_value=[
                "https://svelte.dev/docs/svelte/overview",
                "https://svelte.dev/docs/svelte/$state",
                "https://svelte.dev/blog/announcing-svelte-5",
            ],
        ):
            response = client.post(
                "/resources/crawl/preview",
                json={
                    "instance_id": "inst-1",
                    "namespace_id": "company_docs",
                    "url": "https://svelte.dev/docs/svelte/overview",
                    "crawl_subpages": True,
                    "scope_mode": "same_domain",
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("link_items", body)
        self.assertEqual(len(body["link_items"]), 3)
        first = body["link_items"][0]
        self.assertIn("url", first)
        self.assertIn("score", first)
        self.assertIn("reasons", first)
        self.assertIsInstance(first["reasons"], list)
        self.assertGreaterEqual(first["score"], body["link_items"][-1]["score"])

    def test_crawl_ingest_processes_urls(self) -> None:
        fake_store = MagicMock()
        fake_store.get_knowledge_base.return_value = {
            "id": "kb-1",
            "instance_id": "inst-1",
            "namespace_id": "company_docs",
            "embedding_model": "minilm",
            "embedding_dim": 384,
            "collection_name": "kb_collection",
        }
        fake_store.create_resource.side_effect = [{"id": "res-1"}, {"id": "res-2"}]

        fake_ingestion = MagicMock()
        fake_ingestion.ingest.side_effect = [2, 3]

        fake_container = SimpleNamespace(store=fake_store, ingestion=fake_ingestion)
        client = self._build_client(fake_container)

        response = client.post(
            "/resources/crawl/ingest",
            json={
                "kb_id": "kb-1",
                "url": "https://docs.example.com",
                "crawl_subpages": True,
                "max_pages": 10,
                "urls": [
                    "https://docs.example.com",
                    "https://docs.example.com/guide",
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["success_count"], 2)
        self.assertEqual(body["failed_count"], 0)
        self.assertEqual(body["total_chunks_indexed"], 5)
        self.assertEqual(len(body["results"]), 2)


if __name__ == "__main__":
    unittest.main()
