# Phase 2 Questions (Only What Is Still Necessary)

Date: 2026-04-15  
Mode: Hackathon (not production hardening)

## Locked Decisions

- Primary contract everywhere: `instance_id + namespace_id`
- Focus clients: Claude Code CLI, Codex CLI, OpenCode (agent harnesses)
- Quality goal: fast responses over exhaustive retries
- Most critical workflows: `search_docs`, `ask_docs`
- Out of scope: auth, admin UI, multi-hop tools, async pipelines
- Tool set is final: `search_docs`, `ask_docs`, `ingest_text`, `list_knowledge_bases`
- Primary output format: structured JSON with optional text summary
- Multi-tenant allowed; enforce required `instance_id + namespace_id`
- No per-session KB allowlist in hackathon scope

## Remaining Questions (Need Simple Final Answer)

1. `search_docs` first call [Locked]:
   - `/search/instance` then one fallback to `/search/advanced`

2. `ask_docs` first call [Locked]:
   - `/query/instance` then one fallback to `/query/advanced`

3. Error enum [Locked]:
   - `not_found`, `validation_error`, `timeout`, `server_error`

4. Timeout defaults [Locked]:
   - search: 8s
   - ask: 25s
   - ingest: 20s

## Clarification Notes

- "Freeze schema" here means: keep response keys stable for this hackathon run so agents do not break.
- We can still add new optional fields, but should not rename/remove existing core fields.
