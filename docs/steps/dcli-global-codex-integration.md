# DCLI Global Install + Codex Skill Integration

Date: 2026-04-15  
Goal: use `dcli` globally (not `run_documind_cli.sh`) and integrate it as a Codex skill.

Note:
- Both `dcli` and `DCLI` commands are installed (same behavior).

## 1) What You Get

- Global commands:
  - `dcli context-show`
  - `dcli instances`
  - `dcli search-docs ...`
  - `dcli ask-docs ...`
- Codex skill file:
  - `docs/codex-skills/dcli/SKILL.md`

---

## 2) Global Install (Recommended: pipx)

From any shell:

```bash
pipx install /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
```

If already installed and you made local changes:

```bash
pipx reinstall documind-cli
```

If `documind-cli` is not yet installed in pipx:

```bash
pipx install --force /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
```

Verify:

```bash
which dcli
dcli --help
DCLI --help
```

Alternative (inside an existing Python venv):

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
pip install -e .
```

If your environment is offline/sandboxed:

```bash
pip install -e . --no-build-isolation
```

---

## 3) Runtime Prereq

`dcli` calls DocuMind backend API, so backend must be running:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
python main.py
```

Set API URL (if not default):

```bash
export DOCUMIND_API_URL="http://localhost:8000"
```

---

## 4) First-Time DCLI Setup

Run init first:

```bash
dcli init --namespace-id "company_docs"
```

or

```bash
DCLI init
```

`dcli init` behavior:
- uses latest existing instance if present
- creates a new instance if none exist
- uses provided namespace via `--namespace-id` (or prompts in interactive shell if omitted)
- persists context for next calls

For non-interactive environments (Codex/CI), always pass `--namespace-id`.

Optional explicit setup:

```bash
dcli init --instance-id "<INSTANCE_ID>" --namespace-id "company_docs"
```

Manual flow (if you want full control):

1. Check active context:

```bash
dcli context-show
```

2. If no instance exists:

```bash
dcli instance-create --name "My Instance" -d "local test"
```

3. List instances:

```bash
dcli instances
```

4. Set active context:

```bash
dcli context-set --instance-id "<INSTANCE_ID>" --namespace-id "company_docs"
```

5. Verify:

```bash
dcli context-show
```

---

## 5) Core DCLI Commands

Search:

```bash
dcli search-docs --qr "deploy payments command" --top-k 5
```

Ask:

```bash
dcli ask-docs -qs "What is the deploy command?" --top-k 5
```

Ingest inline text:

```bash
dcli ingest-text --source-ref "hotfix.md" --content "Hotfix command is npm run hotfix"
```

List namespaces:

```bash
dcli namespaces --instance-id "<INSTANCE_ID>"
```

Switch namespace:

```bash
dcli context-set --instance-id "<INSTANCE_ID>" --namespace-id "ops"
```

Output mode:
- default: human-readable terminal output
- agents/tools: append `--bot=true` to get JSON

Example:

```bash
dcli context-show --bot=true
```

---

## 6) Install Skill into Codex CLI

Copy the provided skill into Codex skills directory:

```bash
mkdir -p ~/.codex/skills/dcli-documind
cp /Users/mdkaifansari04/code/projects/vector-ai/docs/codex-skills/dcli/SKILL.md \
  ~/.codex/skills/dcli-documind/SKILL.md
```

Restart Codex after copying the skill.

---

## 7) Use in Codex

In Codex, ask with explicit intent:

- `Use dcli-documind skill. Show my current DocuMind context.`
- `Use dcli-documind skill. Switch to instance <id> and namespace company_docs.`
- `Use dcli-documind skill. Search docs for "semester subjects".`
- `Use dcli-documind skill. Ask docs: "How many subjects are listed?"`

Expected behavior:
- Codex should use `dcli` commands.
- If context missing, Codex should run context setup flow first.

---

## 8) Troubleshooting

`dcli: command not found`
- Ensure `pipx ensurepath` ran and open a new shell.
- Re-run `pipx install ...`.

`connection refused localhost:8000`
- Start backend (`python main.py`) before using `dcli`.

`context_missing`
- Run `dcli context-set --instance-id ... --namespace-id ...`.

Slow answers
- Use `dcli search-docs` for factual lookups.
- Use `dcli ask-docs` only when synthesis is needed.

---

## 9) Quick Validation Checklist

- `dcli --help` works.
- `dcli context-show` returns JSON envelope.
- `dcli context-set ...` succeeds.
- `dcli search-docs ...` works without passing ids after context set.
- Codex skill is loaded after restart.
- Codex runs `dcli` flow correctly.
