# AGENTS.md

Last updated: 2026-04-25

This repository follows an agent-first development model.

## Mission
- Build DocuMind into a startup-ready product while preserving hackathon velocity.
- Keep agent work deterministic, testable, and easy to review.

## First 10 Minutes (Cold Start)
1. Read `AGENTS.md` (this file) for global workflow.
2. Read `TODOS.md` for active priorities and current execution status.
3. Read `DECISIONS.md` for current architectural constraints.
4. Read subsystem `AGENTS.md` before touching files in that subtree.

## Canonical Docs
- Product thesis: `SPEC.md`
- Human onboarding: `README.md`
- Contribution policy: `CONTRIBUTION.md`
- Commit standard: `COMMIT.md`
- Active execution queue: `TODOS.md`
- Decision ledger: `DECISIONS.md`
- Docs inventory + ownership: `docs/docs-index.md`
- Approved design direction: `docs/designs/agentic-repo-standardization-v1.md`

## Repo Map
- `documind/backend/`: FastAPI, CLI (`dcli`), MCP server, tests
- `documind/frontend/`: Next.js operations dashboard
- `documind/documentation/`: docs site
- `demo-test-app/`: Svelte demo client
- `docs/`: architecture notes, runbooks, decisions, agent workflow docs

## Command Matrix
- Start Vector DB: `cd actian-vectorAI-db-beta && docker compose up -d`
- Start backend: `cd documind/backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
- Backend tests: `cd documind/backend && python -m unittest discover -s tests -v`
- Frontend dev: `cd documind/frontend && bun install && NEXT_PUBLIC_API_URL=http://localhost:8000 bun run dev`
- Frontend build: `cd documind/frontend && bun run build`
- Demo app dev: `cd demo-test-app && npm run dev`
- Demo app checks: `cd demo-test-app && npm run check && npm run lint`
- Docs contract check: `./scripts/check-doc-contracts.sh`

## Agent Execution Protocol
1. Discover: read local scope docs before editing.
2. Plan: define file-level plan and acceptance checks.
3. Execute: make the smallest coherent change set.
4. Verify: run relevant tests/builds after edits.
5. Summarize: report exact files changed + outcomes.
6. Update: refresh `TODOS.md`, `DECISIONS.md`, and `docs/docs-index.md` timestamps when needed.

## Definition of Done
- Relevant tests/checks pass for the touched area.
- `TODOS.md` reflects what changed.
- Contract docs remain accurate (validate with `scripts/check-doc-contracts.sh`).
- Any behavioral/API change has corresponding docs update.

## Guardrails
- Do not commit secrets or environment files.
- Keep instance-scoped API contract (`instance_id + namespace_id`) as default behavior.
- Do not perform unrelated refactors in the same change set.
- Prefer clear, reversible changes with explicit verification evidence.
- When user requests `commit`, follow `COMMIT.md` and default to micro-commit batching.
