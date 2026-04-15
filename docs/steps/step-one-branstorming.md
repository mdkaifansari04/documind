# Step One Brainstorming: Multi-Instance RAG Backend on Actian VectorAI DB

Date: 2026-04-14  
Scope: reference brainstorming doc for next implementation phase (FastAPI backend, no-auth MVP).

---

## 1. What You Already Have Working (Current-State Audit)

### 1.1 Runtime and DB

- Docker container is running:
  - `vectoraidb` (`williamimoh/actian-vectorai-db:latest`)
  - port mapping: `50051 -> 50051`
- Health check from live SDK call:
  - `Actian VectorAI DB 1.0.0 / VDE 1.0.0`

### 1.2 Backend prototype status

- `backend/main.py` is a working CLI-style RAG demo (not a FastAPI server yet).
- It already does:
  - chunking
  - embeddings (`all-MiniLM-L6-v2`, 384 dim)
  - collection create
  - point upsert with payload
  - similarity search
  - answer generation:
    - local context answer
    - OpenAI answer (`gpt-4o-mini`) when `OPENAI_API_KEY` is present

### 1.3 Proven persisted collections

Live collections found:

- `rag_demo_17af5853`
- `rag_demo_8e7e31db`

Both currently have:

- 15 points
- 1 segment
- payload keys per chunk: `chunk_id`, `char_count`, `text`

### 1.4 Under-the-hood persistence confirmed

From `actian-vectorAI-db-beta/data/` and `vde.log`, persistence is file-based under mounted `/data`:

- `/data/<collection>/metadata.json`
- `/data/<collection>/segment_0/id_map.btr`
- `/data/<collection>/segment_0/segment_state.btr`
- `/data/<collection>/segment_0/vectors/_default/vectors.btr`
- `/data/<collection>/segment_0/payloads/payloads.btr` (created when payload store is active)

This validates your observation: no separate remote DB required for vector persistence when container volume is mounted.

---

## 2. Key Gap Between Prototype and Product Backend

Current prototype is single-run, ephemeral workflow:

- generates random `rag_demo_<id>`
- ingests one knowledge blob
- queries
- deletes collection at cleanup

For the actual backend, we need a stable **control plane** so we can:

- create long-lived namespaces / knowledge bases
- map user-visible IDs to VectorAI collection names
- route every query to the right collection(s)
- avoid losing collections by default

---

## 3. Brainstorm: Namespace / Multi-Instance Strategies

### Option A: Collection per Knowledge Base (Recommended for MVP)

Model:

- one logical KB == one Actian collection
- `instance_id` groups multiple KBs
- each KB has one embedding model + one vector dimension

Pros:

- simple routing and isolation
- easier delete/rebuild per KB
- low cognitive overhead
- clean for hackathon demo and early production

Cons:

- many KBs means many collections

Use when:

- multiple independent resources/projects/teams

---

### Option B: One Collection per Instance + Payload Namespace Filters

Model:

- one large collection per instance
- store `namespace`, `resource_type`, `kb_id` in payload
- filter at query-time

Pros:

- fewer collections
- unified global search possible

Cons:

- strict filter discipline required
- easier to leak irrelevant context if filters are wrong
- harder lifecycle operations per KB

Use when:

- you need frequent cross-namespace blending

---

### Option C: Collection per Resource/File

Model:

- each uploaded PDF/URL/transcript gets its own collection

Pros:

- extreme isolation

Cons:

- too many collections quickly
- expensive to orchestrate multi-collection query fan-out
- overkill for current stage

Use when:

- almost never for MVP

---

## 4. Recommended Direction (Step-One Decision)

Choose **Option A** now:

- `RAG Instance` = product/workspace/session scope
- `Knowledge Base` = collection-level storage unit
- `Namespace` = logical grouping label (metadata + routing), not physical DB server

This directly answers your question "how do we fetch from specific DB ID/model ID/instance":

- Actian gives you **collection names**, not product-level instance IDs.
- We define our own logical IDs and map them to collection names.

---

## 5. ID Strategy (Critical)

### 5.1 Logical IDs (control plane)

- `instance_id` (UUID): top-level RAG app/workspace
- `kb_id` (UUID): knowledge base under instance
- `namespace_id` (string): logical group like `company_docs`, `conversation_memory`, `support_tickets`
- `resource_id` (UUID): uploaded source (pdf/url/md/etc)
- `chunk_id` (int or UUID): chunk inside resource

### 5.2 Physical ID in Actian

- `collection_name` (string) generated deterministically, for example:
  - `kb_<short_instance>_<short_kb>`

Suggested mapping table:

