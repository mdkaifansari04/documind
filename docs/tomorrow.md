# Tomorrow Kickstart (2026-04-15)

Use this file first thing tomorrow to restart fast.

## 1) Day Recap (What Got Done)

Phase 1 backend is complete for hackathon scope.

Completed and documented:
- Instance-scoped contract is active (`instance_id + namespace_id`) so client does not need `kb_id` for main flows.
- Ingestion supports JSON + form-data and source types used in Phase 1 (`text`, `markdown`, `pdf`, `url`, `conversation_history_json`).
- Advanced retrieval shipped:
  - `POST /search/advanced`
  - `POST /query/advanced`
  - filter operators (`eq`, `any_of`, `text`, `between`, `gt/gte/lt/lte`)
  - hybrid mode (`semantic + lexical payload scoring + rrf/dbsf fusion`)
- Postman collection updated and validated for Phase 1 flow.
- Phase tracker marked complete in `docs/agent-docs/todo.md`.

New docs added:
- `documind/backend/README.md` (full architecture + flow)
- `documind/backend/POSTMAN_PHASE1_RUNBOOK.md` (manual testing order)
- `documind/backend/PHASE1_INTERNAL_FEATURE_BREAKDOWN.md` (deep internals)
- `documind/backend/ACTIAN_OPEN_QUESTIONS.md` (questions to Actian + answer slots)
- `documind/backend/UNDERSTANDING.md` (plain-English owner guide)

## 2) What Is Locked

- Prefer instance-scoped APIs over legacy `kb_id` APIs.
- Keep SQLite for current phase.
- Keep current hybrid approach until Actian responds on native recommendations.
- Keep one collection per KB for now.

## 3) Open Inputs Needed (From Actian)

Fill responses in:
- `documind/backend/ACTIAN_OPEN_QUESTIONS.md`

Questions pending:
1. Better native hybrid path than current client-side fusion?
2. Field index recommendations for metadata filters?
3. Cosine + L2 normalization guidance?
4. Collection partition strategy guidance for scale?

## 4) 10-Minute Morning Restart Checklist

1. Open and read:
   - `documind/backend/UNDERSTANDING.md`
   - `documind/backend/POSTMAN_PHASE1_RUNBOOK.md`
   - `documind/backend/ACTIAN_OPEN_QUESTIONS.md`
2. Start backend + dependencies.
3. Run Postman golden path once.
4. Capture any Actian replies and paste into questions doc.
5. Convert responses into implementation tasks.

## 5) Practical Commands

```bash
# from repo root
cd documind/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
# optional verification
cd documind/backend
.venv/bin/python -m unittest discover -s tests -v
```

## 6) Suggested First Task Tomorrow

If Actian replies are available:
- decide final hardening direction and convert into concrete implementation tickets.

If no replies yet:
- keep product momentum by scoping Phase 2 agent integration work, while preserving current retrieval APIs.
