# DocuMind Backend (Phase 1)

Last updated: 2026-04-14

Phase 1 is complete for the current hackathon scope.

This backend now includes:
- class-based FastAPI app structure
- instance + knowledge base management
- ingestion for JSON/form-data sources (text, markdown, pdf, url, conversation JSON)
- instance-scoped retrieval without requiring client `kb_id`
- advanced retrieval with filters + hybrid fusion
- memory ingestion/query namespace
- observability summary endpoints
- synced Postman collection for manual QA

## 1) Run

```bash
cd documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Requirements include local Actian SDK wheels from `actian-vectorAI-db-beta/`.

## 1.1) DCLI Quick Start (Developer-Friendly)

You can run DocuMind via global CLI command `dcli` (also available as `DCLI`).

Global install (recommended with `pipx`):

```bash
pipx install /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
```

If you are iterating on local code:

```bash
pipx reinstall documind-cli
```

If `documind-cli` is not installed yet, force-install from local path:

```bash
pipx install --force /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
```

If using a local venv directly:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
pip install -e . --no-build-isolation
```

Set backend URL (if needed):

```bash
export DOCUMIND_API_URL="http://localhost:8000"
```

First command for new users:

```bash
dcli init --namespace-id "company_docs"
```

What `dcli init` does:
- finds the latest existing instance, or creates one if none exist
- uses the provided namespace (or prompts for namespace in interactive shell if omitted)
- stores context persistently

Note:
- in non-interactive mode (agents/CI), pass `--namespace-id` explicitly

Then use:

```bash
dcli context-show
dcli search-docs --qr "deploy command" --top-k 5
dcli ask-docs -qs "What is the deploy command?" --top-k 5
```

## 2) Architecture Overview

Main runtime container (`app/runtime.py`) wires these dependencies:

```text
FastAPI routers
  -> container.store (SQLite control-plane)
  -> container.vectordb (Actian VectorAI DB)
  -> container.ingestion (parse -> chunk -> embed -> upsert)
  -> container.retrieval (semantic/hybrid retrieval + filters)
  -> container.routing (embedding/LLM profile selection)
  -> container.agent (grounded answer generation)
  -> container.observability (query-log summarization)
```

### Data model split

- Control-plane DB (`documind.db`, SQLite):
  - instances
  - knowledge_bases
  - resources
  - query_logs
- Vector-plane (Actian collection per KB):
  - chunk vectors
  - chunk payload metadata (`source_type`, `user_id`, `session_id`, `namespace_id`, etc.)

## 3) Identity and Targeting Model

### External identifiers

- `instance_id`: tenant/project boundary
- `namespace_id`: logical KB space inside an instance (`company_docs`, etc.)

### Internal identifier

- `kb_id`: internal KB row/collection mapping

### Resolution rules

- `POST /resources`:
  - accepts `kb_id` (legacy) or `instance_id + namespace_id` (preferred)
  - if instance+namespace KB does not exist, it auto-creates one
- `POST /search/instance`, `POST /query/instance`, `POST /search/advanced`, `POST /query/advanced`:
  - resolve KB via `instance_id + namespace_id`
  - return `404` if not found (no auto-create here)

Code path (actual implementation):

```python
# app/routers/query.py
kb = container.store.find_kb_by_namespace(instance_id, namespace_id)
if not kb:
    raise HTTPException(404, "Knowledge base not found for instance_id + namespace_id")
```

## 4) Endpoint Surface

### System

- `GET /health`
- `GET /collections`

### Instances

- `POST /instances`
- `GET /instances`

### Knowledge Bases

- `POST /knowledge-bases`
- `GET /knowledge-bases`
- `GET /knowledge-bases/{kb_id}`

### Resources (Ingestion + Listing)

- `POST /resources`
- `GET /resources?instance_id=...&namespace_id=...` (preferred)
- `GET /resources?kb_id=...` (legacy)

### Retrieval + RAG

- `POST /search` (legacy `kb_id`)
- `POST /query` (legacy `kb_id`)
- `POST /search/instance`
- `POST /query/instance`
- `POST /search/advanced`
- `POST /query/advanced`

### Memory

- `POST /memory/ingest`
- `POST /memory/query`

### Observability

- `GET /observability/scores?kb_id=...&window=1h`
- `GET /observability/alerts?kb_id=...&window=1h`

