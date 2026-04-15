# Commit Guidelines

## Core Principles
- Batch related changes together (single responsibility per commit)
- Prefer multiple small commits over one large commit
- Avoid mixing unrelated changes
- Keep commits buildable (project should run/tests pass at each commit when feasible)

## Commit Message Format
- Use Conventional Commits style when possible:
  - feat: new feature
  - fix: bug fix
  - refactor: code change without behavior change
  - docs: documentation only
  - test: tests added/updated
  - chore: tooling, config, maintenance
  - build: dependencies or build system
- Subject line: <= 72 chars, imperative mood ("add", "fix", not "added")
- Focus on *why*, not just *what*
- Optional body for context, tradeoffs, or follow-ups

## Batching Strategy
- Separate commits by concern:
  - infra/config (e.g., .gitignore, deps)
  - core logic (services, algorithms)
  - API/schema changes
  - tests
  - docs
- Large features should be split into incremental commits (scaffold → core → integration → tests → docs)

## Code Hygiene
- Do not commit:
  - secrets (.env, credentials)
  - build artifacts, caches, virtual envs
- Keep diffs minimal (avoid unrelated formatting changes)
- Add comments only where necessary for clarity

## Reviewability
- Each commit should be easy to review in isolation
- Prefer explicit over clever changes
- Keep renames/refactors separate from logic changes when possible

## When User Says "commit"
- Review working tree
- Group files into logical commits
- Create multiple commits if needed
- Ensure messages are consistent and meaningful
