# Understanding DocuMind Backend (Detailed Plain-English Guide)

Last updated: 2026-04-15

This file is written for you as the project owner.  
Goal: after reading this once, you should understand what every major feature does, how data moves, what is intentionally designed this way, and where the risky edges are.

## 1) If You Remember Only 5 Things

1. Your **external contract** is now mostly `instance_id + namespace_id`; `kb_id` is mostly internal plumbing.
2. Ingestion turns raw content into chunk vectors + metadata payloads in Actian.
3. Querying is retrieval first, answer generation second.
4. Advanced retrieval adds filters and hybrid ranking (semantic + lexical).
5. Phase 1 is complete; remaining work is mostly hardening/scaling decisions.

## 2) Mental Model of the System

Think of the backend as two databases plus orchestration logic:

- **Control-plane DB (SQLite)** stores business metadata:
  - instances
  - knowledge bases
  - resources
  - query logs
- **Vector DB (Actian)** stores searchable vectors and chunk payloads.

The app layer connects them:
- Routers validate/shape requests.
- Services perform business logic.
- Runtime container wires everything together.

## 3) Core Terms (No Ambiguity)

### `instance_id`
- Top-level workspace/tenant ID.
- “Whose project is this?”

### `namespace_id`
- Logical knowledge bucket inside an instance.
- Example: `company_docs`, `conversation_memory`.
- “Which section of knowledge?”

### `kb_id`
- Internal knowledge base row ID.
- Used to map control-plane row -> vector collection.
- Clients can avoid dealing with this in new APIs.

### “Collection”
- A vector table in Actian.
- Current strategy: one collection per KB.

### “Resource”
- One ingestion job input record (text file, markdown, pdf, etc.).

### “Chunk”
- A sliced piece of parsed text.
- Chunks are what actually get embedded and searched.

## 4) Code Structure and Responsibility Map

Where each concern lives:

- `app/main.py`
  - FastAPI app creation and route registration.
- `app/runtime.py`
  - global container wiring (`store`, `vectordb`, `ingestion`, `retrieval`, `agent`, etc.).
- `app/database.py`
  - SQLite schema + CRUD for control-plane entities.
- `app/vectordb.py`
  - thin wrapper around Actian SDK client operations.
- `app/services/ingestion.py`
  - parse -> chunk -> embed -> dimension check -> upsert.
- `app/services/retrieval.py`
  - semantic retrieval, filter translation, hybrid fusion.
- `app/services/agent.py`
  - answer generation (OpenAI when available, local fallback otherwise).
- `app/routing.py`
  - embedding profile and LLM profile recommendation logic.
- `app/routers/*.py`
  - endpoint-level orchestration.

## 5) End-to-End Data Flow (Ingestion to Answer)

### Step A: Ingestion
1. Client calls `POST /resources`.
2. Router resolves KB target.
3. Ingestion service parses content by source type.
4. Text is chunked with overlap.
5. Chunks are embedded.
6. Embedding dimension is validated against KB config.
7. Points are upserted into Actian collection.
8. Resource status updates from `processing` to `done` (or `failed`).

### Step B: Retrieval
1. Search endpoint receives query.
2. KB resolved (from `kb_id` legacy or `instance_id+namespace_id` preferred).
3. Query is embedded and searched in vector DB.
4. Optional filters narrow candidate chunks.
5. Results returned with payload info and scores.

### Step C: Query Answering
1. Query endpoint does retrieval first.
2. Routing service chooses LLM profile (`fast` / `balanced` / `quality`).
3. Agent builds context from source chunks.
4. Agent calls OpenAI if key exists; otherwise local fallback answer.
5. Query log record is written for observability.

## 6) API Surface Explained Like Product Flows

## Instances
- `POST /instances`
- `GET /instances`

Simple control-plane entity creation/listing.

## Knowledge Bases
- `POST /knowledge-bases`
- `GET /knowledge-bases`
- `GET /knowledge-bases/{kb_id}`

Creates control-plane KB row and a matching Actian collection.

## Resources (Ingestion + List)
- `POST /resources`
- `GET /resources?instance_id=...&namespace_id=...` (preferred)
- `GET /resources?kb_id=...` (legacy)

Most important behavior:
- `POST /resources` can auto-create KB when using instance+namespace and missing KB.

## Search/Query (Legacy)
- `POST /search`
- `POST /query`

These use `kb_id` directly.

## Search/Query (Instance-Scoped)
- `POST /search/instance`
- `POST /query/instance`

These resolve KB internally from `instance_id + namespace_id`.

## Advanced Retrieval
- `POST /search/advanced`
- `POST /query/advanced`

Adds:
- filter clauses
- retrieval mode selection (`semantic` or `hybrid`)
- hybrid config (`rrf` or `dbsf`)

## Memory
- `POST /memory/ingest`
- `POST /memory/query`

Uses dedicated memory namespace KB (`conversation_memory`) and user-scoped retrieval.

## Observability
- `GET /observability/scores`
- `GET /observability/alerts`

Aggregates query logs into lightweight metrics and alert flags.

## 7) Ingestion Internals in Detail

Supported source parsing:
- `text`, `markdown`, `transcript`: direct text.
- `conversation_history_json`: message list flattened to readable transcript lines.
- `pdf`: base64 input decoded and extracted with `pypdf`.
- `url`: fetched using `httpx`, stripped to text via `BeautifulSoup`.

Chunking:
- word-based chunking with overlap to reduce context boundary loss.

Embedding:
- selected model based on KB config (or source heuristics if needed).
- dimension mismatch is explicitly rejected.

