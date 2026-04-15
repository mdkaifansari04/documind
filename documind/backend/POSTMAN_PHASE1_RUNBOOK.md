# Postman Runbook: Phase 1 Validation

Last updated: 2026-04-14

This runbook is for manual verification of everything shipped in backend Phase 1.

Collection:
- `documind/backend/postman/collection-v1.json`

Base URL default:
- `http://localhost:8000`

## 1) Preconditions

1. Actian VectorAI DB is running on `localhost:50051`.
2. Backend API is running on `localhost:8000`.
3. In Postman, import `collection-v1.json`.
4. Confirm collection variables:
   - `base_url = http://localhost:8000`
   - `instance_id = ""`
   - `namespace_id = company_docs`
   - `kb_id = ""`
   - `resource_id = ""`

## 2) Golden Path (Recommended Order)

Run these requests in order from folder `Phase 1 Flow`:

1. `health`
2. `create-instance`
3. `create-knowledge-base` (optional if you only use instance-scoped auto-create)
4. `ingest-resource-json-instance-scope`
5. `ingest-resource-formdata-file`
6. `list-resources-instance-scope`
7. `search-instance-scope`
8. `query-instance-scope`
9. `search-advanced-instance-scope`
10. `query-advanced-instance-scope`

Legacy compatibility checks:
11. `ingest-resource-json-kb-scope-legacy`
12. `list-resources-kb-scope-legacy`
13. `search-kb-scope-legacy`
14. `query-kb-scope-legacy`

Debug checks:
15. `Debug/list-knowledge-bases`
16. `Debug/collections`

## 3) What to Verify Per Step

### `health`

- Expect `status = "ok"`.
- Confirm `vectordb` info exists.

### `create-instance`

- Expect response with `id`.
- Test script should set collection variable `instance_id`.

### `create-knowledge-base`

- Expect response with `id`, `collection_name`, `embedding_model`, `embedding_dim`.
- Test script should set `kb_id`.

### `ingest-resource-json-instance-scope`

- This validates no-`kb_id` ingest flow.
- Expect:
  - `status = "success"`
  - `chunks_indexed > 0`
  - returned `kb_id` (resolved internally)

### `ingest-resource-formdata-file`

- Upload a `.md` or `.txt` file.
- Expect success with chunk indexing.

### `list-resources-instance-scope`

- Expect resources for resolved instance+namespace KB.

### `search-instance-scope`

- Expect `results[]` with scores and payload-backed fields:
  - `text`
  - `source_ref`
  - `resource_id`
  - `namespace_id`

### `query-instance-scope`

- Expect:
  - `answer`
  - `sources[]`
  - `response_ms`
  - `llm_profile`

### `search-advanced-instance-scope`

- Runs hybrid mode with filter clauses.
- Expect:
  - `mode = "hybrid"`
  - filtered + fused result ordering

### `query-advanced-instance-scope`

- Expect advanced retrieval + generation path.
- Check returned `mode`, `sources`, and `llm_profile`.

## 4) Advanced Retrieval Payload Notes

`/search/advanced` and `/query/advanced` support:

- `mode`:
  - `semantic`
  - `hybrid`
- `hybrid` config:
  - `method`: `rrf` or `dbsf`
  - `dense_weight`, `keyword_weight` (used by `rrf`)
- `filters`:
  - `must`
  - `must_not`

Supported filter operators:
- `eq`
- `any_of`
- `text`
- `between`
- `gt`, `gte`, `lt`, `lte`

## 5) Feature-to-Endpoint Mapping

### KB auto-resolution / no explicit `kb_id`

- `POST /resources` with `instance_id + namespace_id`
- `POST /search/instance`
- `POST /query/instance`
- `POST /search/advanced`
- `POST /query/advanced`

### Advanced retrieval

- `POST /search/advanced`
- `POST /query/advanced`

### Memory subsystem

- `POST /memory/ingest`
- `POST /memory/query`

### Observability

- `GET /observability/scores`
- `GET /observability/alerts`

## 6) Internal Dependencies (Quick Mental Model)

1. `instance_id + namespace_id` resolves one KB.
2. KB defines collection + embedding model + embedding dimension.
3. Ingestion must match KB embedding dimension.
4. Retrieval reads vectors + payload metadata from collection.
5. Query endpoints also write `query_logs`.
6. Observability endpoints aggregate `query_logs`.

If ingestion fails, retrieval/query will naturally return no meaningful results.

## 7) Useful Negative Tests

1. Send `/search/advanced` with invalid operator (for example `op: "contains"`).
   - Expect `400`.
2. Send `/resources` with missing `source_type`.
   - Expect `422`.
3. Send `/query/instance` with unknown `instance_id`.
   - Expect `404`.
4. Send `/resources` with non-existing `instance_id`.
   - Expect `404`.

## 8) Scope Clarification for This Phase

Implemented:
- profile-based routing (`code_search`, `multimodal_text_image`, etc.)
- hybrid fusion (semantic + lexical keyword branch)

Deferred:
- sparse-vector indexing flow
- async ingestion job queue/status API
- hard DB uniqueness constraint for `(instance_id, namespace_id)`
