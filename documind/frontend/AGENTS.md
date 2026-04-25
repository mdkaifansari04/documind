# Frontend AGENTS

Last updated: 2026-04-25

Scope: `documind/frontend/`

## Core Rules
- Keep API client types aligned with backend response shapes.
- Preserve context-aware UX (instance + namespace + optional kb).
- Do not introduce design regressions in dashboard navigation.

## Commands
- Install deps: `bun install`
- Dev server: `NEXT_PUBLIC_API_URL=http://localhost:8000 bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`

## Required Verification
- Run `bun run build` for UI changes.
- Smoke-test touched flows (context selection, search/ask/chat, resources).
