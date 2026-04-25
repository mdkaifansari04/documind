# DECISIONS

Last updated: 2026-04-25

## 2026-04-25 — Layered Agent Contract (Accepted)
Decision:
- Use layered docs, not a single monolithic instructions file.

Why:
- One large file is brittle and expensive for agent context loading.
- Scoped files reduce ambiguity and token burn.

Implementation:
- Root contract: `AGENTS.md`
- Compatibility surfaces: `CLAUDE.md`, `.github/copilot-instructions.md`
- Subtree contracts: `documind/backend/AGENTS.md`, `documind/frontend/AGENTS.md`, `documind/documentation/AGENTS.md`, `demo-test-app/AGENTS.md`

## 2026-04-25 — Docs Contract Validation (Accepted)
Decision:
- Add a repo-level docs contract check script and CI workflow.

Why:
- Documentation drifts quickly without a mechanical guard.

Implementation:
- Local check: `scripts/check-doc-contracts.sh`
- CI check: `.github/workflows/docs-contract.yml`
