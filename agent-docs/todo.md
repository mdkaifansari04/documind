# DocuMind Implementation Reference (Living File)

Purpose: This is the operational reference file that must be updated after every implementation iteration so future work always has context.

Last Updated: 2026-04-14
Current Focus: Step One Prompt execution (backend-first).

---

## 1. Repository Map (What Each Directory Is For)

### `actian-vectorAI-db-beta/`

- Upstream/working Actian VectorAI DB repo and examples.
- Includes Docker compose, SDK docs, examples, and persistent DB data under `data/`.
- Treat this as reference + runtime dependency, not primary application code.

### `agent-docs/`

- Brainstorming and internal reference docs.
- Contains:
  - `BRAINSTROMING.md`
  - `actian-db-readme.md`
  - `resource.md`
  - `tutu.md` (this file; living implementation reference)

### `documind/`

- Product implementation workspace.
- `documind/backend/`: backend app implementation (Phase 1 priority now).
- `documind/frontend/`: frontend implementation area (not current priority).

### `steps/`

- Prompt and phase-planning artifacts.
- Current source of execution truth:
  - `steps/step-one-prompt.md`
  - `steps/step-one-branstorming.md`

### `quick-start-demo.py`

- Isolated demo script.
- Not core product architecture; keep as standalone reference/demo only.

### `SPEC.md` and `specification.md`

- Product specification docs.
- `SPEC.md` currently contains the full detailed spec.
- `specification.md` is the implementation-facing pointer/checkpoint doc.
- Rule: both must stay aligned after each meaningful implementation phase.

---

## 2. Current Execution Policy

1. Primary implementation direction comes from `steps/step-one-prompt.md`.
2. Current phase priority is backend foundation in `documind/backend/`.
3. Frontend is deferred until backend milestone is complete.
4. Every iteration must update this file (`agent-docs/tutu.md`) with:
   - What was implemented
   - What changed in structure/API
   - What remains
   - Known blockers/risks
5. Implementation style note (user directive):
   - Prefer class-based architecture for clean structure.
   - Keep comments minimal; add only high-value comments where needed.
   - Skip TDD workflow for now; prioritize fast, production-feel iteration speed.
6. Control-plane DB decision for current phase:
   - Keep SQLite as the active backend through advanced retrieval implementation and testing.
   - Defer Neon/PostgreSQL migration for later deployment/multi-user phase.
7. Deployment scope decision:
   - Deployment complexity is intentionally out of scope for current phase.
8. Integration packaging decision:
   - Choose CLI wrapper vs MCP server after filtered + hybrid features are implemented and validated.

---

## 3. Mandatory Update Checklist (After Every Iteration)

Use this checklist at the end of every coding cycle.

1. Update `agent-docs/tutu.md`:
   - Add one new entry under `Iteration Log`.
   - Update `Phase Tracker`.
   - Update `Open Risks / Blockers`.
2. Update spec documents:
   - Update `SPEC.md` if requirements changed.
   - Update `specification.md` status summary and references.
3. Update step artifacts when needed:
   - If major direction changed, append to `steps/step-one-branstorming.md`.
4. Verify runtime assumptions:
   - DB container status
   - API health (when FastAPI exists)
   - Core happy-path test command(s)
5. Record remaining work:
   - Next 1-3 concrete tasks for immediate follow-up.

---

## 4. Phase Tracker

### Phase 1: Backend Foundation (ACTIVE)

- [x] FastAPI app skeleton in `documind/backend/app/`
- [x] Config + environment wiring
- [x] Actian wrapper module
- [x] Control-plane DB integration (SQLite implemented; Prisma migration path prepared)
- [x] Instance/knowledge-base/resource APIs
- [x] Ingestion pipeline (chunk + embed + upsert)
- [x] Search/query APIs
- [x] Basic observability endpoints

### Phase 2: Agent Integration (LOCKED UNTIL PHASE 1 READY)

- [ ] LangChain agent tooling (`search_docs` etc.)
- [ ] Prompt augmentation + response generation flow
- [ ] Memory routing behavior

### Phase 3: Frontend (DEFERRED)

- [ ] React/Tailwind app scaffold
- [ ] Chat UI
- [ ] Resource ingestion dashboard
- [ ] Observability panel

---

## 5. Per-Iteration Workflow

### Before Implementation

1. Read:
   - `steps/step-one-prompt.md`
   - `steps/step-one-branstorming.md`
   - `SPEC.md`
