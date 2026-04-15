# DocuMind Implementation Reference (Living File)

Purpose: This is the operational reference file that must be updated after every implementation iteration so future work always has context.

Last Updated: 2026-04-15
Current Focus: Phase 1 closed; hardening backlog + Phase 2 kickoff prep.

---

## 1. Repository Map (What Each Directory Is For)

### `actian-vectorAI-db-beta/`

- Upstream/working Actian VectorAI DB repo and examples.
- Includes Docker compose, SDK docs, examples, and persistent DB data under `data/`.
- Treat this as reference + runtime dependency, not primary application code.

### `docs/agent-docs/`

- Brainstorming and internal reference docs.
- Contains:
  - `BRAINSTROMING.md`
  - `actian-db-readme.md`
  - `resource.md`
  - `todo.md` (this file; living implementation reference)

### `documind/`

- Product implementation workspace.
- `documind/backend/`: backend app implementation (Phase 1 priority now).
- `documind/frontend/`: frontend implementation area (not current priority).

### `docs/steps/`

- Prompt and phase-planning artifacts.
- Current source of execution truth:
  - `docs/steps/step-one-prompt.md`
  - `docs/steps/step-one-branstorming.md`

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

1. Primary implementation direction comes from `docs/steps/step-one-prompt.md`.
2. Current phase priority is backend foundation in `documind/backend/`.
3. Frontend is deferred until backend milestone is complete.
4. Every iteration must update this file (`docs/agent-docs/todo.md`) with:
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

1. Update `docs/agent-docs/todo.md`:
   - Add one new entry under `Iteration Log`.
   - Update `Phase Tracker`.
   - Update `Open Risks / Blockers`.
2. Update spec documents:
   - Update `SPEC.md` if requirements changed.
   - Update `specification.md` status summary and references.
3. Update step artifacts when needed:
   - If major direction changed, append to `docs/steps/step-one-branstorming.md`.
4. Verify runtime assumptions:
   - DB container status
   - API health (when FastAPI exists)
   - Core happy-path test command(s)
5. Record remaining work:
   - Next 1-3 concrete tasks for immediate follow-up.

---

## 4. Phase Tracker

### Phase 1: Backend Foundation + Retrieval Completion (COMPLETE)

- [x] FastAPI app skeleton in `documind/backend/app/`
- [x] Config + environment wiring
- [x] Actian wrapper module
- [x] Control-plane DB integration (SQLite implemented; Prisma migration path prepared)
- [x] Instance/knowledge-base/resource APIs
- [x] Ingestion pipeline (chunk + embed + upsert)
- [x] Search/query APIs
- [x] Basic observability endpoints
- [x] Instance-scoped no-`kb_id` API contract (`instance_id + namespace_id`)
- [x] Advanced retrieval endpoints (`/search/advanced`, `/query/advanced`)
- [x] Phase 1 docs + Postman sync
- [x] Phase 1 verification pass (`python -m unittest discover -s tests -v`)

### Phase 1.8.5: Advanced Retrieval + Hardening Prep (COMPLETE)

- [x] Add advanced schemas in `documind/backend/app/models/schemas.py`
  - `FilterClause`, `FilterSpec`, `HybridConfig`
  - `AdvancedSearchRequest`, `AdvancedQueryRequest`
- [x] Add instance-scoped KB resolver for advanced routes (`instance_id + namespace_id -> kb`)
- [x] Implement filter translator in `documind/backend/app/services/retrieval.py` (JSON -> Actian `FilterBuilder`)
- [x] Implement hybrid fusion mode (`rrf` and optional `dbsf`) in retrieval service
- [x] Add advanced instance-scoped routes in `documind/backend/app/routers/query.py`
  - `POST /search/advanced`
  - `POST /query/advanced`
- [x] Add tests for:
  - filter translation
  - hybrid fusion ranking behavior
  - advanced route payload validation + response shape
- [x] Update Postman collection with advanced requests
- [x] Update docs (`documind/backend/README.md`, `documind/backend/IMPLEMENTATION_TEST_GUIDE.md`)

### Phase 2: Agent Integration (READY, NOT STARTED)

- [ ] LangChain agent tooling (`search_docs` etc.)
- [ ] Prompt augmentation + response generation flow
- [ ] Memory routing behavior

### Phase 3: Frontend (DEFERRED)

- [ ] React/Tailwind app scaffold
- [ ] Chat UI
- [ ] Resource ingestion dashboard
- [ ] Observability panel

---

## 4.1 Phase 1.8.5 Executable Tasks (Single Source of Truth)

Status: COMPLETE (2026-04-14)

Execute in order:

1. `P185-T1` Schema and model wiring [Done]
   - Update `documind/backend/app/models/schemas.py`
   - Add request models for advanced search/query with instance-scoped target
   - Completion check: imports succeed and test module discovery still passes

2. `P185-T2` Retrieval filter translator [Done]
   - Update `documind/backend/app/services/retrieval.py`
   - Build converter from API filter clauses to Actian `FilterBuilder`
   - Completion check: unit tests for `eq`, `any_of`, `text`, `between`, range ops

3. `P185-T3` Hybrid fusion retrieval [Done]
   - Update `documind/backend/app/services/retrieval.py`
   - Implement semantic + keyword retrieval and fuse ranks with `rrf` (then `dbsf`)
   - Completion check: deterministic fusion test for ranking output

