# Phase 2 Complete Testing Guide (CLI + MCP + Backend)

Date: 2026-04-15  
Mode: Hackathon validation (speed + correctness, not production hardening)

## 0) What This Covers

This guide validates everything implemented through Phase 2 task `P2-T6`:
- `P2-T1` MCP scaffold
- `P2-T2` `search_docs`
- `P2-T3` `ask_docs`
- `P2-T4` `ingest_text`, `list_knowledge_bases`
- `P2-T5` stable response envelope + error mapping
- `P2-T6` CLI-first wrapper (`search-docs`, `ask-docs`, `ingest-text`, `list-kbs`)

Primary contract everywhere:
- `instance_id + namespace_id`

---

## 1) Preflight

From repo root:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install fastmcp
```

Set hackathon-safe env (optional but recommended):

```bash
export DOCUMIND_API_URL="http://localhost:8000"
export OPENAI_TIMEOUT_SECONDS=10
export VECTORDB_KEEPALIVE_TIME_MS=120000
export VECTORDB_KEEPALIVE_TIMEOUT_MS=20000
export VECTORDB_KEEPALIVE_PERMIT_WITHOUT_CALLS=false
export VECTORDB_MAX_PINGS_WITHOUT_DATA=2
```

---

## 2) Start Backend

Terminal A:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
python main.py
```

Health check:

```bash
curl -sS http://localhost:8000/health
```

Expected:
- JSON response without connection error.

---

## 3) Seed Test Data

Terminal B:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
```

Create instance:

```bash
INSTANCE_ID=$(curl -sS -X POST http://localhost:8000/instances \
  -H "Content-Type: application/json" \
  -d '{"name":"Phase2 Test Instance","description":"Complete testing run"}' | \
  python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

echo "INSTANCE_ID=${INSTANCE_ID}"
```

If the above one-liner fails in your shell, use CLI:

```bash
./run_documind_cli.sh instance-create --name "Phase2 Test Instance" --description "Complete testing run"
```

Ingest baseline docs:

```bash
curl -sS -X POST http://localhost:8000/resources \
  -H "Content-Type: application/json" \
  -d "{
    \"instance_id\":\"${INSTANCE_ID}\",
    \"namespace_id\":\"company_docs\",
    \"source_type\":\"text\",
    \"source_ref\":\"deploy.md\",
    \"content\":\"Deploy payments using npm run deploy:payments. Rollback uses npm run rollback:payments.\"
  }"

curl -sS -X POST http://localhost:8000/resources \
  -H "Content-Type: application/json" \
  -d "{
    \"instance_id\":\"${INSTANCE_ID}\",
    \"namespace_id\":\"company_docs\",
    \"source_type\":\"text\",
    \"source_ref\":\"auth.md\",
    \"content\":\"Auth flow is browser to API gateway to auth service to session token.\"
  }"
```

Expected:
- each request returns `status=success` and `chunks_indexed > 0`.

---

## 4) Automated Regression Tests

Run all relevant tests:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
python -m unittest tests/test_documind_cli.py -v
python -m unittest tests/test_mcp_search_tool.py -v
python -m unittest discover -s tests -v
```

Expected:
- all tests pass.

---

## 5) CLI-First Functional Testing (Primary)

Use wrapper:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
export DOCUMIND_API_URL="http://localhost:8000"
```

### 5.0 first-time context setup (new)

Run init first (recommended):

```bash
./run_documind_cli.sh init
```

Then verify:

```bash
./run_documind_cli.sh context-show
```

If you want explicit target instead of auto init:

```bash
./run_documind_cli.sh init \
  --instance-id "${INSTANCE_ID}" \
  --namespace-id "company_docs"
```

List instances and namespaces:

```bash
./run_documind_cli.sh instances
./run_documind_cli.sh namespaces --instance-id "${INSTANCE_ID}"
```

Switch namespace (example):

```bash
./run_documind_cli.sh context-set \
  --instance-id "${INSTANCE_ID}" \
  --namespace-id "ops"