## 5) Ingestion Internals

Pipeline (`app/services/ingestion.py`):
1. Parse by `source_type`
2. Chunk text with overlap
3. Embed chunks
4. Validate embedding dimension against KB
5. Upsert points with payload metadata

Supported parser behavior:
- `text`, `markdown`, `transcript`: passthrough
- `conversation_history_json`: role/content normalization
- `pdf`: expects base64 payload; extracts text via `pypdf`
- `url`: fetches page and strips text via `BeautifulSoup`

Actual chunk/upsert loop:

```python
for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
    payload = {
        "text": chunk,
        "source_type": source_type,
        "resource_id": resource_id,
        "instance_id": metadata.get("instance_id", ""),
        "namespace_id": metadata.get("namespace_id", "company_docs"),
        "user_id": metadata.get("user_id", ""),
        "session_id": metadata.get("session_id", ""),
    }
    points.append(PointStruct(id=..., vector=vector, payload=payload))
```

## 6) Retrieval Internals

### Semantic mode

- single dense vector search (`container.retrieval.search_knowledge_base`)
- optional metadata filters translated into Actian filter DSL

### Advanced filters

Supported operators:
- `eq`
- `any_of`
- `text`
- `between`
- `gt`, `gte`, `lt`, `lte`

### Hybrid mode

Current implementation in `app/services/retrieval.py`:
1. Dense semantic vector search.
2. Lexical keyword scoring over payload text from filtered `scroll` candidates.
3. Fusion with:
   - `rrf` (weighted by `dense_weight` + `keyword_weight`)
   - or `dbsf`.

Important: this is true dual-signal fusion (semantic + lexical). It is not sparse-vector indexing yet.

## 7) “Multimodal” and “Code Search” Clarification

This project includes embedding profiles and routing logic:

- `general_text_search` -> MiniLM
- `higher_quality_text` -> MPNet
- `balanced_text` -> BGE
- `multimodal_text_image` -> CLIP
- `code_search` -> CodeBERT

What is implemented now:
- profile/model routing exists
- CLIP text embedding path exists
- CodeBERT embedding path exists

What is not fully implemented yet:
- no dedicated image binary ingestion parser/endpoint flow
- no sparse vector index pipeline

So “multimodal” in this phase means profile/model capability and routing support, not full image ingest UX.

## 8) RAG Answer Generation Behavior

`app/services/agent.py` uses:
- OpenAI chat completion if API key is present
- local fallback answer builder if key is missing or API call fails

LLM profile selection (`app/routing.py`):
- `fast`, `balanced`, `quality`
- selected from question complexity, source count, and `latency_sensitive`

## 9) Memory Namespace Behavior

`/memory/*` endpoints auto-provision a dedicated KB per instance for namespace `conversation_memory` (configurable).

Memory query uses:
- MiniLM embeddings
- metadata filter on `user_id`

This isolates memory retrieval from primary document namespaces.

## 10) Observability Behavior

`/query*` endpoints write query logs:
- retrieval score (currently avg source score)
- chunk relevance (currently same placeholder as retrieval score)
- hallucination rate (currently placeholder `0.0`)
- response latency

Observability endpoints aggregate these logs by time window.

## 11) Deep Internal Breakdown

For a full feature-by-feature internal walk-through (logic, dependencies, and code-path behavior), see:
- `documind/backend/PHASE1_INTERNAL_FEATURE_BREAKDOWN.md`
- `documind/backend/UNDERSTANDING.md` (plain-English owner guide)
- `documind/backend/ACTIAN_OPEN_QUESTIONS.md` (questions + answer tracker for Actian)

## 12) Postman Testing

Use this dedicated runbook for end-to-end testing:
- `documind/backend/POSTMAN_PHASE1_RUNBOOK.md`

Collection file:
- `documind/backend/postman/collection-v1.json`

## 13) Known Caveats and Deferred Hardening

- `(instance_id, namespace_id)` uniqueness is not yet enforced at DB constraint level.
- Async ingestion jobs/status endpoints are not implemented yet.
- Sparse-vector hybrid path is deferred; current hybrid uses lexical keyword branch.
- Control-plane currently fixed to SQLite; Prisma/PostgreSQL is deferred for later phase.