- `knowledge_bases`
  - `kb_id`
  - `instance_id`
  - `namespace_id`
  - `collection_name`
  - `embedding_model`
  - `embedding_dim`
  - `distance_metric`
  - `status`

### 5.3 Point payload schema (minimum)

- `instance_id`
- `kb_id`
- `namespace_id`
- `resource_id`
- `chunk_id`
- `source_type` (`pdf`, `url`, `md`, `txt`, `youtube`, `conversation_history_json`, etc.)
- `source_ref` (filename/url/video id)
- `text`
- `created_at`
- optional: `user_id`, `session_id`, `conversation_id`

---

## 6. Multi-Instance RAG Model (Practical Interpretation)

"Multiple instances of ragmod" should mean:

- one backend service process (FastAPI)
- many logical RAG instances in metadata
- each instance can own multiple KBs/collections
- query endpoint always receives `instance_id` and target `kb_id` or `namespace_id`

No need to run separate Docker DB per tenant for MVP.

---

## 7. Similarity Search Routing Rules

### 7.1 Single-KB query

1. Receive `(instance_id, kb_id, query)`
2. Resolve `collection_name` from metadata store
3. Embed query with that KB’s configured model
4. `client.points.search(collection_name, ...)`
5. return hits + provenance

### 7.2 Namespace query

1. Receive `(instance_id, namespace_id, query)`
2. resolve all KBs in that namespace
3. fan-out search to each KB
4. merge/rerank (RRF optional)
5. return top-k global

### 7.3 Global instance query

- same as namespace query but across all KBs for that instance

---

## 8. Proposed FastAPI MVP Surface (No Auth)

### 8.1 Instance / KB management

- `POST /instances`
- `GET /instances`
- `POST /instances/{instance_id}/knowledge-bases`
- `GET /instances/{instance_id}/knowledge-bases`
- `GET /knowledge-bases/{kb_id}`

### 8.2 Ingestion

- `POST /knowledge-bases/{kb_id}/resources`
  - supports text, file path/upload, URL, YouTube transcript, conversation history JSON/text
- `POST /knowledge-bases/{kb_id}/reindex` (optional)

### 8.3 Retrieval

- `POST /query` (RAG answer)
- `POST /search` (raw similarity hits only)
- `POST /memory/query` (conversation namespace specialization)

### 8.4 Observability/debug

- `GET /health`
- `GET /collections` (debug map of KB -> Actian collection)
- `GET /instances/{instance_id}/stats`

---

## 9. Storage + Metadata Recommendation

Use a tiny local metadata DB (SQLite) for control-plane tables:

- `instances`
- `knowledge_bases`
- `resources`
- `ingestion_jobs`

Reason:

- Actian stores vectors well, but not your product-level routing entities.
- SQLite keeps MVP simple and deterministic with no extra infra.

---

## 10. Concrete Findings From Your Current Code/Config

1. `backend/main.py` is valid proof-of-concept and uses modern `actian_vectorai` API correctly.  
2. Chunk payload shape is consistent and reusable.  
3. File-level persistence is proven via existing `rag_demo_*` directories and metadata.  
4. Current script cleanup deletes collection; for persistent KBs this must become optional or removed for production mode.  
5. `backend/requirements.txt` currently uses `sentence-transformers=5.4.0` / `openai=2.31.0`; pip-compatible pinning should be `==` for reproducible installs.

---

## 11. Risks / Design Constraints To Lock Early

1. Embedding model immutability per KB: never mix vector dimensions in one KB.
2. ID ownership: backend control plane, not auto-generated collection names.
3. Namespace leakage: enforce `instance_id` + `kb_id/namespace` checks in every query.
4. Cleanup safety: avoid accidental delete of long-lived collections.
5. Batch ingestion path: use batch upsert / smart batch patterns once ingest volume grows.

---

## 12. Step-Two Implementation Plan (High-Level)

1. Convert backend into FastAPI app skeleton (`backend/app.py` + routers).  
2. Add SQLite metadata models + repository layer.  
3. Implement instance/KB create + deterministic collection creation in Actian.  
4. Implement ingestion endpoint for text/markdown/json first, then pdf/url/youtube adapters.  
5. Implement `/search` and `/query` routing by `kb_id`.  
6. Add namespace fan-out query and reranking.  
7. Add `conversation_memory` namespace behavior.  
8. Add ingestion/query logging + basic observability endpoints.

---

## 13. Final Step-One Recommendation

Build the backend as a **single FastAPI service + Actian DB + SQLite metadata control plane**, with **collection-per-KB namespacing**.

That gives you:

- clear IDs and routing
- multi-instance support without heavy infrastructure
- persistent knowledge bases
- a clean path to advanced retrieval and memory features in later steps

