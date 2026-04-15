---
name: dcli-documind
description: DocuMind skill for any project/framework. Uses DCLI as the primary retrieval and context toolchain for agent workflows.
---

# Universal DCLI DocuMind Skill

## Purpose

Use this skill in any codebase where the agent needs private/project documentation from DocuMind.
This skill is framework-agnostic and works for all stacks.

Primary rule:
- use `dcli` as the source of truth before making documentation claims
- use bot mode for agent calls: `--bot=true`
- prefer `search-docs` first, then `ask-docs` when synthesis is needed

Use MCP only if CLI is unavailable or user explicitly requests MCP-only usage.

## Runtime Prereqs

1. Verify CLI exists:

```bash
which dcli
```

2. Ensure backend is reachable:

```bash
dcli context-show --bot=true
```

If this fails with connection issues, ask user to start backend and set `DOCUMIND_API_URL`.

3. Readiness requirement for this skill:
- agent must have a valid active context with both:
  - one `instance`
  - one `namespace`
- without both, retrieval commands should not continue.

## Agent Output Contract

For all agent tool calls, append `--bot=true`.

Expected shape:
- `status`: `success` or `error`
- `data`: structured payload
- `meta`: auxiliary metadata/errors
- `text`: human-readable summary

Parse `data` and `meta`. Use `text` only as fallback.

## Command Catalog (All Supported DCLI Commands)

Global flags:
- `--api-url` (optional backend override)
- `--context-id` (context profile key; use project-scoped value, not shared global default)

Per-command agent flag:
- `--bot=true`

### 1) `init`
Purpose:
- bootstrap context for first-time use

Flags:
- `--instance-id` (optional)
- `--instance-name` (optional; used if creating instance)
- `--instance-description` (optional; used if creating instance)
- `--namespace-id` (optional in interactive shell, required in non-interactive agent runs)
- `--bot=true`

Example:

```bash
dcli init --namespace-id "<namespace_id>" --bot=true
```

### 2) `context-show`
Purpose:
- read active context

Flags:
- `--bot=true`

Example:

```bash
dcli context-show --bot=true
```

### 3) `context-set`
Purpose:
- explicitly set active context

Flags:
- `--instance-id` (required)
- `--namespace-id` (required)
- `--bot=true`

Example:

```bash
dcli context-set --instance-id "<instance_id>" --namespace-id "<namespace_id>" --bot=true
```

### 4) `instances`
Purpose:
- list available instances

Flags:
- `--bot=true`

Example:

```bash
dcli instances --bot=true
```

### 5) `instance-create`
Purpose:
- create new instance

Flags:
- `--name` (required)
- `-d` / `--description` (optional)
- `--bot=true`

Example:

```bash
dcli instance-create --name "<instance_name>" -d "<description>" --bot=true
```

### 6) `namespaces`
Purpose:
- list namespaces for instance (or context instance when omitted)

Flags:
- `--instance-id` (optional)
- `--bot=true`

Example:

```bash
dcli namespaces --instance-id "<instance_id>" --bot=true
```

### 7) `list-kbs`
Purpose:
- list knowledge bases (optionally filtered by instance)

Flags:
- `--instance-id` (optional)
- `--bot=true`

Example:

```bash
dcli list-kbs --instance-id "<instance_id>" --bot=true
```

### 8) `search-docs`
Purpose:
- fast semantic retrieval

Flags:
- `--qr` / `--query` (required)
- `--instance-id` (optional; falls back to context)
- `--namespace-id` (optional; falls back to context)
- `--top-k` (optional, default `5`)
- `--bot=true`

Example:

```bash
dcli search-docs --qr "<query>" --top-k 5 --bot=true
```

### 9) `ask-docs`
Purpose:
- synthesized grounded answer with sources

Flags:
- `-qs` / `--question` (required)
- `--instance-id` (optional; falls back to context)
- `--namespace-id` (optional; falls back to context)
- `--top-k` (optional, default `5`)
- `--bot=true`

Example:

```bash
dcli ask-docs -qs "<question>" --top-k 5 --bot=true
```

### 10) `ingest-text`
Purpose:
- add text/file content into DocuMind namespace

