# Agent Onboarding Smoke Test

Last updated: 2026-04-25

## Goal
Verify that a fresh agent can correctly understand repo architecture and pick a safe first task in under 10 minutes.

## Inputs
- Root docs only: `AGENTS.md`, `TODOS.md`, `DECISIONS.md`, `README.md`, `docs/docs-index.md`

## Procedure
1. Start a fresh agent session with no prior context.
2. Ask for:
- architecture summary
- first safe implementation task
- file-level execution plan
3. Repeat with 3 independent sessions.

## Pass Criteria
- All 3 sessions identify the same primary subsystems.
- All 3 sessions propose a safe and relevant first task.
- No session routes to deprecated or incorrect workflow docs.

## Failure Handling
- Log mismatch in `DECISIONS.md`.
- Patch root/scoped docs.
- Re-run until convergence.
