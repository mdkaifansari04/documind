---
name: dcli-documind
description: Use when the user wants to query DocuMind documentation through a global CLI command (dcli), manage active instance/namespace context, or switch context during an agent session.
---

# DCLI DocuMind Skill

## Overview

Use `dcli` as the primary interface for DocuMind operations.
Use MCP only when CLI is unavailable or the user explicitly requests MCP-only flow.

## Preconditions

Verify CLI availability:

```bash
which dcli
```

If `dcli` is missing, ask the user to follow `docs/steps/dcli-global-codex-integration.md`.

## Context Workflow

1. Initialize first for new sessions:

```bash
dcli init --namespace-id "<namespace_id>"
```

2. Check active context:

```bash
dcli context-show
```

3. If context is still missing:
- list instances: `dcli instances`
- if needed create instance: `dcli instance-create --name "<name>" -d "<desc>"`
- list namespaces: `dcli namespaces --instance-id "<instance_id>"`
- set context: `dcli context-set --instance-id "<instance_id>" --namespace-id "<namespace_id>"`

4. To switch context mid-session:
- list namespaces for target instance
- ask user to confirm target namespace
- run `dcli context-set ...`
- confirm via `dcli context-show`

## Query Workflow

For factual lookup (counts, names, exact commands), use search first:

```bash
dcli search-docs --qr "<query>" --top-k 5
```

For synthesized answers with sources:

```bash
dcli ask-docs -qs "<question>" --top-k 5
```

If search/ask fails with `context_missing`, run context workflow again.

## Ingestion Workflow

Inline content:

```bash
dcli ingest-text --source-ref "<source>" --content "<text>"
```

File content:

```bash
dcli ingest-text --source-ref "<source>" --content-file "<path>"
```

## Output Handling

`dcli` outputs JSON envelope:
- `status`
- `data`
- `meta`
- `text`

When summarizing results for the user, prioritize `data` and `meta`.

## Guardrails

- Do not assume cross-instance search.
- Do not silently switch context.
- Always confirm after `context-set`.
- Prefer `search-docs` before `ask-docs` for latency-sensitive lookups.
