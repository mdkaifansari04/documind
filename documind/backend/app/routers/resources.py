from __future__ import annotations

import asyncio
import base64
import uuid
from datetime import datetime

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import ValidationError

from app.embeddings import EmbeddingModel, embedding_router
from app.models.schemas import ResourceIngestRequest
from app.routing import LLMProfile
from app.runtime import container, make_collection_name


class ResourceRouter:
    def __init__(self):
        self.router = APIRouter(prefix="/resources", tags=["resources"])
        self.router.add_api_route("", self.ingest_resource, methods=["POST"])
        self.router.add_api_route("", self.list_resources, methods=["GET"])

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
        kb: dict | None = None
        if kb_id:
            kb = container.store.get_knowledge_base(kb_id)
        elif instance_id:
            kb = container.store.find_kb_by_namespace(instance_id, namespace_id)
            if not kb:
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

        resolved_kb_id = str(kb["id"])

        if file is not None and not content:
            raw = await file.read()
            source_ref = source_ref or file.filename or "upload"
            if source_type == "pdf":
                content = base64.b64encode(raw).decode("utf-8")
            else:
                content = raw.decode("utf-8", errors="replace")

        if not content:
            raise HTTPException(status_code=400, detail="Provide either content or file")

        resource = container.store.create_resource(
            knowledge_base_id=resolved_kb_id,
            source_type=source_type,
            source_ref=source_ref,
            status="processing",
        )

        metadata = {
            "resource_id": resource["id"],
            "kb_id": resolved_kb_id,
            "instance_id": kb["instance_id"],
            "namespace_id": kb["namespace_id"],
            "source_ref": source_ref,
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
