# DocuMind Backend: Implementation + Test Guide

This guide is a short developer checklist for what was implemented and how to validate it manually using Postman.

## 1. What Was Implemented

### Architecture

- Class-based FastAPI backend (routers + services + runtime container).
- Vector search/storage via Actian VectorAI DB.
- Control-plane storage via SQLite (fast MVP path).
- Embedding routing (`minilm`, `bge`, `openai`) with per-KB model selection.

### Main Features

- Instance management
- Knowledge base creation/list/get
- Resource ingestion (text/markdown/pdf/url/conversation JSON)
- Semantic search endpoint
- RAG query endpoint (OpenAI when key exists, local fallback otherwise)
- Memory namespace endpoints (ingest/query)
- Basic observability scores/alerts

## 2. File Map (Feature -> Where It Lives)

### App wiring

- App entry + route registration: `app/main.py`
- Runtime container and dependency wiring: `app/runtime.py`
- Env config: `app/config.py`

### Data and platform

- Control-plane DB (SQLite tables + CRUD): `app/database.py`
- Vector DB wrapper (Actian SDK): `app/vectordb.py`
- Embedding router/models: `app/embeddings.py`

### Services

- Ingestion pipeline (parse/chunk/embed/upsert): `app/services/ingestion.py`
- Retrieval/search logic: `app/services/retrieval.py`
- Answer generation: `app/services/agent.py`
- Observability aggregation: `app/services/observability.py`

### Routers

- `/instances`: `app/routers/instances.py`
- `/knowledge-bases`: `app/routers/knowledge_bases.py`
- `/resources`: `app/routers/resources.py`
- `/search`, `/query`: `app/routers/query.py`
- `/memory/*`: `app/routers/memory.py`
- `/observability/*`: `app/routers/observability.py`

### Schemas

- Request/response models: `app/models/schemas.py`

### Other

- Backend runner: `main.py`
- Dependencies: `requirements.txt`
- Prisma schema scaffold: `prisma/schema.prisma`

## 3. Pre-Test Setup

### 3.1 Start Vector DB

From the project root directory (or one level up from `documind/backend`):


### 3.2 Start backend

```bash
cd documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Backend base URL for Postman:

- `http://localhost:8000`

## 4. Postman Test Flow (Step by Step)

Run in this order.

### Step 1: Health

- Method: `GET`
- URL: `http://localhost:8000/health`
- Expect: `200` and vectordb info.

### Step 2: Create instance

- Method: `POST`
- URL: `http://localhost:8000/instances`
- Body (JSON):

```json
{
  "name": "Acme Corp",
  "description": "Manual QA instance"
}
```

- Save `id` as `instance_id`.

### Step 3: Create knowledge base

- Method: `POST`
- URL: `http://localhost:8000/knowledge-bases`
- Body (JSON):

```json
{
  "instance_id": "<instance_id>",
  "name": "Engineering Docs",
  "namespace_id": "company_docs",
  "embedding_model": "minilm",
  "distance_metric": "cosine"
}
```

- Save `id` as `kb_id`.

### Step 4: Ingest resource (`POST /resources`)

Targeting options:

- Option 1: pass `kb_id` directly
- Option 2: pass `instance_id + namespace_id` and let backend resolve the KB
- If no KB exists for that instance+namespace, ingest will auto-create one and proceed

#### Option A: JSON ingest (best for inline text/markdown)

- Method: `POST`
- URL: `http://localhost:8000/resources`
- Headers:
  - `Content-Type: application/json`
- Body (JSON):

```json
{
  "kb_id": "<kb_id>",
  "source_type": "text",
  "content": "Payments deploy flow: push main, CI builds image, release to prod.",
  "source_ref": "deploy-notes.txt",
  "user_id": "user_123",
  "session_id": "sess_001"
}
```

Alternative (no `kb_id` in request):

```json
{
  "instance_id": "<instance_id>",
  "namespace_id": "company_docs",
  "source_type": "text",
  "content": "Payments deploy flow: push main, CI builds image, release to prod.",
  "source_ref": "deploy-notes.txt"
}
```

Markdown inline example:

```json
{
  "kb_id": "<kb_id>",
  "source_type": "markdown",
  "content": "# Deploy Notes\n1. Merge to main\n2. Wait for CI\n3. Release",
  "source_ref": "deploy-notes.md"
}
```

Expected response:

```json
{
  "status": "success",
  "resource_id": "2a0b6f9f-9d80-4b3a-9ff5-7d7130a0c3d9",
  "chunks_indexed": 1
}
```

#### Option B: multipart/form-data ingest (best for file upload)

- Method: `POST`
- URL: `http://localhost:8000/resources`
- Body type: `form-data`
- Fields:
  - `kb_id` = `<kb_id>` OR (`instance_id` + optional `namespace_id`)
  - `source_type` = `markdown` (or `pdf`, `text`, `url`)
  - `file` = upload local file (e.g. `notes.md`)
  - `source_ref` = optional override of filename
  - `user_id` = optional
  - `session_id` = optional

Expected response:

```json
{
  "status": "success",
  "resource_id": "7dbbf06f-912d-468f-9493-c1dd808bd28c",
  "chunks_indexed": 3
}
```

### Step 5: List resources

