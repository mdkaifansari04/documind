from __future__ import annotations

from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from actian_vectorai import ScoredPoint

from app.models.schemas import FilterClause, FilterSpec, HybridConfig
from app.services.retrieval import RetrievalService


class RetrievalServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.vectordb = MagicMock()
        self.service = RetrievalService(vectordb=self.vectordb)

    def test_build_filters_returns_none_when_empty(self) -> None:
        self.assertIsNone(self.service.build_filters(None))
        self.assertIsNone(self.service.build_filters(FilterSpec()))

    def test_build_filters_translates_must_and_must_not(self) -> None:
        filters = FilterSpec(
            must=[FilterClause(field="source_type", op="eq", value="text")],
            must_not=[FilterClause(field="session_id", op="eq", value="debug")],
        )
        built = self.service.build_filters(filters)
        self.assertIsNotNone(built)
        dumped = built.model_dump()
        self.assertEqual(len(dumped["must"]), 1)
        self.assertEqual(len(dumped["must_not"]), 1)
        self.assertEqual(dumped["must"][0]["field"]["key"], "source_type")
        self.assertEqual(dumped["must_not"][0]["field"]["key"], "session_id")

    def test_build_filters_rejects_invalid_between_value(self) -> None:
        filters = FilterSpec(must=[FilterClause(field="price", op="between", value=5)])
        with self.assertRaises(ValueError):
            self.service.build_filters(filters)

    def test_hybrid_search_rrf(self) -> None:
        dense_results = [
            ScoredPoint(id=1, score=0.95, payload={"text": "semantic alpha"}),
            ScoredPoint(id=2, score=0.80, payload={"text": "semantic deploy"}),
        ]
        keyword_points = [
            SimpleNamespace(id=2, payload={"text": "deploy architecture guide"}),
            SimpleNamespace(id=3, payload={"text": "architecture deploy checklist"}),
        ]
        self.vectordb.search.return_value = dense_results
        self.vectordb.scroll_points.side_effect = [(keyword_points, None)]

        with patch("app.services.retrieval.embedding_router.embed_query", return_value=[0.1]):
            results = self.service.search_knowledge_base_hybrid(
                collection_name="kb_collection",
                query="deploy architecture",
                top_k=3,
                hybrid=HybridConfig(method="rrf", dense_weight=0.7, keyword_weight=0.3),
            )

        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["id"], 2)
        self.vectordb.search.assert_called_once()
        self.assertGreaterEqual(self.vectordb.scroll_points.call_count, 1)

    def test_hybrid_search_dbsf(self) -> None:
        dense_results = [
            ScoredPoint(id=1, score=0.95, payload={"text": "semantic alpha"}),
            ScoredPoint(id=2, score=0.50, payload={"text": "semantic deploy"}),
        ]
        keyword_points = [
            SimpleNamespace(id=2, payload={"text": "deploy architecture constraints"}),
            SimpleNamespace(id=3, payload={"text": "deploy architecture timeline"}),
        ]
        self.vectordb.search.return_value = dense_results
        self.vectordb.scroll_points.side_effect = [(keyword_points, None)]

        with patch("app.services.retrieval.embedding_router.embed_query", return_value=[0.1]):
            results = self.service.search_knowledge_base_hybrid(
                collection_name="kb_collection",
                query="deploy architecture",
                top_k=3,
                hybrid=HybridConfig(method="dbsf", dense_weight=0.7, keyword_weight=0.3),
            )

        self.assertEqual(len(results), 3)
        result_ids = [item["id"] for item in results]
        self.assertIn(2, result_ids)
        self.vectordb.search.assert_called_once()
        self.assertGreaterEqual(self.vectordb.scroll_points.call_count, 1)


if __name__ == "__main__":
    unittest.main()