```

Notes:
- Context is persisted in `~/.documind/contexts.json`.
- You can keep multiple contexts via `--context-id`.

### 5.1 list-kbs

```bash
./run_documind_cli.sh list-kbs --instance-id "${INSTANCE_ID}"
```

Expected:
- `status=success`
- `data.knowledge_bases` contains `company_docs` namespace entry.

### 5.2 search-docs

```bash
./run_documind_cli.sh search-docs \
  --query "deploy payments command" \
  --top-k 5
```

Expected:
- `status=success`
- relevant result text includes deploy command.

### 5.3 ask-docs

```bash
./run_documind_cli.sh ask-docs \
  --question "What is the deploy command?" \
  --top-k 5
```

Expected:
- `status=success`
- `data.answer` non-empty
- `data.sources` array present.

### 5.4 ingest-text inline

```bash
./run_documind_cli.sh ingest-text \
  --source-ref "hotfix.md" \
  --content "Hotfix command is npm run hotfix"
```

Expected:
- `status=success`
- `data.chunks_indexed >= 1`

### 5.5 ingest-text file path

```bash
cat > /tmp/documind_phase2_notes.md <<'EOF'
Semester subjects: CN, ES, CG, CD.
EOF

./run_documind_cli.sh ingest-text \
  --source-ref "phase2-notes.md" \
  --content-file /tmp/documind_phase2_notes.md
```

Expected:
- `status=success`

### 5.6 guardrail checks

Top-k cap:

```bash
./run_documind_cli.sh search-docs \
  --query "deploy" \
  --top-k 100
```

Expected:
- `status=success`
- `meta.top_k` is `20`.

Oversized ingest (should fail):

```bash
python - <<'PY'
print("x" * (200*1024 + 1))
PY > /tmp/documind_big.txt

./run_documind_cli.sh ingest-text \
  --content-file /tmp/documind_big.txt ; echo "exit=$?"
```

Expected:
- `status=error`
- `meta.error=validation_error`
- process exit code `1`.

---

## 6) MCP Functional Testing (Secondary Compatibility Path)

### 6.1 Start MCP server

Terminal C:

```bash
cd /Users/mdkaifansari04/code/projects/vector-ai/documind/backend
source .venv/bin/activate
export DOCUMIND_API_URL="http://localhost:8000"
./run_mcp_server.sh
```

### 6.2 Codex MCP form values

- Name: `documind`
- Type: `STDIO`
- Command to launch: `/Users/mdkaifansari04/code/projects/vector-ai/documind/backend/run_mcp_server.sh`
- Arguments: none
- Environment variables:
  - `DOCUMIND_API_URL` = `http://localhost:8000`
- Working directory: `/Users/mdkaifansari04/code/projects/vector-ai/documind/backend`

### 6.3 MCP test prompts

1. `Call get_active_context.`
2. `If no instances exist, call create_instance with name "Phase2 Test Instance".`
3. `Call list_instances and list_namespaces for <INSTANCE_ID>, then call set_active_context with instance_id=<INSTANCE_ID> and namespace_id=company_docs.`
4. `Call search_docs for query "deploy payments command", top_k 5.` (without ids, should use context)
5. `Call ask_docs for question "What is the deploy command?"` (without ids, should use context)
6. `Call ingest_text with source_ref "patch.md" and content "Patch command is npm run patch". Then call search_docs for query "patch command".`
7. `Switch context by calling set_active_context with namespace_id=ops, then call get_active_context and confirm namespace changed.`
8. `Call search_docs with namespace_id does-not-exist and verify structured error response.`

Expected:
- same envelope shape as CLI.

---

## 7) Response Contract Validation

For all CLI/MCP tools, validate:

```json
{
  "status": "success|error",
  "data": {},
  "meta": {},
  "text": "optional"
}
```

