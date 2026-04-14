# Actian VectorAI DB Resource Guide

This file consolidates the most useful implementation and operational details from:

- `actian-vectorAI-db-beta/README.md`
- `actian-vectorAI-db-beta/docs/api.md`
- `actian-vectorAI-db-beta/examples/README.md`
- `actian-vectorAI-db-beta/examples/rag/*`
- `actian-vectorAI-db-beta/docker-compose.yml`

Last reviewed: 2026-04-14

---

## 1. What This Repo Gives You

`actian-vectorAI-db-beta` provides:

- A Dockerized Actian VectorAI DB server.
- A Python client SDK (`actian_vectorai`) with sync and async clients.
- A broad set of runnable examples (37 scripts) across collections, points, search, VDE operations, transport, resilience, and telemetry.
- RAG examples (both newer SDK-style and older `cortex`-style examples).

Core concept:

- VectorAI DB is a vector storage + similarity search engine.
- You bring your own embedding model (OpenAI, sentence-transformers, etc.).

---

## 2. Quick Start Commands

From `actian-vectorAI-db-beta/`:

```bash
# Start DB
docker compose up -d

# Stop DB
docker compose down
```

Create Python env and install SDK:

```bash
python3 -m venv .venv
source .venv/bin/activate

# Option A: install local wheel shipped in repo
pip install ./actian_vectorai-0.1.0b2-py3-none-any.whl

# Option B: install from PyPI
pip install actian-vectorai
```

Optional RAG dependencies:

```bash
pip install -r examples/rag/requirements.txt
```

---

## 3. Docker/Runtime Defaults

From `docker-compose.yml`:

- Container name: `vectoraidb`
- Image: `williamimoh/actian-vectorai-db:latest`
- gRPC port: `50051` (host `50051` -> container `50051`)
- Persisted data/logs volume: `./data:/data`
- Restart policy: `unless-stopped`

Useful runtime checks:

```bash
docker ps | grep vectoraidb
docker logs vectoraidb
```

Server log file is also persisted under:

- `actian-vectorAI-db-beta/data/vde.log`

---

## 4. SDK Shape (Most Important API Surface)

Primary package:

- `actian_vectorai` (Python >= 3.10)

Two client modes:

- `VectorAIClient` (sync)
- `AsyncVectorAIClient` (async)

Main namespaces:

- `client.collections`
- `client.points`
- `client.vde`

### 4.1 Collections namespace

Core methods:

- `create`
- `get_info`
- `list`
- `exists`
- `update`
- `delete`
- `recreate`
- `get_or_create`

### 4.2 Points namespace

Core methods:

- `upsert`, `upsert_single`, `upload_points`
- `get`
- `delete`, `delete_by_ids`
- `update_vectors`
- `set_payload`, `overwrite_payload`, `delete_payload`, `clear_payload`
- `search`, `search_batch`
- `query`, `query_batch`
- `count`
- `scroll`, `scroll_all`
- `create_field_index` (limited on current server; see limitations below)

### 4.3 VDE namespace

Engine and maintenance methods:

- `open_collection`, `close_collection`
- `save_snapshot`, `load_snapshot`
- `get_state`, `get_vector_count`, `get_stats`, `get_optimizations`
- `flush`, `rebuild_index`, `optimize`
- `trigger_rebuild`, `get_rebuild_task`, `list_rebuild_tasks`, `cancel_rebuild_task`
- `compact_collection`

---

## 5. Search, Filters, and Retrieval Patterns

### 5.1 Distance metrics

- `Distance.Cosine` (recommended default for normalized vectors)
- `Distance.Euclid`
- `Distance.Dot`

### 5.2 Filter DSL

Key builders:

- `Field(...)`
- `FilterBuilder()`
- helpers: `has_id`, `has_vector`, `is_empty`, `is_null`, `nested`

Common usage:

- exact matches (`eq`)
- range filters (`gt`, `lte`, `between`)
- membership (`any_of`, `except_of`)
- boolean composition with `must`, `must_not`, `should`

### 5.3 Hybrid retrieval

Client-side fusion utilities:

- `reciprocal_rank_fusion(...)`
- `distribution_based_score_fusion(...)`

Use these to combine dense + sparse or multi-query result sets.

---

## 6. Performance and Scale Features

Useful built-ins:

