from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CreateInstanceRequest(BaseModel):
    name: str
    description: str | None = None


class InstanceResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    created_at: str
    updated_at: str


class CreateKnowledgeBaseRequest(BaseModel):
    instance_id: str
    name: str
    namespace_id: str = "company_docs"
    embedding_model: str | None = None
    embedding_profile: str | None = None
    llm_profile: str | None = None
    distance_metric: str = "cosine"


class KnowledgeBaseResponse(BaseModel):
    id: str
    instance_id: str
    name: str
    namespace_id: str
    collection_name: str
    embedding_model: str
    embedding_profile: str
    embedding_dim: int
    llm_profile: str
    distance_metric: str
    status: str
    created_at: str
    updated_at: str


class SearchRequest(BaseModel):
    kb_id: str
    query: str
    top_k: int = 5


class QueryRequest(BaseModel):
    kb_id: str
    question: str
    top_k: int = 5
    llm_profile: str | None = None
    latency_sensitive: bool = False


class SearchResult(BaseModel):
    id: int | str
    text: str
    score: float
    source_ref: str = ""
    chunk_index: int = 0
    resource_id: str = ""
    namespace_id: str = ""


class QueryResponse(BaseModel):
    answer: str
    sources: list[SearchResult]
    response_ms: int


class IngestResponse(BaseModel):
    status: str
    resource_id: str
    chunks_indexed: int


class MemoryIngestRequest(BaseModel):
    instance_id: str
    conversation_id: str
    user_id: str
    session_id: str | None = None
    messages: list[dict[str, Any]] = Field(default_factory=list)


class MemoryQueryRequest(BaseModel):
    instance_id: str
    user_id: str
    query: str
    top_k: int = 5


class ObservabilityResponse(BaseModel):
    kb_id: str
    window: str
    total_queries: int
    avg_retrieval_score: float
    avg_chunk_relevance: float
    avg_hallucination_rate: float
    avg_response_ms: int
