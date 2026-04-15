# Phase 2 Decisions v1 (Hackathon Mode)

Date: 2026-04-15  
Status: Locked for implementation

## 1) Core Contract

- Primary contract everywhere: `instance_id + namespace_id`
- `kb_id` is legacy/compat only (do not lead new MCP/CLI flows with it)

## 2) Phase 2 Tool Set (Final v1)

- `search_docs`
- `ask_docs`
- `ingest_text`
- `list_knowledge_bases`

Context UX extension (for first-time setup + switching):
- `list_instances`
- `create_instance`
- `list_namespaces`
- `get_active_context`
- `set_active_context`

## 3) Route Strategy (Fast First)

- `search_docs`:
  1. first call `POST /search/instance` (fast semantic)
  2. fallback once to `POST /search/advanced` with `mode="hybrid"` if no useful results
- `ask_docs`:
  1. first call `POST /query/instance`
  2. fallback once to `POST /query/advanced` with `mode="hybrid"` if needed
- `ingest_text` -> `POST /resources` (JSON body)
- `list_knowledge_bases` -> `GET /knowledge-bases` (optional `instance_id`)

## 4) Response Schema Policy (Simple Freeze)

During hackathon, do not break tool response envelope:

```json
{
  "status": "success|error",
  "data": {},
  "meta": {},
  "text": "optional human readable summary"
}
```

- JSON is primary (for agents)
- `text` is optional display/debug field
- if we add fields, only additive changes

## 5) Error Shape (Hackathon)

- Keep a small but useful enum:
  - `not_found`
  - `validation_error`
  - `timeout`
  - `server_error`

## 6) Scope Boundaries

Out of scope for Phase 2:
- auth
- admin UI
- multi-hop tools
- async pipelines
- per-session KB allowlist

Note:
- Multi-tenant is allowed.
- Safety baseline is mandatory `instance_id + namespace_id` on every tool call.

## 7) Minimal Guardrails

- `top_k <= 20`
- content size cap for `ingest_text` (200 KB)
- one fallback attempt only (speed over exhaustive retries)

## 8) Timeout Defaults (Hackathon)

- `search_docs`: 8s
- `ask_docs`: 25s
- `ingest_text`: 20s

## 9) Implications

1. MCP and CLI signatures must use `instance_id + namespace_id`.
2. Keep responses fast; if no answer, return quickly and let the agent decide next step.
3. No production-hardening extras in this phase.
