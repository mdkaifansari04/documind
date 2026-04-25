# Vector AI - DocuMind

Last updated: 2026-04-25

DocuMind is a document intelligence stack built on top of Actian VectorAI DB.  
This repository currently includes:

- a FastAPI backend for ingestion, retrieval, advanced query, memory, and observability
- a Next.js dashboard UI for operations and querying
- an MCP server and CLI (`dcli`) for agent/tool integrations
- supporting docs and test/demo apps

## Current shipped features

### Backend (FastAPI)

- Instance management: `POST /instances`, `GET /instances`
- Knowledge base lifecycle: `POST /knowledge-bases`, `GET /knowledge-bases`, `GET /knowledge-bases/{kb_id}`
- Resource ingestion via JSON or multipart:
  - `POST /resources` (supports instance-scoped target and legacy `kb_id`)
  - source types in active use: `text`, `markdown`, `pdf`, `url`, `conversation_history_json`
- Documentation crawling:
  - `POST /resources/crawl/preview`
  - `POST /resources/crawl/ingest`
  - supports strict docs-path scope, same-domain scope, seed URLs, and skip-existing
- Retrieval + answering:
  - legacy: `POST /search`, `POST /query`
  - instance-scoped: `POST /search/instance`, `POST /query/instance`
  - advanced: `POST /search/advanced`, `POST /query/advanced`
- Advanced retrieval capabilities:
  - filter operators: `eq`, `any_of`, `text`, `between`, `gt`, `gte`, `lt`, `lte`
  - modes: semantic + hybrid (dense + lexical fusion with `rrf` / `dbsf`)
- Memory namespace endpoints:
  - `POST /memory/ingest`, `POST /memory/query`
- Observability endpoints:
  - `GET /observability/scores`
  - `GET /observability/alerts`
- System endpoints:
  - `GET /health`, `GET /collections`

### Frontend (Next.js dashboard)

- Operational dashboard pages:
  - `Overview`, `Instances`, `Knowledge Bases`, `Resources`, `Search`, `Ask`, `Chat Workspace`, `Collections & System`
- Context-aware UX:
  - active `instance + namespace (+ optional kb)` context persisted in local storage
- Resource workflows:
  - inline ingest + file upload
  - crawl preview + selective crawl ingest
- Query workflows:
  - semantic search
  - advanced search/ask controls (hybrid + filters)
  - chat workspace with scoped querying and source visibility

### CLI + MCP server

- CLI command surface (`dcli` / `documind`):
  - context bootstrap/set/show/list/delete
  - instance and namespace listing
  - ingest, search, ask, health
- MCP tools:
  - `search_docs`, `ask_docs`, `ingest_text`
  - `list_instances`, `list_knowledge_bases`, `list_namespaces`
  - `get_active_context`, `set_active_context`, guarded `create_instance`

## Repo layout

```text
.
├── actian-vectorAI-db-beta/   # Vector DB SDK assets + compose
├── documind/
│   ├── backend/               # FastAPI API, CLI, MCP server, tests
│   ├── frontend/              # Next.js operator dashboard
│   └── documentation/         # Next.js docs site
├── demo-test-app/             # auxiliary demo app
└── docs/                      # project notes, plans, runbooks
```

## Agentic Development Standard

Start every AI-agent session with:

1. `AGENTS.md` (global contract)
2. `TODOS.md` (active queue)
3. `DECISIONS.md` (current constraints)
4. nearest scoped `AGENTS.md` for touched files
5. `COMMIT.md` before creating commits

Compatibility surfaces:
- `CLAUDE.md` for Claude-based workflows
- `.github/copilot-instructions.md` for Copilot

Validation command:

```bash
./scripts/check-doc-contracts.sh
```

## Local quick start

### 1) Start Actian VectorAI DB

```bash
cd actian-vectorAI-db-beta
docker compose up -d
```

### 2) Start backend API

```bash
cd documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3) Start frontend dashboard

```bash
cd documind/frontend
bun install
NEXT_PUBLIC_API_URL=http://localhost:8000 bun run dev
```

### 4) Optional: use CLI and MCP server

```bash
cd documind/backend
source .venv/bin/activate
pip install -e . --no-build-isolation
export DOCUMIND_API_URL=http://localhost:8000
dcli init --namespace-id company_docs
```

```bash
cd documind/backend
./run_mcp_server.sh
```

## Notes and current limitations

- Instance-scoped APIs (`instance_id + namespace_id`) are the preferred contract; legacy `kb_id` routes remain for compatibility.
- Chat multi-scope selection is in preview and currently executes the primary selected scope.
- Frontend build currently allows TypeScript build errors (`typescript.ignoreBuildErrors` in Next config); tighten before production hardening.

## Contributing

Please see [`CONTRIBUTION.md`](CONTRIBUTION.md) for workflow, standards, and verification checklist.