- `SmartBatcher` + `BatcherConfig` for high-throughput ingestion.
- Connection pooling with `pool_size > 1` to increase concurrent gRPC throughput.
- `SearchParams` for tuning (`hnsw_ef`, exact mode, quantization params, etc.).
- Quantization support (`Scalar`, `Product`, `Binary`) to trade memory for speed/cost.

---

## 7. Transport, Security, and Reliability

### 7.1 Transport modes

- gRPC is the primary transport.
- REST fallback available via `RESTTransport` (for environments where gRPC is blocked).

### 7.2 TLS/mTLS

Client supports:

- TLS with CA cert
- mTLS with client cert/key

### 7.3 Reliability primitives

From `actian_vectorai.resilience`:

- `CircuitBreaker`
- `RetryConfig` (backoff + jitter)
- `BackpressureController` (+ server signal handling)

### 7.4 Observability

From `actian_vectorai.telemetry`:

- structured JSON logging
- OpenTelemetry spans (`trace_operation`)
- request metrics (`record_request`)
- user-agent builder (`build_user_agent`)

---

## 8. Example Map (What to Run for What)

Recommended progression:

1. `examples/01_hello_world.py`
2. `examples/03_collection_management.py`
3. `examples/04_point_crud.py`
4. `examples/05_vector_search.py`
5. `examples/06_filtered_search.py`

By topic:

- Search/query: `05`, `06`, `09`, `12`, `15`, `17`, `21`, `33`
- Indexing/filter internals: `10`, `11`, `32`
- VDE operations: `16`, `26`
- Transport/security: `13`, `19`, `20`, `22`
- Reliability/errors: `14`, `18`, `27`
- Batch/throughput: `08`, `30`
- RAG integration: `35` and `examples/rag/rag_example.py`
- Telemetry: `36`
- Pagination: `37`
- Full API sweep: `25_comprehensive_api.py`

---

## 8.1 Full Example Catalog (37 Scripts)

- `01_hello_world.py`: Minimal sync flow (connect, create, upsert, search).
- `02_async_hello_world.py`: Async variant of hello world.
- `03_collection_management.py`: Full collection lifecycle methods.
- `04_point_crud.py`: Basic point CRUD.
- `05_vector_search.py`: Core similarity search usage.
- `06_filtered_search.py`: Search with metadata filters.
- `07_payload_management.py`: Set/overwrite/delete/clear payload fields.
- `08_batch_upload.py`: Batch ingestion with upload helpers.
- `09_query_api.py`: Universal query API and query_batch.
- `10_field_indexes.py`: Field index creation examples.
- `11_advanced_filters.py`: Full Filter DSL patterns.
- `12_search_params.py`: Search tuning parameters.
- `13_rest_transport.py`: HTTP/REST transport usage.
- `14_resilience.py`: Circuit breaker, retries, backpressure.
- `15_hybrid_fusion.py`: Dense+sparse fusion strategies.
- `16_vde_operations.py`: VDE lifecycle and maintenance.
- `17_semantic_search.py`: Semantic search pattern.
- `18_error_handling.py`: Error handling approaches.
- `19_tls_connection.py`: TLS/mTLS examples.
- `20_connection_pool.py`: Multi-channel connection pooling.
- `21_search_batch.py`: Batch search/query examples.
- `22_interceptors.py`: Auth/retry/tracing/logging/etc interceptors.
- `23_delete_operations.py`: Delete semantics and strict mode.
- `24_async_concurrent.py`: Async parallel operations.
- `25_comprehensive_api.py`: Comprehensive method coverage.
- `26_advanced_vde.py`: Advanced rebuild and compaction management.
- `27_exception_handling.py`: Exception hierarchy usage.
- `28_uuid_point_ids.py`: UUID point ID patterns.
- `29_named_vectors.py`: Named vector collections.
- `30_smart_batcher.py`: SmartBatcher for ingestion throughput.
- `31_delete_points.py`: Strict vs non-strict delete behavior.
- `32_field_indexes.py`: Field index plus verification.
- `33_sparse_vectors.py`: Sparse retrieval examples.
- `34_quantization.py`: Quantized vectors/search tradeoffs.
- `35_rag_integration.py`: RAG integration with new SDK style.
- `36_telemetry.py`: Logging/metrics/tracing instrumentation.
- `37_scroll_pagination.py`: Scroll and pagination flow.

