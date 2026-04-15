# Hackathon Advanced Retrieval README

Last Updated: 2026-04-14

## 1. Organizer Requirement

Your project must go beyond basic similarity search and use at least one:

- Hybrid fusion
- Filtered search
- Named vectors / multimodal

## 1.1 Decision Lock (2026-04-14)

- Control-plane DB stays on **SQLite** for current implementation and the final advanced-retrieval phase.
- **Neon + Prisma** migration is deferred until deployment or multi-user requirements appear.
- Deployment concerns are intentionally out of scope for this phase to keep build velocity high.
- For agent integration packaging, we will decide between **CLI wrapper** and **MCP server** after filtered/hybrid implementation and manual testing.

## 2. Current Backend Status (What Exists Today)

Already implemented in `documind/backend`:

- Basic vector similarity search (`/search`, `/query`)
- Metadata payload writing during ingestion (`source_type`, `resource_id`, `namespace_id`, `user_id`, `session_id`, `source_ref`)
- Memory namespace workflow (`/memory/ingest`, `/memory/query`)
- Collection-per-KB model with a single vector space per collection

Current gap vs hackathon requirement:

- No general filtered-search API exposed for document retrieval
- No hybrid fusion endpoint
- No named-vector collection creation path
- No multimodal embedding path yet

## 3. What Actian Repo Confirms We Can Use

Evidence from local repo:

- Filtered search DSL: `actian-vectorAI-db-beta/examples/06_filtered_search.py`
- Advanced filters: `actian-vectorAI-db-beta/examples/11_advanced_filters.py`
- Client-side fusion (RRF, DBSF): `actian-vectorAI-db-beta/examples/15_hybrid_fusion.py`
- Named vectors: `actian-vectorAI-db-beta/examples/29_named_vectors.py`
- Sparse + dense hybrid setup (server-dependent): `actian-vectorAI-db-beta/examples/33_sparse_vectors.py`
- API reference for `search(using=...)`, `query(prefetch=...)`, fusion helpers: `actian-vectorAI-db-beta/docs/api.md`

## 4. Option Matrix

| Option | What we implement | Effort | Risk | Hackathon impact |
|---|---|---|---|---|
| A | Filtered search only | Low | Low | Meets requirement safely |
| B | Filtered search + Hybrid fusion | Medium | Low-Medium | Strong demo and clearly beyond baseline |
| C | Filtered + Hybrid + Named vectors | Medium-High | Medium | Best story if we have time |
| D | Add multimodal now (image/text) | High | High | High wow, but risky for hackathon timeline |

## 5. Recommended Path

Recommended: **Option B now**, then **Option C as stretch**.

Why:

- Filtered search is the fastest guaranteed compliance.
- Hybrid fusion gives visible quality gains for judge demos.
- Named vectors can be added without full multimodal infrastructure.
- Sparse-vector and full multimodal paths are more fragile/time-heavy for current phase.

## 6. Proposed Feature Design

### 6.1 Feature 1: Filtered Search (Must-Ship)

Add optional filter object in advanced search/query APIs.

Proposed request structure:

```json
{
  "kb_id": "KB_ID",
  "query": "what did we discuss about deployment?",
  "top_k": 5,
  "filters": {
    "must": [
      { "field": "source_type", "op": "eq", "value": "conversation_history_json" },
      { "field": "user_id", "op": "eq", "value": "user_123" }
    ],
    "must_not": [
      { "field": "session_id", "op": "eq", "value": "debug-session" }
    ]
  }
}
```

Supported operators in v1:

- `eq`
- `any_of`
- `text`
- `between`
- `gt`, `gte`, `lt`, `lte`

### 6.2 Feature 2: Hybrid Fusion (Recommended)

Implement client-side fusion in retrieval service:

1. Dense semantic search using full user query
2. Secondary search using a keyword-focused query string
3. Fuse result sets with:
   - `reciprocal_rank_fusion(...)` or
   - `distribution_based_score_fusion(...)`

Proposed request:

```json
{
  "kb_id": "KB_ID",
  "query": "summarize memory retrieval architecture and API constraints",
  "top_k": 6,
  "mode": "hybrid",
  "hybrid": {
    "method": "rrf",
    "dense_weight": 0.7,
    "keyword_weight": 0.3
  },
  "filters": {
    "must": [
      { "field": "namespace_id", "op": "eq", "value": "company_docs" }
    ]
  }
}
```

### 6.3 Feature 3: Named Vectors (Stretch, No Multimodal Required)

Create selected KBs with named vector spaces:

- `text` vector (docs/resources)
- `memory` vector (conversation chunks)

Then query with `using="text"` or `using="memory"` depending use case.

This satisfies the "named vectors" requirement even without image embeddings.

## 7. File-Level Change Plan (Current Backend)

1. `documind/backend/app/models/schemas.py`
- Add `AdvancedSearchRequest`, `FilterClause`, `FilterSpec`, `HybridConfig`.

2. `documind/backend/app/services/retrieval.py`
- Add filter-builder translator (JSON -> `FilterBuilder`).
- Add `search_hybrid(...)`.
- Add named-vector search support argument (`using`).

3. `documind/backend/app/vectordb.py`
- Extend `search(...)` wrapper to accept `using`, `sparse_indices`, `score_threshold`, `offset`.
- Add optional `query(...)` wrapper for prefetch-based experiments.

4. `documind/backend/app/routers/query.py`
- Keep existing `/search` and `/query` unchanged for compatibility.
- Add `/search/advanced` and `/query/advanced`.

5. `documind/backend/app/routers/knowledge_bases.py`
- Optional: add KB creation mode for named vectors (only when requested).

6. `documind/backend/app/services/ingestion.py`
- For named-vector KB mode, route vectors to correct vector name (`text` vs `memory`) when upserting.

## 8. Postman Validation Plan

1. Baseline ingest
- Use existing `POST /resources` to add pdf/markdown/url/conversation content.

2. Filtered search test
- `POST /search/advanced` with `source_type == pdf`.
- Confirm all returned payloads match filter.

3. Hybrid fusion test
- `POST /search/advanced` with `"mode":"hybrid"`.
- Confirm response includes fused results and source score order changes vs plain search.

4. Named vectors test (if stretch implemented)
- Create named-vector KB.
- Ingest docs to `text` space, memory to `memory` space.
- Search `using="text"` and `using="memory"` and compare result specialization.

## 9. Demo Story for Judges

1. Show plain search result.
2. Turn on filtered search (`source_type=conversation_history_json`) and show precision jump.
3. Turn on hybrid mode and show improved relevance ranking.
4. If stretch done, switch `using=text` vs `using=memory` to show named-vector intelligence.

## 10. Risks and Mitigations

- Sparse vector flows are marked server-limited in current API docs.
- Mitigation: use dense+dense fusion first; keep sparse as optional experiment.

- Multimodal requires additional model/runtime complexity.
- Mitigation: satisfy named-vectors requirement with text + memory first.

- Filter payload inconsistency can reduce filter quality.
- Mitigation: enforce required metadata keys during ingestion.

## 11. Final Recommendation

Implement in this order:

1. Filtered search
2. Hybrid fusion
3. Named vectors (text + memory) as stretch
4. Choose integration packaging (CLI wrapper vs MCP server) after validation

This gives a strong probability of shipping a compliant and impressive hackathon demo without overloading scope.