4. `P185-T4` Advanced query routes [Done]
   - Update `documind/backend/app/routers/query.py`
   - Add `POST /search/advanced` and `POST /query/advanced` using `instance_id + namespace_id`
   - Completion check: route tests pass and no required client `kb_id`

5. `P185-T5` Docs and Postman sync [Done]
   - Update `documind/backend/postman/collection-v1.json`
   - Update `documind/backend/README.md`
   - Update `documind/backend/IMPLEMENTATION_TEST_GUIDE.md`
   - Completion check: Postman examples match route payloads and docs mention no-`kb_id` contract

6. `P185-T6` Verification gate [Done]
   - Run:
     - `cd documind/backend && .venv/bin/python -m unittest discover -s tests -v`
   - Completion check: all tests green

---

## 5. Per-Iteration Workflow

### Before Implementation

1. Read:
   - `docs/steps/step-one-prompt.md`
   - `docs/steps/step-one-branstorming.md`
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

### `docs/steps/`

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
5. Important caveat: enforce uniqueness of `(instance_id, namespace_id)` in control-plane DB to avoid ambiguous KB resolution for instance-scoped APIs.
6. Advanced hybrid currently uses lexical payload scoring for the keyword branch; sparse-vector hybrid should be added when deployment/runtime supports sparse indexes.

---

## 8.1 Good to Complete

These are non-blocking but high-value improvements for reliability and observability clarity.

1. Replace placeholder `chunk_relevance` metric.
   - Current state: `chunk_relevance` is copied from `retrieval_score`.
   - Better target: score chunk relevance independently using evaluator-backed logic.
   - Done when: `chunk_relevance` is no longer a mirror of retrieval average.

2. Replace placeholder `hallucination_rate` metric.
   - Current state: `hallucination_rate` is logged as constant `0.0`.
   - Better target: groundedness/faithfulness evaluator computes this value per query.
   - Done when: metric is dynamic and based on answer-vs-source checks.

3. Calibrate `retrieval_score` definition.
   - Current state: simple average of returned similarity scores.
   - Better target: stable metric definition across semantic and hybrid modes with documented meaning.
   - Done when: metric definition is documented and validated against sample workloads.

4. Add metric provenance to `query_logs`.
   - Store evaluator metadata (name/version/method) with scores.
   - Done when: each logged metric can be traced to its generation method.

5. Add clear observability labeling in docs/API.
   - Mark which metrics are proxy vs evaluator-backed during transition.
   - Done when: dashboards/consumers can distinguish metric confidence level without code lookup.

---

## 9. Iteration Log (Append-Only)

### Iteration 0 — Setup Baseline (2026-04-14)

- Captured current folder structure and implementation rules.
- Established this file as mandatory living context reference.
- Locked execution focus to `docs/steps/step-one-prompt.md`.
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
  - `docs/agent-docs/hackathon-advanced-search-readme.md`
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

### Iteration 4 — No-`kb_id` Client Contract + Planning Sync (2026-04-14)

- Implemented client-facing no-`kb_id` flows using `instance_id + namespace_id`:
  - `/resources` ingest + list
  - `/search/instance` and `/query/instance`
- Added KB auto-create path during ingestion for missing namespace KB.
- Refined `documind/backend/ADVANCED_RETRIEVAL_README.md` to use instance-scoped payloads.
- Converted Phase 1.8.5 plan into executable tasks in this file as single source of truth.
- Recorded DB uniqueness caveat for `(instance_id, namespace_id)` under open risks.

### Iteration 5 — Phase 1.8.5 Advanced Retrieval Delivery (2026-04-14)

- Implemented advanced retrieval schemas:
  - `FilterClause`, `FilterSpec`, `HybridConfig`
  - `AdvancedSearchRequest`, `AdvancedQueryRequest`
- Implemented retrieval filter translator for Actian `FilterBuilder` operators:
  - `eq`, `any_of`, `text`, `between`, `gt`, `gte`, `lt`, `lte`
- Implemented hybrid fusion retrieval in service layer:
  - `rrf` and `dbsf`
- Added advanced instance-scoped routes:
  - `POST /search/advanced`
  - `POST /query/advanced`
- Added tests for:
  - advanced schema validation
  - filter translation
  - hybrid fusion behavior
  - advanced query router flows
- Updated Postman collection:
  - added `search-advanced-instance-scope`
  - added `query-advanced-instance-scope`
- Updated backend docs and implementation guide with advanced endpoint examples.

### Iteration 6 — CodeRabbit Follow-Up Fixes (2026-04-14)

- Addressed review concern on hybrid retrieval semantics:
  - replaced second dense query pass with lexical payload keyword scoring branch
  - retained fusion options (`rrf`/`dbsf`) over semantic + lexical result sets
- Added VectorDB scroll helper to support keyword candidate collection.
- Updated retrieval unit tests for semantic+lexical fusion path.
- Synced docs with explicit hybrid behavior caveat (lexical branch now, sparse-vector upgrade later).

### Next Planned Iteration

1. Add uniqueness guarantee for `(instance_id, namespace_id)` in control-plane DB.
2. Start production hardening track: async ingestion jobs + job status endpoints.
3. Add retry/failure handling for ingestion pipeline and surface error payloads.
4. Re-evaluate integration packaging (CLI wrapper vs MCP server) after hardening validation.