---

## 9. RAG-Specific Notes

### 9.1 End-to-end RAG flow in repo docs

The repo’s RAG docs cover:

1. chunk docs
2. embed chunks
3. store vectors + payload
4. embed query
5. retrieve top-k context
6. generate answer with context

### 9.2 Practical dependencies

- `sentence-transformers` for embeddings
- optional `openai` for answer generation

### 9.3 Important compatibility note

There are mixed-generation examples:

- Newer SDK path: `actian_vectorai` package (most `examples/*.py` and `docs/api.md`).
- Legacy path: some scripts in `examples/rag/*` and `test/*` import `cortex` / `actiancortex`.

If you are building new features, prefer `actian_vectorai`-based examples and API docs.

---

## 10. Live Server Availability and Limits (From `docs/api.md`)

Current status summarized in repo docs:

- 44 client-level methods tracked
- 43 available
- 1 limited

Known validated limitations:

- Dynamic `create_field_index` currently returns `UNIMPLEMENTED`.
- Sparse vector upserts can fail with validation errors in current build.
- Multi-dense vector upserts can fail with validation errors in current build.

Known issues listed in repo README:

- CRTX-202: closing/deleting collections during active read/write is unsupported.
- CRTX-232: scroll API terminology uses `cursor` to indicate offset.
- CRTX-233: get_many API does not return vector IDs.

---

## 11. Inconsistencies You Should Know Before Copy/Paste

Some docs/scripts refer to paths or package names that may not match exactly:

- README references `examples/quick_start.py`, `examples/async_example.py`, and `examples/batch_upsert.py`, but the actual files in this repo are numbered variants (for example `01_hello_world.py`, `02_async_hello_world.py`, `08_batch_upload.py`).
- `examples/rag/VALIDATION.md` and `examples/rag/rag_example.py` use older `cortex` package naming, while the main SDK docs are for `actian_vectorai`.

Use `examples/README.md` + `docs/api.md` as the most reliable index for current API usage.

---

## 12. Best-Practice Integration Guidance for This Project

For this `vector-ai` project:

- Use Actian as storage/search backend only; generate embeddings externally.
- Keep at least two collections/index profiles:
  - `company_docs`
  - `conversation_memory`
- Enforce model-dimension consistency per collection.
- Store rich payload metadata (`source`, `chunk_id`, timestamps, user/session tags).
- Prefer batched upserts for ingestion throughput.
- For conversation memory retrieval, combine vector similarity + metadata filters (`user_id`, `session_id`, time range).
- Add startup health checks and clear error handling for gRPC availability.

---

## 13. Handy Command Checklist

```bash
# Start DB
docker compose up -d

# Check DB
docker ps | grep vectoraidb
docker logs vectoraidb

# Install SDK
pip install actian-vectorai

# Run starter examples
python examples/01_hello_world.py
python examples/05_vector_search.py
python examples/35_rag_integration.py

# Run RAG demo (legacy cortex-style script)
python examples/rag/rag_example.py --local
```

---

## 13.1 REST Endpoint Cheat Sheet (`RESTTransport`)

- `GET /healthz`
- `GET /collections`
- `PUT /collections/{name}`
- `GET /collections/{name}`
- `DELETE /collections/{name}`
- `GET /collections/{name}/exists`
- `PATCH /collections/{name}`
- `PUT /collections/{name}/points`
- `POST /collections/{name}/points`
- `POST /collections/{name}/points/delete`
- `POST /collections/{name}/points/search`
- `POST /collections/{name}/points/query`
- `POST /collections/{name}/points/search/batch`
- `POST /collections/{name}/points/query/batch`
- `POST /collections/{name}/points/count`
- `POST /collections/{name}/points/payload`
- `PUT /collections/{name}/points/payload`
- `POST /collections/{name}/points/payload/delete`
- `POST /collections/{name}/points/payload/clear`
- `PUT /collections/{name}/points/vectors`
- `PUT /collections/{name}/index`

---

## 14. Source Paths (for fast lookup)

- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/README.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/docs/api.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/examples/README.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/examples/rag/README.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/examples/rag/WORKFLOW.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/examples/rag/VALIDATION.md`
- `/Users/mdkaifansari04/code/projects/vector-ai/actian-vectorAI-db-beta/docker-compose.yml`
