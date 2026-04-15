# Phase 2 TODO (Hackathon)

Date: 2026-04-15  
Status: IN PROGRESS

Use this as the single checklist for Phase 2 execution.
Rule: mark `[x]` only after code + tests + docs for that task are done.

## Execution Checklist

- [x] `P2-T1` Scaffold MCP adapter package
  - Create `documind/backend/mcp_server/` with runnable server entrypoint.
  - Add config/env wiring for backend API URL and timeouts.
  - Done when: MCP server process starts locally without errors.

- [x] `P2-T2` Implement `search_docs` tool (fast-first flow)
  - Primary call: `/search/instance`
  - One fallback: `/search/advanced` with `mode="hybrid"` when needed.
  - Enforce `instance_id + namespace_id` and `top_k <= 20`.
  - Done when: tool returns stable JSON envelope and fallback behavior is tested.

- [x] `P2-T3` Implement `ask_docs` tool (fast-first flow)
  - Primary call: `/query/instance`
  - One fallback: `/query/advanced` with `mode="hybrid"` when needed.
  - Done when: tool returns answer + sources with stable JSON envelope.

- [x] `P2-T4` Implement `ingest_text` and `list_knowledge_bases` tools
  - `ingest_text` uses `/resources` JSON path.
  - `list_knowledge_bases` supports optional `instance_id` filter.
  - Done when: both tools return JSON envelope with consistent error mapping.

- [x] `P2-T5` Add tool response schema + error mapping layer
  - Response envelope:
    - `status`, `data`, `meta`, optional `text`
  - Error enums:
    - `not_found`, `validation_error`, `timeout`, `server_error`
  - Done when: all tools return same schema shape in success/error paths.

- [x] `P2-T6` Build CLI wrapper commands (same contract)
  - `search-docs`, `ask-docs`, `ingest-text`, `list-kbs`
  - All commands use `instance_id + namespace_id` as primary targeting.
  - Done when: commands work end-to-end against local backend.

- [x] `P2-T7` Add test coverage (hackathon minimum)
  - Unit tests for fallback logic and error mapping.
  - Integration smoke test for MCP server against local backend.
  - Done when: test suite for new Phase 2 modules passes.

- [x] `P2-T8` Update docs and usage examples
  - Update run instructions + example tool calls + CLI examples.
  - Document timeout defaults (search=8s, ask=25s, ingest=20s).
  - Done when: docs reflect final tool signatures and behavior.

## Completion Gate

- [ ] `P2-GATE` Verification before marking Phase 2 complete
  - Run relevant backend and Phase 2 tests.
  - Run MCP local smoke test with one real KB query.
  - Update `docs/agent-docs/todo.md`:
    - set Phase 2 tracker to COMPLETE
    - append Iteration Log summary.