- Method: `GET`
- URL: `http://localhost:8000/resources?instance_id=<instance_id>&namespace_id=company_docs` (recommended)
- Alternative URL: `http://localhost:8000/resources?kb_id=<kb_id>` (legacy)
- Expect: at least 1 resource with `status=done`.

### Step 6: Semantic search

- Method: `POST`
- URL: `http://localhost:8000/search`
- Body (JSON):

```json
{
  "kb_id": "<kb_id>",
  "query": "how do we deploy payments service",
  "top_k": 3
}
```

- Expect: `results` array with chunks and scores.

### Step 7: RAG query

- Method: `POST`
- URL: `http://localhost:8000/query`
- Body (JSON):

```json
{
  "kb_id": "<kb_id>",
  "question": "How do we deploy the payments service?",
  "top_k": 3
}
```

- Expect:
  - `answer`
  - `sources[]`
  - `response_ms`

### Step 8: Advanced filtered/hybrid search

- Method: `POST`
- URL: `http://localhost:8000/search/advanced`
- Body (JSON):

```json
{
  "instance_id": "<instance_id>",
  "namespace_id": "company_docs",
  "query": "deployment notes for user_123",
  "mode": "hybrid",
  "hybrid": {
    "method": "rrf",
    "dense_weight": 0.7,
    "keyword_weight": 0.3
  },
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

- Expect: `results[]` with filtered + fused ranking.
- Hybrid behavior note:
  - dense semantic vector search + lexical payload keyword scoring are fused via `rrf`/`dbsf`.

### Step 9: Advanced filtered/hybrid query

- Method: `POST`
- URL: `http://localhost:8000/query/advanced`
- Body (JSON):

```json
{
  "instance_id": "<instance_id>",
  "namespace_id": "company_docs",
  "question": "Summarize deployment constraints from docs.",
  "mode": "hybrid",
  "hybrid": {
    "method": "rrf",
    "dense_weight": 0.7,
    "keyword_weight": 0.3
  },
  "filters": {
    "must": [
      {"field": "source_type", "op": "any_of", "value": ["text", "markdown"]}
    ]
  },
  "top_k": 5
}
```

- Expect:
  - `answer`
  - `sources[]`
  - `response_ms`
  - `mode = hybrid`

### Step 10: Memory ingest

- Method: `POST`
- URL: `http://localhost:8000/memory/ingest`
- Body (JSON):

```json
{
  "instance_id": "<instance_id>",
  "conversation_id": "conv_001",
  "user_id": "user_123",
  "session_id": "sess_001",
  "messages": [
    {"role": "user", "content": "I prefer weekly summaries."},
    {"role": "assistant", "content": "Noted, weekly summaries."}
  ]
}
```

- Expect: `status=success`, `memories_indexed > 0`, `kb_id`.

### Step 11: Memory query

- Method: `POST`
- URL: `http://localhost:8000/memory/query`
- Body (JSON):

```json
{
  "instance_id": "<instance_id>",
  "user_id": "user_123",
  "query": "What reporting cadence does the user prefer?",
  "top_k": 5
}
```

- Expect: `memories[]` with relevant memory chunks.

### Step 12: Observability scores

- Method: `GET`
- URL: `http://localhost:8000/observability/scores?kb_id=<kb_id>&window=1h`
- Expect: `total_queries >= 1` after using `/query`.

### Step 13: Observability alerts

- Method: `GET`
- URL: `http://localhost:8000/observability/alerts?kb_id=<kb_id>&window=1h`
- Expect: alerts array (can be empty).

### Step 14: Debug collections

- Method: `GET`
- URL: `http://localhost:8000/collections`
- Expect:
  - `collections`: physical Actian collection names
  - `knowledge_bases`: control-plane KB records

## 5. Postman Notes

### Ingesting PDF

For PDF ingestion in `/resources`:

- `source_type = pdf`
- Attach file in `file` form-data field
- Do not send `content` manually (server will base64 it internally)

### Ingesting Text / Markdown (JSON)

For inline content ingestion in `/resources`:

- Set header `Content-Type: application/json`
- Use `source_type = text` or `source_type = markdown`
- Put your full body in `content`
- Pass either:
  - `instance_id + namespace_id` (recommended)
  - or `kb_id` (legacy)

### Ingesting URL

For URL ingestion in `/resources`:

- `source_type = url`
- Put URL in `content` field
- Example content: `https://example.com/docs/deploy`

## 6. Human Review Checklist

- [ ] `/health` works and shows VectorAI DB details
- [ ] Instance creation/list works
- [ ] KB creation creates both control-plane row and Actian collection
- [ ] Ingestion creates resource and indexes chunks
- [ ] `/search` returns semantically relevant chunks
- [ ] `/query` returns answer + sources + latency
- [ ] Memory endpoints work for user-specific retrieval
- [ ] Observability endpoints return aggregates without errors

## 7. Current Scope Notes

- SQLite is currently used for control-plane speed in hackathon mode.
- SQLite remains the chosen control-plane DB through advanced retrieval implementation and manual validation.
- Prisma/PostgreSQL schema is scaffolded but intentionally deferred until deployment/multi-user scope.
- Deployment concerns are intentionally skipped in this phase to keep implementation fast and focused.
- CLI wrapper vs MCP server integration packaging will be decided after filtered + hybrid feature validation.
- Observability scoring currently uses lightweight placeholders (retrieval-based approximation).
