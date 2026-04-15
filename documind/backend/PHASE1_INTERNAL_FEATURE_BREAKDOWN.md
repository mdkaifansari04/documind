# Phase 1 Internal Feature Breakdown

Last updated: 2026-04-14

This file explains every major backend feature shipped in Phase 1, how each one works internally, and which components it depends on.

## 1) Runtime Composition

Boot flow:
1. `app/main.py` creates FastAPI app and registers routers.
2. `app/runtime.py` constructs the global `container`.
3. Routers call services through `container`.

Container dependencies (`app/runtime.py`):
- `container.store`: SQLite control-plane (`app/database.py`)
- `container.vectordb`: Actian VectorAI client wrapper (`app/vectordb.py`)
- `container.routing`: profile recommendation logic (`app/routing.py`)
- `container.ingestion`: parser/chunker/embedding/upsert (`app/services/ingestion.py`)
- `container.retrieval`: semantic/hybrid retrieval (`app/services/retrieval.py`)
- `container.agent`: answer generation (`app/services/agent.py`)
- `container.observability`: query log aggregation (`app/services/observability.py`)

## 2) Data Model and Storage Responsibilities

Control-plane (SQLite `documind.db`, `app/database.py`):
- `instances`: instance registry
- `knowledge_bases`: KB metadata
- `resources`: ingestion job records
- `query_logs`: query telemetry rows

Vector-plane (Actian collection per KB):
- chunk vectors
- chunk payload metadata:
  - `text`, `chunk_index`, `source_type`
  - `resource_id`, `kb_id`, `instance_id`, `namespace_id`
  - `source_ref`, `user_id`, `session_id`, `created_at`

Key resolution method:
- `find_kb_by_namespace(instance_id, namespace_id)` is used by instance-scoped APIs.

## 3) Feature: Instance Management

Endpoints:
- `POST /instances`
- `GET /instances`

Internal flow:
1. Router (`app/routers/instances.py`) validates request schema.
2. Calls `container.store.create_instance` / `list_instances`.
3. Returns SQLite rows as JSON.

Dependencies:
- only control-plane store

## 4) Feature: Knowledge Base Management

Endpoints:
- `POST /knowledge-bases`
- `GET /knowledge-bases`
- `GET /knowledge-bases/{kb_id}`

Internal flow for create (`app/routers/knowledge_bases.py`):
1. Validate `instance_id` exists.
2. Resolve embedding model/profile:
   - explicit profile wins
   - explicit model fallback
   - else routing default based on namespace hint
3. Resolve LLM profile (`fast`, `balanced`, `quality`).
4. Create new Actian collection via `container.vectordb.create_collection`.
5. Persist KB row via `container.store.create_knowledge_base`.

Dependencies:
- control-plane store
- embedding router
- routing service
- vector DB wrapper

## 5) Feature: Resource Ingestion API

Endpoint:
- `POST /resources`

Accepted modes:
- `application/json`
- `multipart/form-data`

Targeting contract:
- Preferred: `instance_id + namespace_id`
- Legacy: `kb_id`

Internal flow (`app/routers/resources.py`):
1. Parse body (JSON schema or form fields).
2. Resolve KB:
   - by `kb_id`, or
   - by `instance_id + namespace_id`.
3. Auto-create KB if instance-scoped target missing.
4. Normalize file content:
   - `pdf`: base64 encode bytes for parser
   - others: UTF-8 decode text
5. Create resource row with status `processing`.
6. Build metadata payload.
7. Call `container.ingestion.ingest(...)`.
8. Mark resource `done` with `chunks_indexed`, or `failed` on exception.

Ingestion service internals (`app/services/ingestion.py`):
1. Parse source by `source_type`:
   - `text`, `markdown`, `transcript`: passthrough
   - `conversation_history_json`: flatten messages
   - `pdf`: `pypdf` extraction
   - `url`: `httpx` + `BeautifulSoup` extraction
2. Chunk text (`TextChunker`, overlap-aware).
3. Embed chunks with selected embedding model.
4. Validate vector dimension equals KB `embedding_dim`.
5. Upsert points to Actian collection.

Writes:
- `resources` table
- vector points in collection

## 6) Feature: Resource Listing

Endpoint:
- `GET /resources`

Supported query styles:
- `?instance_id=...&namespace_id=...` (preferred)
- `?kb_id=...` (legacy)

Internal flow:
1. Resolve KB.
2. Query `container.store.list_resources(kb_id)`.

## 7) Feature: Basic Retrieval and Query (Legacy `kb_id`)

Endpoints:
- `POST /search`
- `POST /query`

Search flow (`app/routers/query.py`):
1. Fetch KB by `kb_id`.
2. Use KB embedding model.
3. Call retrieval semantic search.

Query flow:
1. Semantic retrieval for sources.
2. LLM profile selection by routing rules.
3. Answer generation via `container.agent.answer`.
4. Query log write in `query_logs`.

## 8) Feature: Instance-Scoped Retrieval (No Client `kb_id`)

