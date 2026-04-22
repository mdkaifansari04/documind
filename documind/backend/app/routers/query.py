from __future__ import annotations

import asyncio
import time
from typing import Any

from fastapi import APIRouter, HTTPException

from app.embeddings import EmbeddingModel
from app.models.schemas import (
    AdvancedQueryRequest,
    AdvancedSearchRequest,
    InstanceScopedQueryRequest,
    InstanceScopedSearchRequest,
    QueryRequest,
    SearchRequest,
)
from app.runtime import container
from app.services.agent import UpstreamLLMError


class QueryRouter:
    def __init__(self):
        self.router = APIRouter(tags=["query"])
        self.router.add_api_route("/search", self.search, methods=["POST"])
        self.router.add_api_route("/query", self.query, methods=["POST"])
        self.router.add_api_route("/search/instance", self.search_by_instance, methods=["POST"])
        self.router.add_api_route("/query/instance", self.query_by_instance, methods=["POST"])
        self.router.add_api_route("/search/advanced", self.search_advanced, methods=["POST"])
        self.router.add_api_route("/query/advanced", self.query_advanced, methods=["POST"])

    @staticmethod
    def _resolve_kb(instance_id: str, namespace_id: str) -> dict:
        kb = container.store.find_kb_by_namespace(instance_id, namespace_id)
        if not kb:
            raise HTTPException(
                status_code=404,
                detail="Knowledge base not found for instance_id + namespace_id",
            )
        return kb

    @staticmethod
    def _build_filters(filters):
        try:
            return container.retrieval.build_filters(filters)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @staticmethod
    async def _run_search(
        *,
        kb: dict,
        query: str,
        top_k: int,
        mode: str,
        filters: Any = None,
        hybrid=None,
    ) -> list[dict]:
        model = EmbeddingModel(kb["embedding_model"])
        if mode == "hybrid":
            return await asyncio.to_thread(
                container.retrieval.search_knowledge_base_hybrid,
                collection_name=kb["collection_name"],
                query=query,
                top_k=top_k,
                embedding_model=model,
                filters=filters,
                hybrid=hybrid,
            )

        return await asyncio.to_thread(
            container.retrieval.search_knowledge_base,
            collection_name=kb["collection_name"],
            query=query,
            top_k=top_k,
            embedding_model=model,
            filters=filters,
        )

    @staticmethod
    async def _generate_answer(
        *,
        question: str,
        sources: list[dict[str, Any]],
        llm_profile,
    ) -> str:
        try:
            return await asyncio.to_thread(
                container.agent.answer,
                question=question,
                sources=sources,
                llm_profile=llm_profile,
            )
        except UpstreamLLMError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    async def search(self, body: SearchRequest):
        kb = container.store.get_knowledge_base(body.kb_id)
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")

        model = EmbeddingModel(kb["embedding_model"])
        results = await asyncio.to_thread(
            container.retrieval.search_knowledge_base,
            collection_name=kb["collection_name"],
            query=body.query,
            top_k=body.top_k,
            embedding_model=model,
        )
        return {"kb_id": body.kb_id, "results": results}

    async def search_by_instance(self, body: InstanceScopedSearchRequest):
        kb = self._resolve_kb(body.instance_id, body.namespace_id)

        model = EmbeddingModel(kb["embedding_model"])
        results = await asyncio.to_thread(
            container.retrieval.search_knowledge_base,
            collection_name=kb["collection_name"],
            query=body.query,
            top_k=body.top_k,
            embedding_model=model,
        )
        return {
            "kb_id": kb["id"],
            "instance_id": body.instance_id,
            "namespace_id": body.namespace_id,
            "results": results,
        }

    async def query(self, body: QueryRequest):
        kb = container.store.get_knowledge_base(body.kb_id)
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")

        model = EmbeddingModel(kb["embedding_model"])
        start = time.time()
        sources = await asyncio.to_thread(
            container.retrieval.search_knowledge_base,
            collection_name=kb["collection_name"],
            query=body.question,
            top_k=body.top_k,
            embedding_model=model,
        )
        llm_profile = container.routing.recommend_llm_profile(
            question=body.question,
            explicit_profile=body.llm_profile or kb.get("llm_profile"),
            retrieved_source_count=len(sources),
            latency_sensitive=body.latency_sensitive,
        )
        answer = await self._generate_answer(
            question=body.question,
            sources=sources,
            llm_profile=llm_profile,
        )
        response_ms = int((time.time() - start) * 1000)

        retrieval_score = sum(item["score"] for item in sources) / len(sources) if sources else 0.0
        container.store.create_query_log(
            knowledge_base_id=body.kb_id,
            query=body.question,
            chunks_retrieved=len(sources),
            response_ms=response_ms,
            retrieval_score=retrieval_score,
            chunk_relevance=retrieval_score,
            hallucination_rate=0.0,
        )

        return {
            "answer": answer,
            "sources": sources,
            "response_ms": response_ms,
            "llm_profile": llm_profile.value,
        }

    async def query_by_instance(self, body: InstanceScopedQueryRequest):
        kb = self._resolve_kb(body.instance_id, body.namespace_id)

        model = EmbeddingModel(kb["embedding_model"])
        start = time.time()
        sources = await asyncio.to_thread(
            container.retrieval.search_knowledge_base,
            collection_name=kb["collection_name"],
            query=body.question,
            top_k=body.top_k,
            embedding_model=model,
        )
        llm_profile = container.routing.recommend_llm_profile(
            question=body.question,
            explicit_profile=body.llm_profile or kb.get("llm_profile"),
            retrieved_source_count=len(sources),
            latency_sensitive=body.latency_sensitive,
        )
        answer = await self._generate_answer(
            question=body.question,
            sources=sources,
            llm_profile=llm_profile,
        )
        response_ms = int((time.time() - start) * 1000)

        retrieval_score = sum(item["score"] for item in sources) / len(sources) if sources else 0.0
        container.store.create_query_log(
            knowledge_base_id=kb["id"],
            query=body.question,
            chunks_retrieved=len(sources),
            response_ms=response_ms,
            retrieval_score=retrieval_score,
            chunk_relevance=retrieval_score,
            hallucination_rate=0.0,
        )

        return {
            "kb_id": kb["id"],
            "instance_id": body.instance_id,
            "namespace_id": body.namespace_id,
            "answer": answer,
            "sources": sources,
            "response_ms": response_ms,
            "llm_profile": llm_profile.value,
        }

    async def search_advanced(self, body: AdvancedSearchRequest):
        kb = self._resolve_kb(body.instance_id, body.namespace_id)
        filters = self._build_filters(body.filters)
        results = await self._run_search(
            kb=kb,
            query=body.query,
            top_k=body.top_k,
            mode=body.mode,
            filters=filters,
            hybrid=body.hybrid,
        )

        return {
            "instance_id": body.instance_id,
            "namespace_id": body.namespace_id,
            "mode": body.mode,
            "results": results,
        }

    async def query_advanced(self, body: AdvancedQueryRequest):
        kb = self._resolve_kb(body.instance_id, body.namespace_id)
        filters = self._build_filters(body.filters)

        start = time.time()
        sources = await self._run_search(
            kb=kb,
            query=body.question,
            top_k=body.top_k,
            mode=body.mode,
            filters=filters,
            hybrid=body.hybrid,
        )
        llm_profile = container.routing.recommend_llm_profile(
            question=body.question,
            explicit_profile=body.llm_profile or kb.get("llm_profile"),
            retrieved_source_count=len(sources),
            latency_sensitive=body.latency_sensitive,
        )
        answer = await self._generate_answer(
            question=body.question,
            sources=sources,
            llm_profile=llm_profile,
        )
        response_ms = int((time.time() - start) * 1000)

        retrieval_score = sum(item["score"] for item in sources) / len(sources) if sources else 0.0
        container.store.create_query_log(
            knowledge_base_id=kb["id"],
            query=body.question,
            chunks_retrieved=len(sources),
            response_ms=response_ms,
            retrieval_score=retrieval_score,
            chunk_relevance=retrieval_score,
            hallucination_rate=0.0,
        )

        return {
            "instance_id": body.instance_id,
            "namespace_id": body.namespace_id,
            "mode": body.mode,
            "answer": answer,
            "sources": sources,
            "response_ms": response_ms,
            "llm_profile": llm_profile.value,
        }


router = QueryRouter().router
