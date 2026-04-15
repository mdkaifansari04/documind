# Phase 2 Kickoff (Agent Integration)

Date: 2026-04-15
Status: Ready to start

## Goal

Ship agent-driven answers on top of the existing Phase 1 retrieval APIs, without changing core retrieval logic yet.

## Start Sequence (Recommended)

1. Keep current retrieval stack as-is (`semantic` and `hybrid`).
2. Add a `search_docs` tool wrapper that calls existing retrieval flow.
3. Add an agent orchestration layer that can decide:
   - answer directly from retrieved chunks, or
   - ask follow-up retrieval with tighter filters.
4. Add prompt policy for grounded answers:
   - cite sources
   - say "I don't know" when context is insufficient.
5. Add observability fields for agent runs (tool calls, retries, fallback mode).

## Implementation Thoughts (Short)

- Reuse current `QueryRouter` + `RetrievalService`; avoid API breakage.
- Keep `instance_id + namespace_id` as the primary target contract.
- Start with one tool (`search_docs`) before adding more tools.
- Keep synchronous flow first; add async/background jobs only if latency becomes a real issue.
- Add guardrails before "smarter" agent behavior:
  - max tool-call loop count
  - timeout budget
  - deterministic fallback response.

## First Slice Plan

1. Add `AgentOrchestrator` service for tool-call loop and final answer composition.
2. Implement `search_docs` tool adapter over current advanced retrieval endpoint behavior (`instance_id + namespace_id` contract).
3. Add `/query/agent` endpoint (instance-scoped, namespace-targeted) behind existing request model style.
4. Add tests for:
   - no-result handling
   - multi-step retrieval loop cutoff
   - source citation shape.

## Keep / Defer

Keep now:
- current hybrid approach
- current collection strategy
- current ingestion flow

Defer for later:
- native fusion migration experiments
- collection consolidation refactor
- indexing bootstrap automation per collection (once server support path is finalized)