2. Confirm current focus task (single implementation slice).
3. Define expected outputs (files/endpoints/tests).

### During Implementation

1. Implement smallest complete vertical slice.
2. Keep changes inside intended phase boundary.
3. Avoid phase bleed (do not jump to frontend/agent prematurely).

### After Implementation

1. Run verification commands.
2. Document outcomes here.
3. Sync spec notes and next steps.

---

## 6. Directory-Specific Rules

### `documind/backend/`

- This is the current source of truth for product backend code.
- Add structured app modules (`app/routers`, `app/services`, `app/models`).
- Avoid leaving only monolithic scripts long-term.

### `documind/frontend/`

- Do not implement major frontend scope until backend milestone is stable.

### `actian-vectorAI-db-beta/data/`

- Persistent vector DB storage directory.
- Treat as runtime data, not business logic source.
- Do not manually edit `.btr` files.

### `steps/`

- Keep prompts/brainstorming immutable as historical context.
- Add new step docs instead of rewriting history when decisions evolve.

---

## 7. Canonical Commands Reference

### Vector DB runtime

```bash
cd actian-vectorAI-db-beta
docker compose up -d
docker ps | grep vectoraidb
docker logs vectoraidb
```

### Backend environment (current)

```bash
cd documind/backend
source .venv/bin/activate
python main.py --local
```

When FastAPI app exists:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 8. Open Risks / Blockers

1. `documind/backend/requirements.txt` currently uses `=` pins; should move to `==` for reproducible installs.
2. Prisma/PostgreSQL path is not wired yet; this is an intentional deferral for current hackathon scope.
3. Need richer ingestion support for larger PDFs/URLs and async job processing.
4. Need stronger scoring (ragas/LLM-judge) instead of placeholder observability values.

---

## 9. Iteration Log (Append-Only)

### Iteration 0 — Setup Baseline (2026-04-14)

- Captured current folder structure and implementation rules.
- Established this file as mandatory living context reference.
- Locked execution focus to `steps/step-one-prompt.md`.
- Defined per-iteration update policy for spec + progress tracking.

### Iteration 1 — Class-Based Backend Foundation (2026-04-14)

- Implemented class-based FastAPI backend scaffold under `documind/backend/app/`.
- Added modular routers: `instances`, `knowledge_bases`, `resources`, `query`, `memory`, `observability`.
- Added class-based services: ingestion, retrieval, answer generation, observability.
- Added VectorAI DB wrapper and embedding router (MiniLM/BGE/OpenAI).
- Added SQLite control-plane store with tables for instances, KBs, resources, and query logs.
- Added Prisma schema file for planned Postgres migration.
- Added backend README and `.env.example`.
- Updated backend requirements and linked local Actian wheel install path.
- Smoke-verified endpoints via FastAPI TestClient:
  - `/health` returns 200 with vectordb info
  - instance + KB create flows working
  - resource ingestion returns `chunks_indexed > 0`
  - `/search`, `/query`, and `/observability/scores` return 200

### Iteration 2 — Hackathon Advanced Retrieval Planning (2026-04-14)

- Reviewed current backend retrieval path and Actian SDK examples/docs for:
  - filtered search
  - hybrid fusion
  - named vectors / multimodal
- Mapped current implementation gaps for hackathon technical compliance.
- Created implementation blueprint doc:
  - `agent-docs/hackathon-advanced-search-readme.md`
- Recommended phased path:
  1. Filtered search (must-ship)
  2. Hybrid fusion (recommended)
  3. Named vectors text+memory (stretch)

### Iteration 3 — Scope Lock: SQLite + Integration Packaging (2026-04-14)

- Confirmed control-plane decision:
  - Keep SQLite through advanced retrieval implementation and post-feature testing.
  - Defer Neon/PostgreSQL migration to later deployment/multi-user phase.
- Confirmed scope simplification:
  - Skip deployment concerns for this phase.
- Confirmed integration direction:
  - Implement filtered + hybrid first.
  - Decide CLI wrapper vs MCP server after validation.

### Next Planned Iteration

1. Implement `/search/advanced` with payload filter support.
2. Implement hybrid fusion mode (`RRF`/`DBSF`) in retrieval service.
3. Add optional named-vector KB creation mode for text+memory split.
4. Decide integration packaging (CLI wrapper or MCP server) after feature testing.