Error enum must be one of:
- `not_found`
- `validation_error`
- `timeout`
- `server_error`

Fallback indicators:
- `search_docs`: if fallback used, `meta.fallback_used=true` and `meta.path="/search/advanced"`
- `ask_docs`: if fallback used, `meta.fallback_used=true` and `meta.path="/query/advanced"`

---

## 8) Latency Validation (Important)

Measure CLI timings:

```bash
time ./run_documind_cli.sh search-docs \
  --query "deploy payments command" \
  --instance-id "${INSTANCE_ID}" \
  --namespace-id "company_docs" \
  --top-k 5 >/tmp/search_out.json

time ./run_documind_cli.sh ask-docs \
  --question "What is the deploy command?" \
  --instance-id "${INSTANCE_ID}" \
  --namespace-id "company_docs" \
  --top-k 5 >/tmp/ask_out.json
```

Hackathon expectation:
- `search-docs` should generally be much faster than `ask-docs`.
- for pure factual queries (counts, names, exact values), prefer `search-docs`.
- use `ask-docs` for synthesis and natural language responses.

---

## 9) Troubleshooting

### `MCP server not available`

- remove/uninstall old broken MCP entry in Codex.
- re-add using `run_mcp_server.sh`.
- ensure command path has no wrapped spaces/newlines.
- restart Codex workspace/session after adding.

### `connection refused localhost:8000`

- backend is not running.
- start `python main.py` in `documind/backend`.

### `too_many_pings / ENHANCE_YOUR_CALM`

- this comes from gRPC keepalive behavior to VectorAI.
- use provided env values:
  - `VECTORDB_KEEPALIVE_TIME_MS=120000`
  - `VECTORDB_KEEPALIVE_PERMIT_WITHOUT_CALLS=false`
  - `VECTORDB_MAX_PINGS_WITHOUT_DATA=2`
- restart backend after changing env.

### `ask-docs is slow`

- this is expected vs `search-docs` because it includes answer generation.
- try `search-docs` first for exact/factual questions.
- keep `OPENAI_TIMEOUT_SECONDS=10` for fast failover behavior.

### `unknown answer from ask-docs`

- run `search-docs` with tighter keyword query to inspect retrieved chunks.
- confirm the content is actually ingested in target `instance_id + namespace_id`.

---

## 10) Go / No-Go Checklist

Mark each line PASS/FAIL:

- Backend starts and `/health` works.
- Test data ingested in `company_docs`.
- Unit/integration tests pass.
- CLI commands all work: `list-kbs`, `search-docs`, `ask-docs`, `ingest-text`.
- CLI error behavior works (oversize, wrong namespace, invalid inputs).
- MCP server connects in Codex using `run_mcp_server.sh`.
- MCP tools return same envelope and error enums as CLI.
- `search-docs` latency is acceptable for interactive use.
- `ask-docs` behavior is acceptable for synthesis use.

If all PASS, Phase 2 testing is complete for current hackathon scope.

---

## 11) Feedback Template (Copy/Paste)

```md
## Phase 2 Complete Test Feedback

- Date:
- Tester:
- Client(s): (CLI / Codex MCP / Claude Code / OpenCode)

- Backend health: PASS/FAIL
- Automated tests: PASS/FAIL
- CLI list-kbs: PASS/FAIL
- CLI search-docs: PASS/FAIL
- CLI ask-docs: PASS/FAIL
- CLI ingest-text: PASS/FAIL
- CLI error handling: PASS/FAIL
- MCP connection: PASS/FAIL
- MCP tool parity with CLI: PASS/FAIL
- Response envelope consistency: PASS/FAIL
- Latency acceptable for hackathon: PASS/FAIL

- Observed avg search-docs time:
- Observed avg ask-docs time:

- Issues found:
  - 
  - 

- Suggested changes:
  - 
  - 
```