Endpoints:
- `POST /search/instance`
- `POST /query/instance`

Internal flow:
1. Resolve KB internally from `instance_id + namespace_id`.
2. Run same semantic retrieval/query logic as legacy endpoints.
3. Return response with resolved `kb_id` for transparency.

Why it exists:
- user clients do not need to manage internal KB IDs
- keeps namespace-based contract stable

## 9) Feature: Advanced Retrieval

Endpoints:
- `POST /search/advanced`
- `POST /query/advanced`

Request models (`app/models/schemas.py`):
- `AdvancedSearchRequest`
- `AdvancedQueryRequest`
- `FilterSpec` (`must`, `must_not`)
- `FilterClause`
- `HybridConfig`

### 9.1 Filter translation

Supported operators:
- `eq`
- `any_of`
- `text`
- `between`
- `gt`, `gte`, `lt`, `lte`

Internal flow:
1. Router calls `container.retrieval.build_filters`.
2. Retrieval maps each clause to Actian `Field` expressions.
3. Query executes with translated `FilterBuilder` object.

### 9.2 Modes

`mode = semantic`:
- one dense vector search

`mode = hybrid`:
1. dense semantic vector search
2. lexical keyword branch:
   - tokenizes query
   - scrolls filtered payload candidates
   - computes keyword score per payload text
3. fuse dense + lexical rankings:
   - `rrf` (weighted)
   - or `dbsf`

Important:
- This is semantic + lexical fusion.
- Sparse-vector indexing is not implemented yet.

## 10) Feature: Memory Namespace

Endpoints:
- `POST /memory/ingest`
- `POST /memory/query`

Internal behavior (`app/routers/memory.py`):
1. Ensure memory KB exists for namespace `conversation_memory`.
2. Auto-create memory KB if missing with MiniLM profile.
3. Ingest conversation JSON as `conversation_history_json`.
4. Query memory with user filter (`user_id`) via retrieval `search_memory`.

Dependency note:
- memory is isolated as its own namespace/collection, separate from `company_docs`.

## 11) Feature: Answer Generation and LLM Routing

Agent service (`app/services/agent.py`):
- builds context from retrieved sources
- if OpenAI key exists:
  - calls chat completion model selected by LLM profile
- fallback:
  - local deterministic answer template from context

Routing rules (`app/routing.py`):
- embedding profile recommendation:
  - code source types -> `code_search`
  - image/multimodal source types -> `multimodal_text_image`
  - pdf/url -> `balanced_text`
  - memory/transcript -> `general_text_search`
- LLM profile recommendation:
  - `latency_sensitive` -> `fast`
  - complex/long/high-source queries -> `quality`
  - otherwise `balanced`

## 12) Feature: Embedding Model and Profile Layer

Defined models (`app/embeddings.py`):
- `minilm`, `mpnet`, `bge`, `openai`, `clip`, `codebert`

Defined profiles:
- `general_text_search`
- `higher_quality_text`
- `balanced_text`
- `multimodal_text_image`
- `code_search`

Mapping:
- profile -> model mapping is explicit (`PROFILE_TO_MODEL`)
- model dimension constraints enforced at ingestion time

Current scope clarification:
- CLIP/CodeBERT embedding paths exist
- there is no dedicated image binary ingestion endpoint yet

## 13) Feature: Observability

Endpoints:
- `GET /observability/scores`
- `GET /observability/alerts`

Internal flow:
1. Validate KB exists.
2. Parse time window (`1h`, `2d`, etc.).
3. Fetch recent `query_logs`.
4. Aggregate summary metrics:
   - `avg_retrieval_score`
   - `avg_chunk_relevance`
   - `avg_hallucination_rate`
   - `avg_response_ms`
5. Derive alerts from thresholds:
   - low retrieval score
   - high latency

Current limitation:
- some metrics use placeholders until richer evaluators are added.

## 14) API Contract Evolution in Phase 1

Legacy-compatible APIs retained:
- `kb_id` based `/search`, `/query`, `/resources?kb_id=...`

Preferred APIs now:
- instance-scoped contract using `instance_id + namespace_id`

Practical impact:
- frontend/clients can avoid KB ID lifecycle complexity
- backend keeps KB ID internal and resolvable

## 15) Postman and Test Coverage

Primary Postman collection:
- `documind/backend/postman/collection-v1.json`

Manual test runbook:
- `documind/backend/POSTMAN_PHASE1_RUNBOOK.md`

Automated tests include:
- advanced schema validation
- advanced router behavior
- retrieval filter translation
- hybrid fusion behavior
- resources ingest/list behavior
- routing profile behavior

## 16) Known Caveats and Next Hardening Items

1. DB uniqueness for `(instance_id, namespace_id)` is not hard-enforced yet.
2. Async ingestion jobs + job status endpoints are not implemented yet.
3. Sparse-vector hybrid is deferred (current hybrid uses lexical payload branch).
4. Control-plane remains SQLite for this phase; Prisma/Postgres migration is deferred.
