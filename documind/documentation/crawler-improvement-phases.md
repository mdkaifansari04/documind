# Universal Documentation Crawler Improvements

## Goal
Improve link discovery from a single seed URL so "crawl subpages" works reliably across documentation sites, then improve multi-seed crawling and ingestion efficiency.

## Phase 1: Discovery Scope + Link Quality (Core Fix)

### Problem
Current crawling can miss valid sibling documentation pages when scope is inferred too narrowly from the full seed path.

### Changes
1. Add better scope inference from seed URL.
2. Add configurable crawl scope mode:
   - `strict_docs` (default): only inside inferred/explicit docs scope path.
   - `same_domain`: any page on the same host.
3. Add optional `scope_path` override for precise control.
4. Improve URL normalization/filtering:
   - drop fragments and tracking query params,
   - reject obvious assets (pdf/png/js/css/zip/etc),
   - canonicalize host/scheme.
5. Extend sitemap candidate discovery and fallback extraction quality.

### Test Plan
- Unit/API tests for inferred scope behavior.
- Tests for strict vs domain mode filtering.
- Tests for URL filtering/normalization for assets/tracking params.

## Phase 2: Crawl Preview UX + Better Link Selection

### Changes
1. Return richer preview metadata per link:
   - confidence score,
   - reasoning tags,
   - seed/source details.
2. Resources UI updates:
   - show score badges,
   - "select high confidence" helper,
   - expose scope mode/path controls.
3. Preserve manual user selection before ingest.

### Test Plan
- API tests for scored preview payload.
- Frontend type/build checks.

## Phase 3: Multi-Seed + Incremental Ingestion

### Changes
1. Support crawling from multiple seed URLs in one request.
2. Merge + dedupe discovered links across seeds.
3. Add incremental mode (`skip_existing`) to avoid re-ingesting URLs already in a KB.
4. Include skipped counts/details in ingest response.
5. UI support for multiple seeds and incremental toggle.

### Test Plan
- API tests for multi-seed dedupe.
- API tests for skip-existing behavior.
- End-to-end build/tests.

## Success Criteria
1. A seed URL like `/docs/<section>/overview` finds sibling documentation pages predictably.
2. Users can preview and select high-confidence discovered pages.
3. Multi-seed crawl works in one run and avoids duplicate ingestion when enabled.
