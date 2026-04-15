# CodeRabbit Review Workflow

## Purpose

Use CodeRabbit CLI as the primary reviewer for this repository and apply high-value review feedback safely.

## Run CodeRabbit

From the repository root:

```bash
CodeRabbit --agent
```

## When User Says "review"

Execute this flow:

1. Run `CodeRabbit --agent`.
2. Collect findings and group them by severity:
   - correctness/bugs
   - security/data safety
   - performance risks
   - maintainability/readability
3. Apply suggestions that are clearly correct and aligned with repository requirements.
4. Do not apply suggestions blindly; reject or defer anything that conflicts with `SPEC.md` or established architecture.
5. Run relevant verification commands after changes (tests/lint/type-check).
6. Report:
   - what CodeRabbit suggested
   - what was changed
   - what was skipped and why
   - any remaining follow-up tasks

## Decision Rules

- Prioritize fixes that prevent bugs, regressions, or unsafe behavior.
- Treat style-only or speculative refactors as optional.
- Prefer minimal diffs with clear impact.
- Keep all accepted changes verifiable with project checks.
