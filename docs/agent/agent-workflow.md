# Agent Workflow

Last updated: 2026-04-25

## Standard Lifecycle
1. Discover
- Read root `AGENTS.md`, `TODOS.md`, `DECISIONS.md`.
- Read nearest subtree `AGENTS.md` in the touched area.

2. Plan
- List file-level edits and verification commands before execution.

3. Execute
- Make focused edits with minimal blast radius.

4. Verify
- Run area-specific checks.
- If checks cannot run, explicitly state why.

5. Summarize
- Report changed files and command outcomes.

6. Sync docs
- Update `TODOS.md`, `DECISIONS.md`, and `docs/docs-index.md` as needed.

## Non-Negotiables
- No secret leakage.
- No unrelated refactors.
- No silent behavior changes without docs updates.
