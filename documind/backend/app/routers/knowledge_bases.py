from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Query

from app.embeddings import EmbeddingModel, EmbeddingProfile, embedding_router
from app.models.schemas import CreateKnowledgeBaseRequest
from app.routing import LLMProfile
from app.runtime import container, make_collection_name


class KnowledgeBaseRouter:
    def __init__(self):
        self.router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])
        self.router.add_api_route("", self.create_knowledge_base, methods=["POST"])
        self.router.add_api_route("", self.list_knowledge_bases, methods=["GET"])
        self.router.add_api_route("/{kb_id}", self.get_knowledge_base, methods=["GET"])

    async def create_knowledge_base(self, body: CreateKnowledgeBaseRequest):
        instance = container.store.get_instance(body.instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Instance not found")

        model: EmbeddingModel
        profile: EmbeddingProfile
        try:
            if body.embedding_profile:
                profile = EmbeddingProfile(body.embedding_profile)
                model = embedding_router.model_for_profile(profile)
                if body.embedding_model and EmbeddingModel(body.embedding_model) != model:
                    raise HTTPException(
                        status_code=400,
                        detail="embedding_model does not match embedding_profile",
                    )
            elif body.embedding_model:
                model = EmbeddingModel(body.embedding_model)
                profile = embedding_router.default_profile_for_model(model)
            else:
                profile = container.routing.recommend_embedding_profile(
                    source_type="text",
                    hint_text=body.namespace_id,
                )
                model = embedding_router.model_for_profile(profile)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid embedding model/profile value") from exc

        try:
            llm_profile = LLMProfile(body.llm_profile) if body.llm_profile else LLMProfile.BALANCED
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid llm_profile") from exc

        kb_id = str(uuid.uuid4())
        dim = embedding_router.dimension_for(model)
        collection_name = make_collection_name(body.instance_id, kb_id)

        container.vectordb.create_collection(
            name=collection_name,
            dim=dim,
            distance=body.distance_metric,
        )

        return container.store.create_knowledge_base(
            kb_id=kb_id,
            instance_id=body.instance_id,
            name=body.name,
            namespace_id=body.namespace_id,
            collection_name=collection_name,
            embedding_model=model.value,
            embedding_profile=profile.value,
            embedding_dim=dim,
            llm_profile=llm_profile.value,
            distance_metric=body.distance_metric,
        )

    async def list_knowledge_bases(self, instance_id: str | None = Query(default=None)):
        return container.store.list_knowledge_bases(instance_id=instance_id)

    async def get_knowledge_base(self, kb_id: str):
        kb = container.store.get_knowledge_base(kb_id)
        if not kb:
            raise HTTPException(status_code=404, detail="Knowledge base not found")
        return kb


router = KnowledgeBaseRouter().router
