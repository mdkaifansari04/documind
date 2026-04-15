# Actian Open Questions (Current Implementation Only)

Last updated: 2026-04-14

Purpose:
- Track only the questions that matter for the backend as it exists right now.
- Paste Actian responses directly under each question.
- Use this as decision input for Phase 2 / hardening work.

## Current Implementation Snapshot

- Retrieval modes:
  - semantic (dense vector search)
  - hybrid (dense semantic + lexical payload scoring, fused in app code)
- Filters used on payload metadata:
  - `source_type`, `user_id`, `session_id`, `namespace_id`
- Distance:
  - cosine
- Storage strategy:
  - one vector collection per KB (per `instance_id + namespace_id`)

## Questions to Actian

### Q1. Best native path for semantic + keyword hybrid

We currently run hybrid as:
1. dense vector search
2. lexical keyword scoring over payload text
3. client-side fusion (`rrf` / `dbsf`)

Question:
- Is there a better native production approach in current Actian server/client versions for semantic+keyword hybrid retrieval?

Actian response:
- 

Decision for our codebase:
- 

### Q2. Field indexes for our metadata filters

Current filters:
- `source_type`
- `user_id`
- `session_id`
- `namespace_id`

Question:
- Should we create explicit field indexes for these fields?
- If yes, what index types are recommended for our operators (`eq`, `any_of`, `text`, range)?

Actian response:
- 

Decision for our codebase:
- 

### Q3. Cosine distance and vector normalization

Question:
- With cosine distance, should we enforce L2 normalization for all embeddings before upsert/query to keep score behavior consistent?

Actian response:
- 

Decision for our codebase:
- 

### Q4. Collection strategy at our current scale

Current strategy:
- one collection per KB (KB resolved from `instance_id + namespace_id`)

Question:
- Is this the recommended strategy for our expected scale, or should we use fewer shared collections with stronger metadata filtering?

Actian response:
- 

Decision for our codebase:
- 

## Final Summary (Fill After Responses)

- Keep/Change hybrid approach:
- Keep/Change indexing strategy:
- Keep/Change normalization policy:
- Keep/Change collection partition strategy:
