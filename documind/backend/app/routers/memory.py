from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.embeddings import EmbeddingModel, embedding_router
from app.routing import LLMProfile
from app.models.schemas import MemoryIngestRequest, MemoryQueryRequest
from app.runtime import container, make_collection_name


class MemoryRouter:
    def __init__(self):
        self.router = APIRouter(prefix="/memory", tags=["memory"])
        self.router.add_api_route("/ingest", self.ingest_memory, methods=["POST"])
        self.router.add_api_route("/query", self.query_memory, methods=["POST"])

    def _ensure_memory_kb(self, instance_id: str) -> dict:
        instance = container.store.get_instance(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        existing = container.store.find_kb_by_namespace(instance_id, settings.memory_namespace)
        if existing:
            return existing

        kb_id = str(uuid.uuid4())
        collection_name = make_collection_name(instance_id, kb_id)
        dim = embedding_router.dimension_for(EmbeddingModel.MINILM)

        container.vectordb.create_collection(collection_name, dim=dim, distance="cosine")
        return container.store.create_knowledge_base(
            kb_id=kb_id,
            instance_id=instance_id,
            name=settings.memory_kb_name,
            namespace_id=settings.memory_namespace,
            collection_name=collection_name,
            embedding_model=EmbeddingModel.MINILM.value,
            embedding_profile=embedding_router.default_profile_for_model(EmbeddingModel.MINILM).value,
            embedding_dim=dim,
            llm_profile=LLMProfile.FAST.value,
            distance_metric="cosine",
        )

    async def ingest_memory(self, body: MemoryIngestRequest):
        kb = self._ensure_memory_kb(body.instance_id)

        content = json.dumps(body.messages)
        metadata = {
            "resource_id": str(uuid.uuid4()),
            "kb_id": kb["id"],
            "instance_id": body.instance_id,
            "namespace_id": settings.memory_namespace,
            "source_ref": f"conversation:{body.conversation_id}",
            "user_id": body.user_id,
            "session_id": body.session_id or "",
            "created_at": datetime.utcnow().isoformat(),
        }

        indexed = await asyncio.to_thread(
            container.ingestion.ingest,
            collection_name=kb["collection_name"],
            source_type="conversation_history_json",
            content=content,
            metadata=metadata,
            embedding_model=EmbeddingModel.MINILM,
            expected_dim=int(kb["embedding_dim"]),
        )
        return {"status": "success", "memories_indexed": indexed, "kb_id": kb["id"]}

    async def query_memory(self, body: MemoryQueryRequest):
        kb = self._ensure_memory_kb(body.instance_id)
        results = await asyncio.to_thread(
            container.retrieval.search_memory,
            collection_name=kb["collection_name"],
            query=body.query,
            user_id=body.user_id,
            top_k=body.top_k,
        )
        return {"kb_id": kb["id"], "memories": results}


router = MemoryRouter().router
