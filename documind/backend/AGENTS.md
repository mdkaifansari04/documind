# Backend AGENTS

Last updated: 2026-04-25

Scope: `documind/backend/`

## Core Rules
- Preserve instance-scoped request model (`instance_id + namespace_id`) as default.
- Keep API contracts and docs synchronized.
- Avoid mixing backend refactors with frontend/docs changes in one patch.

## Commands
- Start API: `source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
- Run tests: `python -m unittest discover -s tests -v`
- MCP server: `./run_mcp_server.sh`
- CLI smoke: `dcli context-show --bot=true`

## Required Verification
- Run backend unit/integration tests relevant to touched modules.
- If API payload changes, update docs in same change set.