Stored payload fields per chunk include:
- `text`
- `chunk_index`
- `source_type`
- `resource_id`
- `kb_id`
- `instance_id`
- `namespace_id`
- `source_ref`
- `user_id`
- `session_id`
- `created_at`

Why payload is important:
- it powers filtering, debugging, provenance, and future policy control.

## 8) Retrieval Internals in Detail

### Semantic mode
- Standard dense vector similarity search.
- Good for meaning-based retrieval even when exact keywords differ.

### Advanced filters
API filter clauses are translated into Actian filter expressions.

Supported operators:
- `eq`: exact equals
- `any_of`: value in set
- `text`: text condition
- `between`: lower/upper bounds
- `gt/gte/lt/lte`: numeric/date comparisons

Example advanced request:

```json
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "query": "deployment notes for user_123",
  "mode": "hybrid",
  "hybrid": {"method": "rrf", "dense_weight": 0.7, "keyword_weight": 0.3},
  "filters": {
    "must": [
      {"field": "source_type", "op": "any_of", "value": ["text", "markdown"]},
      {"field": "user_id", "op": "eq", "value": "user_123"}
    ],
    "must_not": [
      {"field": "session_id", "op": "eq", "value": "debug"}
    ]
  },
  "top_k": 5
}
```

### Hybrid mode (important clarification)
Current hybrid is:
1. dense semantic retrieval
2. lexical keyword scoring over payload text
3. result fusion (`rrf` or `dbsf`)

This is not sparse-vector hybrid yet.  
It is still valid hybrid ranking, but sparse-native path is a hardening follow-up.

## 9) Routing and Model Selection

There are two routing layers:

### Embedding profile routing (`app/routing.py` + `app/embeddings.py`)
- maps source type/hints to embedding profile
- profile maps to concrete model

Profiles and models:
- `general_text_search` -> MiniLM
- `higher_quality_text` -> MPNet
- `balanced_text` -> BGE
- `multimodal_text_image` -> CLIP
- `code_search` -> CodeBERT

### LLM response routing
- `fast`
- `balanced`
- `quality`

Selection depends on:
- explicit override
- latency sensitivity
- question length/complexity
- number of retrieved sources

## 10) Agent Answer Behavior

`app/services/agent.py`:
- Builds context from retrieved sources.
- If OpenAI key exists, sends context-grounded prompt to selected model.
- If key missing or API fails, returns deterministic local fallback answer.

Why fallback exists:
- keeps system usable in local/offline/testing conditions.

## 11) Memory Feature (How It Actually Works)

Memory is isolated by namespace:
- default namespace: `conversation_memory`

When memory endpoints are called:
1. backend ensures memory KB exists for the instance
2. creates one automatically if missing
3. ingests conversation content as chunked searchable text
4. query path filters by `user_id`

This keeps personal memory retrieval separate from main docs.

## 12) Observability Feature (Current Level)

Query endpoints log:
- query text
- retrieval score
- chunk relevance
- hallucination rate
- chunk count
- latency

Scores endpoint returns averages in a time window (`1h`, `2d`, etc.).  
Alerts endpoint currently flags:
- low retrieval quality
- high latency

Current caveat:
- some metrics are placeholders, not full evaluator-backed metrics yet.

## 13) Edge Cases and Failure Modes (Important)

1. Missing `source_type` in resource ingestion -> `422`.
2. Missing both `kb_id` and `instance_id` in JSON ingestion model -> validation error.
3. Unknown `instance_id` on ingest -> `404`.
4. Unknown KB/namespace on instance-scoped query/search -> `404`.
5. Missing both `content` and `file` for ingestion -> `400`.
6. PDF parse failure or URL fetch failure -> ingestion failure.
7. Empty parsed text or no chunks produced -> ingestion failure.
8. Embedding dimension mismatch for KB -> explicit error.
9. Invalid filter operator -> `400`.
10. Invalid `between` bounds -> `400`.
11. Hybrid mode without hybrid config -> validation error.
12. OpenAI failures do not crash query path; local fallback answer is returned.

## 14) Why Some Things Feel “Complex”

You are seeing three layers mixed together:
- product contract (`instance + namespace`)
- retrieval science (semantic/hybrid/filter/fusion)
- platform operations (collection strategy, index strategy, normalization strategy)

That complexity is normal in RAG systems.  
The docs now split those layers so decisions are easier.

## 15) What Is Finished vs Deferred

Finished in Phase 1:
- class-based backend architecture
- ingestion + parsing pipeline
- instance-scoped no-`kb_id` flows
- advanced retrieval routes and filtering
- hybrid retrieval (semantic + lexical fusion)
- memory namespace flow
- basic observability
- Postman/manual test docs and internal docs

Deferred:
- async ingestion jobs + job status endpoint
- sparse-vector native hybrid path
- strict DB uniqueness constraint for `(instance_id, namespace_id)`
- PostgreSQL/Prisma migration

## 16) Your “Owner Mode” Daily Checklist

1. Read `tomorrow.md`.
2. Run backend and execute Postman golden path.
3. Verify no regression in:
   - ingest
   - search/advanced
   - query/advanced
4. Track external decisions in `ACTIAN_OPEN_QUESTIONS.md`.
5. Convert each external decision into concrete code tasks.

## 17) Related Docs

- `documind/backend/README.md` (high-level architecture and contracts)
- `documind/backend/PHASE1_INTERNAL_FEATURE_BREAKDOWN.md` (deep technical mapping)
- `documind/backend/POSTMAN_PHASE1_RUNBOOK.md` (manual QA flow)
- `documind/backend/ACTIAN_OPEN_QUESTIONS.md` (open external questions + decisions)
- `tomorrow.md` (day handoff and next-start checklist)
