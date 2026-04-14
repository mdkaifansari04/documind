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
- `POST /resources` (multipart)
- `GET /resources?kb_id=...`
- `POST /search`
- `POST /query`
- `POST /memory/ingest`
- `POST /memory/query`
- `GET /observability/scores?kb_id=...&window=1h`
- `GET /observability/alerts?kb_id=...&window=1h`

## Notes

- Control-plane storage currently runs on SQLite for speed (`documind.db`).
- Prisma schema is included under `prisma/schema.prisma` for PostgreSQL transition.
- Vector storage/search uses Actian VectorAI DB on `localhost:50051`.

## Current Phase Decisions

- Keep SQLite as the active control-plane DB for advanced retrieval implementation and testing.
- Defer Neon/PostgreSQL migration until deployment or multi-user requirements are in scope.
- Deployment complexity is out of scope for the current hackathon phase.
- Agent integration packaging (CLI wrapper vs MCP server) will be selected after filtered + hybrid retrieval validation.
