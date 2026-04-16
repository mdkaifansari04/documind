from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


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


FilterOperator = Literal["eq", "any_of", "text", "between", "gt", "gte", "lt", "lte"]
SearchMode = Literal["semantic", "hybrid"]
HybridMethod = Literal["rrf", "dbsf"]


class FilterClause(BaseModel):
    field: str
    op: FilterOperator
    value: Any


class FilterSpec(BaseModel):
    must: list[FilterClause] = Field(default_factory=list)
    must_not: list[FilterClause] = Field(default_factory=list)


class HybridConfig(BaseModel):
    method: HybridMethod = "rrf"
    dense_weight: float = Field(default=0.7, ge=0.0)
    keyword_weight: float = Field(default=0.3, ge=0.0)

    @model_validator(mode="after")
    def validate_weight_sum(self) -> "HybridConfig":
        if (self.dense_weight + self.keyword_weight) <= 0:
            raise ValueError("dense_weight + keyword_weight must be > 0")
        return self


class AdvancedSearchRequest(BaseModel):
    instance_id: str
    namespace_id: str = "company_docs"
    query: str
    top_k: int = 5
    mode: SearchMode = "semantic"
    filters: FilterSpec | None = None
    hybrid: HybridConfig | None = None

    @model_validator(mode="after")
    def validate_hybrid(self) -> "AdvancedSearchRequest":
        if self.mode == "hybrid" and not self.hybrid:
            raise ValueError("hybrid config is required when mode='hybrid'")
        return self


class AdvancedQueryRequest(BaseModel):
    instance_id: str
    namespace_id: str = "company_docs"
    question: str
    top_k: int = 5
    llm_profile: str | None = None
    latency_sensitive: bool = False
    mode: SearchMode = "semantic"
    filters: FilterSpec | None = None
    hybrid: HybridConfig | None = None

    @model_validator(mode="after")
    def validate_hybrid(self) -> "AdvancedQueryRequest":
        if self.mode == "hybrid" and not self.hybrid:
            raise ValueError("hybrid config is required when mode='hybrid'")
        return self


class InstanceScopedSearchRequest(BaseModel):
    instance_id: str
    namespace_id: str = "company_docs"
    query: str
    top_k: int = 5


class InstanceScopedQueryRequest(BaseModel):
    instance_id: str
    namespace_id: str = "company_docs"
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


class ResourceIngestRequest(BaseModel):
    kb_id: str | None = None
    instance_id: str | None = None
    namespace_id: str = "company_docs"
    source_type: str
    content: str
    source_ref: str = ""
    user_id: str = ""
    session_id: str = ""

    @model_validator(mode="after")
    def validate_target(self) -> "ResourceIngestRequest":
        if not self.kb_id and not self.instance_id:
            raise ValueError("Provide either kb_id or instance_id")
        return self


class ResourceCrawlRequest(BaseModel):
    kb_id: str | None = None
    instance_id: str | None = None
    namespace_id: str = "company_docs"
    url: str
    crawl_subpages: bool = False
    max_pages: int = Field(default=20, ge=1, le=100)
    scope_mode: str = "strict_docs"
    scope_path: str | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "ResourceCrawlRequest":
        if not self.kb_id and not self.instance_id:
            raise ValueError("Provide either kb_id or instance_id")
        if self.scope_mode not in {"strict_docs", "same_domain"}:
            raise ValueError("scope_mode must be one of: strict_docs, same_domain")
        return self


class ResourceCrawlIngestRequest(ResourceCrawlRequest):
    urls: list[str] = Field(default_factory=list)


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
