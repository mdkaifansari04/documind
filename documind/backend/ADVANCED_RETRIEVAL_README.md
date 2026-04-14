# Advanced Retrieval + Phase 1.8.5 Plan

Last Updated: 2026-04-14

## 1. Contract Decision (Locked)

Client-facing APIs should not require `kb_id`.

- Primary targeting contract: `instance_id + namespace_id`
- `kb_id` remains internal implementation detail
- Legacy `kb_id` endpoints may stay for compatibility, but new work should use instance-scoped flows

Target object used in examples:

```json
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs"
}
```

## 2. Current Status Before Advanced Retrieval

Already implemented:

- Phase-1 backend foundation (instances, KBs, ingestion, search/query, memory, observability)
- No-`kb_id` ingestion targeting for `/resources` via `instance_id + namespace_id`
- KB auto-create path in ingestion if target namespace KB does not exist
- No-`kb_id` list resources (`GET /resources?instance_id=...&namespace_id=...`)
- Instance-scoped retrieval endpoints:
  - `POST /search/instance`
  - `POST /query/instance`

This means advanced retrieval must follow the same instance-scoped contract.

## 3. Advanced Retrieval API Design (Instance-Scoped)

### 3.1 `POST /search/advanced`

Request example:

```json
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "query": "deployment notes for session 2",
  "top_k": 8,
  "mode": "semantic",
  "filters": {
    "must": [
      { "field": "source_type", "op": "eq", "value": "conversation_history_json" },
      { "field": "user_id", "op": "eq", "value": "user_123" }
    ],
    "must_not": [
      { "field": "session_id", "op": "eq", "value": "debug" }
    ]
  }
}
```

Response example:

```json
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "mode": "semantic",
  "results": []
}
```

### 3.2 `POST /query/advanced`

Same target/filter contract, but returns generated answer:

```json
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "question": "Summarize deployment constraints from docs and memory.",
  "top_k": 6,
  "mode": "hybrid",
  "hybrid": {
    "method": "rrf",
    "dense_weight": 0.7,
    "keyword_weight": 0.3
  },
  "filters": {
    "must": [
      { "field": "source_type", "op": "any_of", "value": ["text", "markdown"] }
    ]
  }
}
```

### 3.3 Filter Operator Support (v1)

- `eq`
- `any_of`
- `text`
- `between`
- `gt`, `gte`, `lt`, `lte`

## 4. Hybrid Fusion Plan

For `mode = hybrid`:

1. Run dense semantic retrieval with original query.
2. Run secondary keyword-oriented retrieval.
3. Fuse ranked sets using one of:
- `rrf` (Reciprocal Rank Fusion)
- `dbsf` (Distribution-Based Score Fusion)
4. Apply `top_k` after fusion.

## 5. Phase 1.8.5 Execution Checklist

This is the remaining work to close backend Phase 1 with advanced retrieval + hardening direction.

### 5.1 Must Ship for Phase 1.8.5

- [ ] Add advanced schemas in `app/models/schemas.py`
  - `FilterClause`, `FilterSpec`, `HybridConfig`
  - `AdvancedSearchRequest`, `AdvancedQueryRequest`
- [ ] Add KB resolver helper for advanced routes (`instance_id + namespace_id -> kb`)
- [ ] Implement filter translator in `app/services/retrieval.py` (JSON -> Actian `FilterBuilder`)
- [ ] Implement hybrid search mode in retrieval service
- [ ] Add routes in `app/routers/query.py`
  - `POST /search/advanced`
  - `POST /query/advanced`
- [ ] Unit tests:
  - filter translation behavior
  - hybrid fusion scoring/ranking behavior
  - route validation + response shape
- [ ] Postman collection updates for advanced endpoints

### 5.2 Phase 1 Exit Criteria

- [ ] Advanced filtered search works with instance-scoped target (no required `kb_id`)
- [ ] Hybrid mode works and returns stable fused ranking
- [ ] All backend tests pass
- [ ] Docs updated (`README`, `IMPLEMENTATION_TEST_GUIDE`, Postman collection)

## 6. Production Hardening (Planned Next, Not Blocking 1.8.5 Ship)

These items are queued immediately after advanced retrieval APIs are stable:

1. Async ingestion jobs
- `POST /ingestion/jobs` to enqueue large ingestion
- `GET /ingestion/jobs/{job_id}` for status/progress/errors
- states: `queued`, `running`, `done`, `failed`

2. Retry + failure handling
- retry transient parse/network/vector upsert failures
- persist failure reason payloads for debugging

3. Observability additions
- ingest job latency and failure metrics
- advanced search mode usage (`semantic` vs `hybrid`)
- hybrid quality counters (score spread, overlap)

4. Safety checks
- metadata validation before vector upsert
- strict embedding dimension checks for all model/profile paths

## 7. Rollout Order

1. `/search/advanced` (filters, semantic mode)
2. `/search/advanced` hybrid mode (`rrf` then optional `dbsf`)
3. `/query/advanced`
4. Postman + docs sync
5. Start async ingestion job hardening track
