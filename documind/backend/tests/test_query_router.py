from __future__ import annotations

import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from app.routing import LLMProfile
from app.routers.query import QueryRouter
from app.services.agent import UpstreamLLMError
from app.models.schemas import (
    AdvancedQueryRequest,
    AdvancedSearchRequest,
    HybridConfig,
    InstanceScopedQueryRequest,
    InstanceScopedSearchRequest,
    QueryRequest,
)


class QueryRouterTests(unittest.TestCase):
    def test_query_uses_recommended_llm_profile(self) -> None:
        fake_store = MagicMock()
        fake_store.get_knowledge_base.return_value = {
            "id": "kb-1",
            "collection_name": "kb_collection",
            "embedding_model": "minilm",
            "llm_profile": "balanced",
        }
        fake_store.create_query_log.return_value = {}

        fake_retrieval = MagicMock()
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_routing = MagicMock()
        fake_routing.recommend_llm_profile.return_value = LLMProfile.QUALITY

        fake_agent = MagicMock()
        fake_agent.answer.return_value = "final answer"

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=fake_routing,
            agent=fake_agent,
        )

        body = QueryRequest(kb_id="kb-1", question="Explain architecture tradeoffs", top_k=3)
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.query(body))

        self.assertEqual(response["answer"], "final answer")
        self.assertEqual(response["llm_profile"], LLMProfile.QUALITY.value)
        fake_agent.answer.assert_called_once()
        called_kwargs = fake_agent.answer.call_args.kwargs
        self.assertEqual(called_kwargs["llm_profile"], LLMProfile.QUALITY)

    def test_search_by_instance_namespace_resolves_kb(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-2",
            "collection_name": "kb_collection_2",
            "embedding_model": "minilm",
        }

        fake_retrieval = MagicMock()
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=MagicMock(),
            agent=MagicMock(),
        )

        body = InstanceScopedSearchRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            query="deploy flow",
            top_k=3,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.search_by_instance(body))

        self.assertEqual(response["kb_id"], "kb-2")
        self.assertEqual(response["instance_id"], "inst-1")
        self.assertEqual(response["namespace_id"], "company_docs")
        self.assertEqual(len(response["results"]), 1)
        fake_store.find_kb_by_namespace.assert_called_once_with("inst-1", "company_docs")

    def test_query_by_instance_namespace_resolves_kb(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-3",
            "collection_name": "kb_collection_3",
            "embedding_model": "minilm",
            "llm_profile": "balanced",
        }
        fake_store.create_query_log.return_value = {}

        fake_retrieval = MagicMock()
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_routing = MagicMock()
        fake_routing.recommend_llm_profile.return_value = LLMProfile.BALANCED

        fake_agent = MagicMock()
        fake_agent.answer.return_value = "answer"

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=fake_routing,
            agent=fake_agent,
        )

        body = InstanceScopedQueryRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            question="how do we deploy",
            top_k=2,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.query_by_instance(body))

        self.assertEqual(response["kb_id"], "kb-3")
        self.assertEqual(response["instance_id"], "inst-1")
        self.assertEqual(response["namespace_id"], "company_docs")
        self.assertEqual(response["answer"], "answer")
        fake_store.find_kb_by_namespace.assert_called_once_with("inst-1", "company_docs")

    def test_search_advanced_semantic(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-4",
            "collection_name": "kb_collection_4",
            "embedding_model": "minilm",
        }

        fake_retrieval = MagicMock()
        fake_retrieval.build_filters.return_value = {"x": 1}
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=MagicMock(),
            agent=MagicMock(),
        )

        body = AdvancedSearchRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            query="deploy flow",
            mode="semantic",
            top_k=3,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.search_advanced(body))

        self.assertEqual(response["mode"], "semantic")
        self.assertEqual(response["instance_id"], "inst-1")
        self.assertEqual(len(response["results"]), 1)
        fake_retrieval.build_filters.assert_called_once()
        fake_retrieval.search_knowledge_base.assert_called_once()

    def test_search_advanced_hybrid(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-5",
            "collection_name": "kb_collection_5",
            "embedding_model": "minilm",
        }

        fake_retrieval = MagicMock()
        fake_retrieval.build_filters.return_value = None
        fake_retrieval.search_knowledge_base_hybrid.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=MagicMock(),
            agent=MagicMock(),
        )

        body = AdvancedSearchRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            query="deploy flow",
            mode="hybrid",
            hybrid=HybridConfig(method="rrf", dense_weight=0.7, keyword_weight=0.3),
            top_k=3,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.search_advanced(body))

        self.assertEqual(response["mode"], "hybrid")
        fake_retrieval.search_knowledge_base_hybrid.assert_called_once()

    def test_query_by_instance_returns_502_when_upstream_llm_fails(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-err",
            "collection_name": "kb_collection_err",
            "embedding_model": "minilm",
            "llm_profile": "balanced",
        }
        fake_store.create_query_log.return_value = {}

        fake_retrieval = MagicMock()
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_routing = MagicMock()
        fake_routing.recommend_llm_profile.return_value = LLMProfile.BALANCED

        fake_agent = MagicMock()
        fake_agent.answer.side_effect = UpstreamLLMError("OpenAI request failed: APIConnectionError: Connection error.")

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=fake_routing,
            agent=fake_agent,
        )

        body = InstanceScopedQueryRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            question="how do we deploy",
            top_k=2,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            with self.assertRaises(HTTPException) as exc:
                asyncio.run(router.query_by_instance(body))

        self.assertEqual(exc.exception.status_code, 502)
        self.assertIn("OpenAI request failed", str(exc.exception.detail))

    def test_query_advanced(self) -> None:
        fake_store = MagicMock()
        fake_store.find_kb_by_namespace.return_value = {
            "id": "kb-6",
            "collection_name": "kb_collection_6",
            "embedding_model": "minilm",
            "llm_profile": "balanced",
        }
        fake_store.create_query_log.return_value = {}

        fake_retrieval = MagicMock()
        fake_retrieval.build_filters.return_value = None
        fake_retrieval.search_knowledge_base.return_value = [
            {"id": 1, "text": "chunk", "score": 0.9, "source_ref": "x", "chunk_index": 0, "resource_id": "r"}
        ]

        fake_routing = MagicMock()
        fake_routing.recommend_llm_profile.return_value = LLMProfile.BALANCED

        fake_agent = MagicMock()
        fake_agent.answer.return_value = "advanced answer"

        fake_container = SimpleNamespace(
            store=fake_store,
            retrieval=fake_retrieval,
            routing=fake_routing,
            agent=fake_agent,
        )

        body = AdvancedQueryRequest(
            instance_id="inst-1",
            namespace_id="company_docs",
            question="How do we deploy?",
            mode="semantic",
            top_k=2,
        )
        router = QueryRouter()

        with patch("app.routers.query.container", fake_container):
            response = asyncio.run(router.query_advanced(body))

        self.assertEqual(response["answer"], "advanced answer")
        self.assertEqual(response["mode"], "semantic")
        fake_store.create_query_log.assert_called_once()


if __name__ == "__main__":
    unittest.main()