Flags:
- `--instance-id` (optional; falls back to context)
- `--namespace-id` (optional; falls back to context)
- `--source-ref` (optional, default `inline`)
- exactly one of:
  - `--content`
  - `--content-file`
- `--bot=true`

Example:

```bash
dcli ingest-text --source-ref "<source>" --content "<text>" --bot=true
```

## Universal Agent Workflow

### A) Startup / Context Resolution

Project-scoped persistence policy:
- always use a per-project `context-id` to avoid cross-project mixups.
- default convention: repo/app folder slug (example: `demo-test-app`), not `default`.
- if user does not provide one, derive from current project root folder name.
- pass this same `--context-id` on all commands in a session.

1. Check context:

```bash
dcli context-show --context-id "<project_context_id>" --bot=true
```

2. If context exists, continue.

3. If context missing:
- list instances:

```bash
dcli instances --context-id "<project_context_id>" --bot=true
```

- if zero instances: ask user to choose one of:
  - create a new instance now
  - provide existing instance name

- if user chooses create: create it using user-provided name (and optional description):

```bash
dcli instance-create --name "<user_instance_name>" -d "<optional_description>" --bot=true
```

- if one or more instances exist: show instance names and ask user to choose by name.
- if duplicate instance names exist: show `id + description + updated_at` for disambiguation and let user choose.
- resolve chosen name to instance id internally from `instances` JSON.
- fetch namespaces for the chosen instance:

```bash
dcli namespaces --instance-id "<resolved_instance_id>" --context-id "<project_context_id>" --bot=true
```

- if namespace missing/unknown: ask user for namespace name.
- set context via `context-set` and confirm:

```bash
dcli context-set --instance-id "<resolved_instance_id>" --namespace-id "<user_namespace>" --context-id "<project_context_id>" --bot=true
dcli context-show --context-id "<project_context_id>" --bot=true
```

Important:
- do not ask user for raw/random UUIDs in normal flow.
- exception: duplicate instance names where disambiguation requires showing ids.
- always ask using instance names/options and namespace names.
- use ids only internally for command execution.

### B) Retrieval Loop (Low Latency)

For any knowledge question:
1. Run `search-docs` first.
2. If insufficient, run one refined `search-docs`.
3. Then run `ask-docs` for synthesis.
4. If still empty, explicitly say docs did not contain an answer.

### C) Ingestion

Use only when user asks to add/update documentation:

```bash
dcli ingest-text --source-ref "<source>" --content "<text>" --bot=true
```

or

```bash
dcli ingest-text --source-ref "<source>" --content-file "<path>" --bot=true
```

## Ask vs Auto-Run Policy

Auto-run without asking:
- `context-show`, `instances`, `namespaces`, `list-kbs`, `search-docs`, `ask-docs`
- `context-set` when target is clear from user request and namespace is known

Ask user when required:
- no instance available yet (ask whether to create one now)
- missing namespace and cannot infer safely
- user requests switching instance/namespace but multiple valid options exist
- namespace list is empty for selected instance

Avoid asking:
- for random/raw IDs when options can be listed and chosen semantically
- except when duplicate instance names require explicit id-based disambiguation

## Failure Handling (Strict)

If any `dcli` call returns `status="error"`:
- stop the workflow immediately
- show the error `text` and relevant `meta` to user
- ask user for correction/confirmation (for example: wrong context, missing namespace, backend down)

Do not do:
- do not silently retry with MCP DocuMind tools (`documind.*`)
- do not switch toolchains automatically
- do not create new instance/namespace as implicit recovery

Allowed recovery:
- re-run `dcli` with corrected inputs after user confirmation
- run `context-show`, `instances`, `namespaces`, `context-set` to repair context explicitly

## Guardrails

- Do not assume cross-instance search.
- Do not silently switch context.
- Always confirm after `context-set`.
- Prefer `search-docs` before `ask-docs` for latency-sensitive lookups.
- Never invent undocumented APIs/behaviors; retrieve first.
- Do not show instance IDs in user-facing responses, except for duplicate-name disambiguation or explicit debug requests.
