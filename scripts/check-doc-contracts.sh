#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

MAX_AGE_DAYS=${DOC_STALE_DAYS:-45}

required_files=(
  "AGENTS.md"
  "CLAUDE.md"
  ".github/copilot-instructions.md"
  "COMMIT.md"
  "TODOS.md"
  "DECISIONS.md"
  "docs/docs-index.md"
  "docs/agent/agent-workflow.md"
  "documind/backend/AGENTS.md"
  "documind/frontend/AGENTS.md"
  "documind/documentation/AGENTS.md"
  "demo-test-app/AGENTS.md"
)

failures=0

to_epoch() {
  local d=$1
  if date -d "$d" +%s >/dev/null 2>&1; then
    date -d "$d" +%s
  else
    date -j -f "%Y-%m-%d" "$d" "+%s"
  fi
}

echo "[docs-contract] checking required files"
for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: missing required file: $f"
    failures=$((failures + 1))
  fi
done

echo "[docs-contract] checking docs-index entries"
if [[ -f "docs/docs-index.md" ]]; then
  for f in "${required_files[@]}"; do
    indexed_pattern=$(printf '`%s`' "$f")
    if ! grep -Fq "$indexed_pattern" docs/docs-index.md; then
      echo "ERROR: docs/docs-index.md missing entry for: $f"
      failures=$((failures + 1))
    fi
  done
fi

echo "[docs-contract] checking freshness metadata"
now_epoch=$(date +%s)
for f in "${required_files[@]}"; do
  [[ -f "$f" ]] || continue

  updated_line=$(grep -m1 -E '^Last updated: [0-9]{4}-[0-9]{2}-[0-9]{2}$' "$f" || true)
  if [[ -z "$updated_line" ]]; then
    echo "ERROR: missing or invalid 'Last updated: YYYY-MM-DD' in $f"
    failures=$((failures + 1))
    continue
  fi

  updated_date=${updated_line#Last updated: }
  updated_epoch=$(to_epoch "$updated_date" 2>/dev/null || true)
  if [[ -z "$updated_epoch" ]]; then
    echo "ERROR: could not parse Last updated date in $f: $updated_date"
    failures=$((failures + 1))
    continue
  fi

  age_days=$(( (now_epoch - updated_epoch) / 86400 ))
  if (( age_days > MAX_AGE_DAYS )); then
    echo "ERROR: stale doc $f (age ${age_days}d > ${MAX_AGE_DAYS}d)"
    failures=$((failures + 1))
  fi
done

if (( failures > 0 )); then
  echo "[docs-contract] FAILED ($failures issue(s))"
  exit 1
fi

echo "[docs-contract] PASSED"
