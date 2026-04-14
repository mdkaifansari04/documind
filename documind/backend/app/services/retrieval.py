from __future__ import annotations

import re
from typing import Any

from actian_vectorai import (
    Field,
    FilterBuilder,
    ScoredPoint,
    distribution_based_score_fusion,
    reciprocal_rank_fusion,
)

from app.embeddings import EmbeddingModel, embedding_router
from app.models.schemas import FilterClause, FilterSpec, HybridConfig
from app.vectordb import VectorDBClient


class RetrievalService:
    _TOKEN_PATTERN = re.compile(r"[a-z0-9_-]+")
    _KEYWORD_STOPWORDS = {
        "a",
        "an",
        "the",
        "is",
        "are",
        "and",
        "or",
        "to",
        "for",
        "of",
        "in",
        "on",
        "with",
        "how",
        "what",
        "why",
        "when",
        "where",
    }

    def __init__(self, vectordb: VectorDBClient):
        self._vectordb = vectordb

    @staticmethod
    def _format_results(results: list[Any]) -> list[dict[str, Any]]:
        formatted: list[dict[str, Any]] = []
        for row in results:
            payload = row.payload or {}
            formatted.append(
                {
                    "id": row.id,
                    "text": payload.get("text", ""),
                    "score": float(row.score),
                    "source_ref": payload.get("source_ref", ""),
                    "chunk_index": int(payload.get("chunk_index", 0)),
                    "resource_id": payload.get("resource_id", ""),
                    "namespace_id": payload.get("namespace_id", ""),
                }
            )
        return formatted

    @classmethod
    def _keyword_tokens(cls, query: str) -> list[str]:
        tokens: list[str] = []
        seen: set[str] = set()
        for token in cls._TOKEN_PATTERN.findall(query.lower()):
            if len(token) < 3 or token in cls._KEYWORD_STOPWORDS or token in seen:
                continue
            seen.add(token)
            tokens.append(token)
            if len(tokens) >= 8:
                break
        return tokens

    @classmethod
    def _keyword_score(cls, text: str, query_tokens: list[str]) -> float:
        if not text or not query_tokens:
            return 0.0

        text_tokens = cls._TOKEN_PATTERN.findall(text.lower())
        if not text_tokens:
            return 0.0

        term_counts: dict[str, int] = {}
        for token in text_tokens:
            term_counts[token] = term_counts.get(token, 0) + 1

        matched_tokens = [token for token in query_tokens if term_counts.get(token, 0) > 0]
        if not matched_tokens:
            return 0.0

        coverage = len(matched_tokens) / len(query_tokens)
        normalized_frequency = (
            sum(min(term_counts[token], 3) for token in matched_tokens) / (3 * len(query_tokens))
        )
        phrase_bonus = 0.1 if " ".join(query_tokens) in text.lower() else 0.0
        return coverage + normalized_frequency + phrase_bonus

    def _search_keyword_candidates(
        self,
        *,
        collection_name: str,
        query: str,
        candidate_limit: int,
        filters: Any = None,
    ) -> list[ScoredPoint]:
        query_tokens = self._keyword_tokens(query)
        if not query_tokens:
            return []

        page_limit = max(min(candidate_limit, 200), 50)
        max_scan = max(candidate_limit * 20, 400)
        scanned = 0
        offset: int | str | None = None
        scored_points: list[ScoredPoint] = []

        while scanned < max_scan:
            points, offset = self._vectordb.scroll_points(
                collection_name,
                limit=page_limit,
                offset=offset,
                filters=filters,
            )
            if not points:
                break
            scanned += len(points)

            for point in points:
                payload = point.payload or {}
                text = str(payload.get("text", ""))
                keyword_score = self._keyword_score(text=text, query_tokens=query_tokens)
                if keyword_score <= 0:
                    continue
                scored_points.append(
                    ScoredPoint(
                        id=point.id,
                        score=keyword_score,
                        payload=payload,
                    )
                )

            if offset is None:
                break

        if not scored_points:
            return []

        scored_points.sort(key=lambda point: point.score, reverse=True)
        return scored_points[:candidate_limit]

    @staticmethod
    def _build_condition(clause: FilterClause):
        field = Field(clause.field)
        op = clause.op
        value = clause.value

        if op == "eq":
            return field.eq(value)
        if op == "any_of":
            values = value if isinstance(value, list) else [value]
            return field.any_of(values)
        if op == "text":
            return field.text(str(value))
        if op == "between":
            if isinstance(value, dict):
                low = value.get("start", value.get("from", value.get("gte")))
                high = value.get("end", value.get("to", value.get("lte")))
                inclusive = bool(value.get("inclusive", True))
            elif isinstance(value, (list, tuple)) and len(value) == 2:
                low, high = value
                inclusive = True
            else:
                raise ValueError("between filter expects [low, high] or {start/end}")
            if low is None or high is None:
                raise ValueError("between filter requires both low and high bounds")
            return field.between(low, high, inclusive=inclusive)
        if op == "gt":
            return field.gt(value)
        if op == "gte":
            return field.gte(value)
        if op == "lt":
            return field.lt(value)
        if op == "lte":
            return field.lte(value)

        raise ValueError(f"Unsupported filter operator: {op}")

    def build_filters(self, filters: FilterSpec | None) -> Any:
        if not filters:
            return None
        if not filters.must and not filters.must_not:
            return None

        builder = FilterBuilder()
        for clause in filters.must or []:
            builder.must(self._build_condition(clause))
        for clause in filters.must_not or []:
            builder.must_not(self._build_condition(clause))
        return builder.build()

    def search_knowledge_base(
        self,
        *,
        collection_name: str,
        query: str,
        top_k: int = 5,
        embedding_model: EmbeddingModel | None = None,
        filters: Any = None,
    ) -> list[dict[str, Any]]:
        query_vector = embedding_router.embed_query(query, model=embedding_model)
        results = self._vectordb.search(collection_name, vector=query_vector, top_k=top_k, filters=filters)
        return self._format_results(results)

    def search_knowledge_base_hybrid(
        self,
        *,
        collection_name: str,
        query: str,
        top_k: int = 5,
        embedding_model: EmbeddingModel | None = None,
        filters: Any = None,
        hybrid: HybridConfig | None = None,
    ) -> list[dict[str, Any]]:
        config = hybrid or HybridConfig()
        candidate_limit = max(top_k * 4, 20)

        dense_vector = embedding_router.embed_query(query, model=embedding_model)
        dense_results = self._vectordb.search(
            collection_name,
            vector=dense_vector,
            top_k=candidate_limit,
            filters=filters,
        )

        keyword_results = self._search_keyword_candidates(
            collection_name=collection_name,
            query=query,
            candidate_limit=candidate_limit,
            filters=filters,
        )
        if not keyword_results:
            return self._format_results(dense_results[:top_k])

        if config.method == "dbsf":
            fused = distribution_based_score_fusion(
                [dense_results, keyword_results],
                limit=top_k,
            )
        else:
            fused = reciprocal_rank_fusion(
                [dense_results, keyword_results],
                limit=top_k,
                weights=[config.dense_weight, config.keyword_weight],
            )

        return self._format_results(fused)

    def search_memory(
        self,
        *,
        collection_name: str,
        query: str,
        user_id: str,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        memory_filter = FilterBuilder().must(Field("user_id").eq(user_id)).build()
        return self.search_knowledge_base(
            collection_name=collection_name,
            query=query,
            top_k=top_k,
            embedding_model=EmbeddingModel.MINILM,
            filters=memory_filter,
        )
