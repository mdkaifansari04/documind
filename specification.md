# Specification Tracking Note

This repository currently keeps the detailed product specification in:

- `SPEC.md`

Implementation rule:

1. Treat `SPEC.md` as the full canonical spec content.
2. Keep this `specification.md` file updated as a quick implementation status pointer.
3. After each major phase/iteration, update both:
   - `SPEC.md` (requirements/details)
   - `docs/agent-docs/todo.md` (execution progress/context)

Last Synced: 2026-04-14
Current Active Prompt: `docs/steps/step-one-prompt.md`
Current Active Reference: `docs/agent-docs/todo.md`

Latest Backend Status (Iteration 2):
- Class-based FastAPI Phase-1 foundation implemented in `documind/backend/app/`
- Working endpoints for instances, KBs, ingestion, search/query, memory, and observability
- Control-plane storage decision is locked to SQLite for the advanced-retrieval phase and validation cycle
- Prisma schema remains available for later Neon/PostgreSQL migration when deployment/multi-user needs start
- Deployment complexity is intentionally deferred for current hackathon phase
- CLI wrapper vs MCP server integration packaging will be decided after filtered + hybrid feature implementation/testing
Latest Spec Update: Added embedding profile matrix in `SPEC.md` for general text, high-quality text, balanced text, multimodal (image+text), and code search model routing.
