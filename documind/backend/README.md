# DocuMind Backend (Phase 1)

Class-based FastAPI backend foundation for:

- Instance management
- Knowledge-base management
- Resource ingestion (text/markdown/pdf/url/conversation JSON)
- Semantic search and RAG query
- Conversation memory namespace
- Basic observability endpoints

## Run

```bash
cd documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

`requirements.txt` installs the Actian SDK from the local wheel in `actian-vectorAI-db-beta/`.

Or:

```bash
uvicorn app.main:app --reload --port 8000
```

## Core Endpoints

- `GET /health`
- `POST /instances`
- `GET /instances`
- `POST /knowledge-bases`
- `GET /knowledge-bases`
- `GET /knowledge-bases/{kb_id}`
- `POST /resources` (multipart for file uploads, JSON for text/markdown)
- `GET /resources?kb_id=...` or `GET /resources?instance_id=...&namespace_id=...`
- `POST /search`
- `POST /query`
- `POST /search/instance` (search without passing `kb_id`)
- `POST /query/instance` (query without passing `kb_id`)
- `POST /search/advanced` (instance-scoped filtered + hybrid retrieval)
- `POST /query/advanced` (instance-scoped filtered + hybrid RAG)
- `POST /memory/ingest`
- `POST /memory/query`
- `GET /observability/scores?kb_id=...&window=1h`
- `GET /observability/alerts?kb_id=...&window=1h`

## Notes

- Control-plane storage currently runs on SQLite for speed (`documind.db`).
- Prisma schema is included under `prisma/schema.prisma` for PostgreSQL transition.
- Vector storage/search uses Actian VectorAI DB on `localhost:50051`.

## Resource Ingestion Formats

- `multipart/form-data`:
  - Use for file uploads (`pdf`, `markdown`, `text`, etc.)
  - Fields: `source_type`, optional target (`kb_id` OR `instance_id + namespace_id`), optional `content`, optional `file`, optional `source_ref`, `user_id`, `session_id`
- `application/json`:
  - Use for inline text payloads
  - Fields: `source_type`, `content`, optional target (`kb_id` OR `instance_id + namespace_id`), optional `source_ref`, `user_id`, `session_id`

## No `kb_id` Client Flow

Use instance + namespace and let the backend resolve KB internally:

```json
POST /resources
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "source_type": "text",
  "content": "Deploy flow: merge main, wait for CI, release.",
  "source_ref": "deploy-notes.txt"
}
```

If KB for the given `instance_id + namespace_id` does not exist, `/resources` will auto-create one with default settings and continue ingestion.

```json
POST /search/instance
{
  "instance_id": "inst_123",
  "namespace_id": "company_docs",
  "query": "how do we deploy",
  "top_k": 5
}
```

```json
POST /search/advanced
{
  "instance_id": "inst_123",
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
      { "field": "source_type", "op": "any_of", "value": ["text", "markdown"] },
      { "field": "user_id", "op": "eq", "value": "user_123" }
    ]
  },
  "top_k": 5
}
```

`mode = "hybrid"` currently fuses:
- dense semantic vector retrieval
- lexical keyword scoring over payload text

Sparse-vector hybrid is planned as a hardening upgrade once sparse indexing is enabled in the target deployment.

## Advanced Retrieval + Hardening Plan

- Detailed design and implementation roadmap:
  - `documind/backend/ADVANCED_RETRIEVAL_README.md`

## Current Phase Decisions

- Keep SQLite as the active control-plane DB for advanced retrieval implementation and testing.
- Defer Neon/PostgreSQL migration until deployment or multi-user requirements are in scope.
- Deployment complexity is out of scope for the current hackathon phase.
- Agent integration packaging (CLI wrapper vs MCP server) will be selected after filtered + hybrid retrieval validation.
