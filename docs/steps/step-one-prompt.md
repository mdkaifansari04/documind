# DocuMind — Step One Agent Prompt
### Complete build instruction for AI coding agent

---

## YOUR MISSION

You are building **DocuMind** — an AI-powered internal documentation intelligence system that lets companies feed their private docs into a vector database and query them with natural language via an AI agent.

You will build this in **three phases in strict order**:
1. **Phase 1 — FastAPI Backend** (core server, DB, ingestion, retrieval)
2. **Phase 2 — AI Agent Integration** (LangChain agent + search tool wired to vector DB)
3. **Phase 3 — Frontend** (React + Tailwind chat UI + resource ingestion dashboard)

Do not start Phase 2 until Phase 1 is fully working. Do not start Phase 3 until Phase 2 is fully working.

---

## TECH STACK (NON-NEGOTIABLE)

| Layer | Technology |
|---|---|
| Vector Database | Actian VectorAI DB (Docker, gRPC port 50051) |
| Python SDK | `actian-vectorai` (already installed) |
| Backend framework | FastAPI (Python 3.10+) |
| Control-plane DB | PostgreSQL + Prisma (via `prisma` Python client) |
| Embedding — fast/free | `sentence-transformers/all-MiniLM-L6-v2` (384d) |
| Embedding — quality | `BAAI/bge-small-en-v1.5` (384d, better accuracy) |
| Embedding — premium | OpenAI `text-embedding-3-small` (1536d, needs `OPENAI_API_KEY`) |
| LLM for answers | OpenAI `gpt-4o-mini` (needs `OPENAI_API_KEY`) |
| Agent framework | LangChain |
| RAG eval | `ragas` (for observability scoring) |
| Frontend | React 18 + Tailwind CSS + Vite |
| Package manager | `uv` for Python, `pnpm` for frontend |

---

## PROJECT STRUCTURE

Create this exact folder layout before writing any code:

```
documind/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # env vars, constants
│   │   ├── database.py              # Prisma client setup
│   │   ├── vectordb.py              # Actian VectorAI DB client wrapper
│   │   ├── embeddings.py            # Smart embedding router
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── instances.py         # /instances endpoints
│   │   │   ├── knowledge_bases.py   # /knowledge-bases endpoints
│   │   │   ├── resources.py         # /resources ingestion endpoints
│   │   │   ├── query.py             # /query + /search endpoints
│   │   │   ├── memory.py            # /memory endpoints
│   │   │   └── observability.py     # /observability endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py         # chunking + embedding + upsert logic
│   │   │   ├── retrieval.py         # similarity search + reranking
│   │   │   ├── agent.py             # LangChain agent + search_docs tool
│   │   │   └── observability.py     # RAG scoring pipeline
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py           # Pydantic request/response models
│   ├── prisma/
│   │   └── schema.prisma            # Prisma schema
│   ├── .env                         # Environment variables
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── Chat.tsx             # Chat interface
│   │   │   └── Dashboard.tsx        # Resource ingestion dashboard
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ResourceUploader.tsx
│   │   │   ├── KnowledgeBaseCard.tsx
│   │   │   └── ObservabilityPanel.tsx
│   │   └── lib/
│   │       └── api.ts               # API client
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── docker-compose.yml               # Actian VectorAI DB container
```

---

## ENVIRONMENT VARIABLES

Create `backend/.env` with:

```env
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/documind"

# Actian VectorAI DB
VECTORDB_HOST=localhost
VECTORDB_PORT=50051

# OpenAI
OPENAI_API_KEY=your_key_here

# Embedding model selection
# Options: "minilm" | "bge" | "openai"
DEFAULT_EMBEDDING_MODEL=minilm

# App
APP_ENV=development
APP_PORT=8000
```

---

## PHASE 1 — FASTAPI BACKEND

### Step 1.1 — Prisma Schema

Create `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider             = "prisma-client-py"
  recursive_type_depth = 5
}

model Instance {
  id          String          @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  knowledgeBases KnowledgeBase[]
}

model KnowledgeBase {
  id              String     @id @default(uuid())
  instanceId      String
  name            String
  namespaceId     String     @default("company_docs")
  collectionName  String     @unique
  embeddingModel  String     @default("minilm")
  embeddingDim    Int        @default(384)
  distanceMetric  String     @default("cosine")
  status          String     @default("active")
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  instance        Instance   @relation(fields: [instanceId], references: [id])
  resources       Resource[]

  @@index([instanceId])
  @@index([namespaceId])
}

model Resource {
  id              String        @id @default(uuid())
  knowledgeBaseId String
  sourceType      String        // pdf | markdown | text | url | conversation_json
  sourceRef       String        // filename or url
  chunksIndexed   Int           @default(0)
  status          String        @default("pending")  // pending | processing | done | failed
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  knowledgeBase   KnowledgeBase @relation(fields: [knowledgeBaseId], references: [id])

  @@index([knowledgeBaseId])
}

model QueryLog {
  id                 String   @id @default(uuid())
  knowledgeBaseId    String
  query              String
  retrievalScore     Float?
  chunkRelevance     Float?
  hallucinationRate  Float?
  chunksRetrieved    Int      @default(0)
  responseMs         Int?
  createdAt          DateTime @default(now())

  @@index([knowledgeBaseId])
  @@index([createdAt])
}
```

Run:
```bash
cd backend
prisma generate
prisma db push
```

---

### Step 1.2 — Actian VectorDB Wrapper (`backend/app/vectordb.py`)

```python
from actian_vectorai import VectorAIClient, AsyncVectorAIClient, VectorParams, Distance, PointStruct, HnswConfigDiff
from app.config import settings
import asyncio

DISTANCE_MAP = {
    "cosine": Distance.Cosine,
    "euclid": Distance.Euclid,
    "dot": Distance.Dot,
}

class VectorDB:
    def __init__(self):
        self._host = f"{settings.VECTORDB_HOST}:{settings.VECTORDB_PORT}"

    def get_client(self):
        return VectorAIClient(self._host)

    def get_async_client(self):
        return AsyncVectorAIClient(self._host)

    def health_check(self) -> dict:
        with self.get_client() as client:
            return client.health_check()

    def create_collection(self, name: str, dim: int, distance: str = "cosine"):
        with self.get_client() as client:
            if not client.collections.exists(name):
                client.collections.create(
                    name,
                    vectors_config=VectorParams(
                        size=dim,
                        distance=DISTANCE_MAP[distance],
                    ),
                    hnsw_config=HnswConfigDiff(m=16, ef_construct=200),
                )

    def upsert_points(self, collection: str, points: list[PointStruct]):
        with self.get_client() as client:
            client.points.upsert(collection, points)

    def search(self, collection: str, vector: list[float], top_k: int = 5, filters=None) -> list:
        with self.get_client() as client:
            return client.points.search(
                collection,
                vector=vector,
                limit=top_k,
                filter=filters,
            )

    def delete_collection(self, name: str):
        with self.get_client() as client:
            if client.collections.exists(name):
                client.collections.delete(name)

    def count_points(self, collection: str) -> int:
        with self.get_client() as client:
            return client.points.count(collection)

vectordb = VectorDB()
```

---

### Step 1.3 — Smart Embedding Router (`backend/app/embeddings.py`)

This is critical. Different tasks use different models. The router picks the right one automatically.

```python
from enum import Enum
from functools import lru_cache
from typing import Union
from app.config import settings

class EmbeddingModel(str, Enum):
    MINILM = "minilm"       # all-MiniLM-L6-v2, 384d — fast, free, good for most tasks
    BGE = "bge"             # BAAI/bge-small-en-v1.5, 384d — better accuracy, still free
    OPENAI = "openai"       # text-embedding-3-small, 1536d — premium accuracy

EMBEDDING_DIMS = {
    EmbeddingModel.MINILM: 384,
    EmbeddingModel.BGE: 384,
    EmbeddingModel.OPENAI: 1536,
}

def get_embedding_dim(model: EmbeddingModel) -> int:
    return EMBEDDING_DIMS[model]

@lru_cache(maxsize=3)
def _load_sentence_transformer(model_name: str):
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(model_name)

def embed_texts(texts: list[str], model: EmbeddingModel = None) -> list[list[float]]:
    """
    Embed a list of texts using the selected model.
    Model selection logic:
    - Default model from config (minilm for MVP)
    - Pass model= to override for specific tasks
    - Use openai for premium quality when OPENAI_API_KEY is present and accuracy matters
    """
    if model is None:
        model = EmbeddingModel(settings.DEFAULT_EMBEDDING_MODEL)

    if model == EmbeddingModel.OPENAI:
        return _embed_openai(texts)
    elif model == EmbeddingModel.BGE:
        st_model = _load_sentence_transformer("BAAI/bge-small-en-v1.5")
        return st_model.encode(texts, normalize_embeddings=True).tolist()
    else:  # default: minilm
        st_model = _load_sentence_transformer("sentence-transformers/all-MiniLM-L6-v2")
        return st_model.encode(texts, normalize_embeddings=True).tolist()

def embed_query(query: str, model: EmbeddingModel = None) -> list[float]:
    """Embed a single query string."""
    return embed_texts([query], model=model)[0]

def _embed_openai(texts: list[str]) -> list[list[float]]:
    import openai
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small",
    )
    return [item.embedding for item in response.data]

def smart_select_model(source_type: str, chunk_count: int) -> EmbeddingModel:
    """
    Automatically pick the best embedding model for a given ingestion task.
    Rules:
    - conversation_memory + small docs → minilm (fast)
    - large docs / PDFs → bge (better accuracy)
    - compliance / legal / critical docs → openai (premium)
    - default → minilm
    """
    if source_type in ("conversation_history_json", "transcript"):
        return EmbeddingModel.MINILM
    if source_type in ("pdf",) and chunk_count > 50:
        return EmbeddingModel.BGE
    return EmbeddingModel(settings.DEFAULT_EMBEDDING_MODEL)
```

---

### Step 1.4 — Ingestion Service (`backend/app/services/ingestion.py`)

```python
import uuid
from typing import Any
from actian_vectorai import PointStruct
from app.vectordb import vectordb
from app.embeddings import embed_texts, smart_select_model, EmbeddingModel, get_embedding_dim

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def load_text_from_source(source_type: str, content: str) -> str:
    """
    Parse raw content from different source types into clean text.
    Supports: text, markdown, pdf (base64), url, conversation_history_json
    """
    if source_type in ("text", "markdown"):
        return content

    if source_type == "conversation_history_json":
        import json
        try:
            messages = json.loads(content)
            return "\n".join(
                f"{m.get('role','').upper()}: {m.get('content','')}"
                for m in messages
                if m.get("content")
            )
        except Exception:
            return content  # fallback: treat as raw text

    if source_type == "pdf":
        import base64, io
        try:
            from pypdf import PdfReader
            pdf_bytes = base64.b64decode(content)
            reader = PdfReader(io.BytesIO(pdf_bytes))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise ValueError(f"PDF parsing failed: {e}")

    if source_type == "url":
        try:
            import httpx
            from bs4 import BeautifulSoup
            resp = httpx.get(content, timeout=15, follow_redirects=True)
            soup = BeautifulSoup(resp.text, "html.parser")
            return soup.get_text(separator="\n", strip=True)
        except Exception as e:
            raise ValueError(f"URL fetch failed: {e}")

    return content

def ingest_resource(
    collection_name: str,
    source_type: str,
    content: str,
    metadata: dict[str, Any],
    embedding_model: EmbeddingModel = None,
) -> int:
    """
    Full ingestion pipeline:
    1. Parse content → clean text
    2. Chunk text
    3. Auto-select embedding model if not specified
    4. Embed all chunks
    5. Upsert into Actian VectorAI DB
    Returns number of chunks indexed.
    """
    # 1. Parse
    text = load_text_from_source(source_type, content)
    if not text.strip():
        raise ValueError("No text content extracted from source")

    # 2. Chunk
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No chunks produced from content")

    # 3. Auto-select model
    if embedding_model is None:
        embedding_model = smart_select_model(source_type, len(chunks))

    # 4. Embed
    embeddings = embed_texts(chunks, model=embedding_model)

    # 5. Build PointStructs with rich payload
    points = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        point_id = abs(hash(f"{metadata.get('resource_id', '')}_{i}")) % (10**15)
        points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "text": chunk,
                    "chunk_index": i,
                    "source_type": source_type,
                    "resource_id": metadata.get("resource_id", ""),
                    "kb_id": metadata.get("kb_id", ""),
                    "instance_id": metadata.get("instance_id", ""),
                    "namespace_id": metadata.get("namespace_id", "company_docs"),
                    "source_ref": metadata.get("source_ref", ""),
                    "user_id": metadata.get("user_id", ""),
                    "session_id": metadata.get("session_id", ""),
                    "created_at": metadata.get("created_at", ""),
                },
            )
        )

    # 6. Upsert (batched internally by SDK)
    vectordb.upsert_points(collection_name, points)
    return len(chunks)
```

---

### Step 1.5 — Retrieval Service (`backend/app/services/retrieval.py`)

```python
from app.vectordb import vectordb
from app.embeddings import embed_query, EmbeddingModel

def search_knowledge_base(
    collection_name: str,
    query: str,
    top_k: int = 5,
    embedding_model: EmbeddingModel = None,
    filters=None,
) -> list[dict]:
    """
    Semantic similarity search in a knowledge base.
    Returns list of dicts with text, score, and metadata.
    """
    query_vector = embed_query(query, model=embedding_model)
    results = vectordb.search(collection_name, vector=query_vector, top_k=top_k, filters=filters)

    return [
        {
            "text": r.payload.get("text", ""),
            "score": r.score,
            "source_ref": r.payload.get("source_ref", ""),
            "chunk_index": r.payload.get("chunk_index", 0),
            "resource_id": r.payload.get("resource_id", ""),
            "namespace_id": r.payload.get("namespace_id", ""),
        }
        for r in results
    ]

def search_memory(
    collection_name: str,
    query: str,
    user_id: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Memory-specific retrieval filtered by user_id.
    Always uses minilm (fast) for memory retrieval.
    """
    from actian_vectorai import Field, FilterBuilder
    f = FilterBuilder().must(Field("user_id").eq(user_id)).build()
    return search_knowledge_base(
        collection_name,
        query,
        top_k=top_k,
        embedding_model=EmbeddingModel.MINILM,
        filters=f,
    )
```

---

### Step 1.6 — FastAPI Routers

#### `backend/app/routers/instances.py`
```python
from fastapi import APIRouter, HTTPException
from prisma import Prisma
from app.models.schemas import CreateInstanceRequest, InstanceResponse
import uuid

router = APIRouter(prefix="/instances", tags=["instances"])

@router.post("", response_model=InstanceResponse)
async def create_instance(body: CreateInstanceRequest):
    db = Prisma()
    await db.connect()
    instance = await db.instance.create(
        data={"id": str(uuid.uuid4()), "name": body.name, "description": body.description}
    )
    await db.disconnect()
    return instance

@router.get("", response_model=list[InstanceResponse])
async def list_instances():
    db = Prisma()
    await db.connect()
    instances = await db.instance.find_many()
    await db.disconnect()
    return instances
```

#### `backend/app/routers/knowledge_bases.py`
```python
from fastapi import APIRouter, HTTPException
from prisma import Prisma
from app.vectordb import vectordb
from app.embeddings import get_embedding_dim, EmbeddingModel
from app.models.schemas import CreateKBRequest, KBResponse
import uuid

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])

def make_collection_name(instance_id: str, kb_id: str) -> str:
    return f"kb_{instance_id[:8]}_{kb_id[:8]}"

@router.post("", response_model=KBResponse)
async def create_knowledge_base(body: CreateKBRequest):
    db = Prisma()
    await db.connect()

    kb_id = str(uuid.uuid4())
    embedding_model = EmbeddingModel(body.embedding_model or "minilm")
    dim = get_embedding_dim(embedding_model)
    collection_name = make_collection_name(body.instance_id, kb_id)

    # Create Actian collection
    vectordb.create_collection(collection_name, dim=dim, distance="cosine")

    # Save to Postgres
    kb = await db.knowledgebase.create(data={
        "id": kb_id,
        "instanceId": body.instance_id,
        "name": body.name,
        "namespaceId": body.namespace_id or "company_docs",
        "collectionName": collection_name,
        "embeddingModel": embedding_model.value,
        "embeddingDim": dim,
    })
    await db.disconnect()
    return kb

@router.get("/{kb_id}", response_model=KBResponse)
async def get_knowledge_base(kb_id: str):
    db = Prisma()
    await db.connect()
    kb = await db.knowledgebase.find_unique(where={"id": kb_id})
    await db.disconnect()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb
```

#### `backend/app/routers/resources.py`
```python
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from prisma import Prisma
from app.services.ingestion import ingest_resource
from app.embeddings import EmbeddingModel
import uuid, base64
from datetime import datetime

router = APIRouter(prefix="/resources", tags=["resources"])

@router.post("")
async def ingest_resource_endpoint(
    kb_id: str = Form(...),
    source_type: str = Form(...),   # text | markdown | pdf | url | conversation_history_json
    content: str = Form(None),      # raw text content (for text/markdown/url/json)
    file: UploadFile = File(None),  # for pdf/markdown file uploads
    source_ref: str = Form(""),
    user_id: str = Form(""),
    session_id: str = Form(""),
):
    db = Prisma()
    await db.connect()

    kb = await db.knowledgebase.find_unique(where={"id": kb_id})
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    # Handle file uploads
    if file and not content:
        raw_bytes = await file.read()
        if source_type == "pdf":
            content = base64.b64encode(raw_bytes).decode()
        else:
            content = raw_bytes.decode("utf-8", errors="replace")
        source_ref = source_ref or file.filename

    if not content:
        raise HTTPException(status_code=400, detail="Either content or file must be provided")

    resource_id = str(uuid.uuid4())

    # Create resource record
    resource = await db.resource.create(data={
        "id": resource_id,
        "knowledgeBaseId": kb_id,
        "sourceType": source_type,
        "sourceRef": source_ref,
        "status": "processing",
    })

    try:
        chunks_indexed = ingest_resource(
            collection_name=kb.collectionName,
            source_type=source_type,
            content=content,
            metadata={
                "resource_id": resource_id,
                "kb_id": kb_id,
                "instance_id": kb.instanceId,
                "namespace_id": kb.namespaceId,
                "source_ref": source_ref,
                "user_id": user_id,
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
            },
            embedding_model=EmbeddingModel(kb.embeddingModel),
        )

        await db.resource.update(
            where={"id": resource_id},
            data={"status": "done", "chunksIndexed": chunks_indexed},
        )
        await db.disconnect()
        return {"status": "success", "resource_id": resource_id, "chunks_indexed": chunks_indexed}

    except Exception as e:
        await db.resource.update(where={"id": resource_id}, data={"status": "failed"})
        await db.disconnect()
        raise HTTPException(status_code=500, detail=str(e))
```

#### `backend/app/routers/query.py`
```python
from fastapi import APIRouter, HTTPException
from prisma import Prisma
from app.services.retrieval import search_knowledge_base
from app.services.agent import run_agent
from app.models.schemas import QueryRequest, QueryResponse, SearchRequest
from app.embeddings import EmbeddingModel
import time

router = APIRouter(tags=["query"])

@router.post("/search")
async def semantic_search(body: SearchRequest):
    """Raw similarity search — returns top-K chunks, no LLM call."""
    db = Prisma()
    await db.connect()
    kb = await db.knowledgebase.find_unique(where={"id": body.kb_id})
    await db.disconnect()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    results = search_knowledge_base(
        collection_name=kb.collectionName,
        query=body.query,
        top_k=body.top_k or 5,
        embedding_model=EmbeddingModel(kb.embeddingModel),
    )
    return {"results": results, "kb_id": body.kb_id}

@router.post("/query", response_model=QueryResponse)
async def rag_query(body: QueryRequest):
    """Full RAG query — retrieves context then calls GPT-4o-mini for answer."""
    db = Prisma()
    await db.connect()
    kb = await db.knowledgebase.find_unique(where={"id": body.kb_id})
    await db.disconnect()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    start = time.time()
    result = await run_agent(
        query=body.question,
        collection_name=kb.collectionName,
        embedding_model=EmbeddingModel(kb.embeddingModel),
        top_k=body.top_k or 5,
    )
    elapsed_ms = int((time.time() - start) * 1000)

    # Log query to Postgres for observability
    db2 = Prisma()
    await db2.connect()
    await db2.querylog.create(data={
        "knowledgeBaseId": body.kb_id,
        "query": body.question,
        "chunksRetrieved": len(result.get("sources", [])),
        "responseMs": elapsed_ms,
    })
    await db2.disconnect()

    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "response_ms": elapsed_ms,
    }
```

---

### Step 1.7 — Pydantic Schemas (`backend/app/models/schemas.py`)

```python
from pydantic import BaseModel
from typing import Optional

class CreateInstanceRequest(BaseModel):
    name: str
    description: Optional[str] = None

class InstanceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]

class CreateKBRequest(BaseModel):
    instance_id: str
    name: str
    namespace_id: Optional[str] = "company_docs"
    embedding_model: Optional[str] = "minilm"

class KBResponse(BaseModel):
    id: str
    instanceId: str
    name: str
    namespaceId: str
    collectionName: str
    embeddingModel: str
    embeddingDim: int
    status: str

class QueryRequest(BaseModel):
    kb_id: str
    question: str
    top_k: Optional[int] = 5

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]
    response_ms: int

class SearchRequest(BaseModel):
    kb_id: str
    query: str
    top_k: Optional[int] = 5
```

---

### Step 1.8 — FastAPI Main (`backend/app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import instances, knowledge_bases, resources, query, memory, observability
from app.vectordb import vectordb

app = FastAPI(title="DocuMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(instances.router)
app.include_router(knowledge_bases.router)
app.include_router(resources.router)
app.include_router(query.router)
app.include_router(memory.router)
app.include_router(observability.router)

@app.get("/health")
async def health():
    db_info = vectordb.health_check()
    return {"status": "ok", "vectordb": db_info}
```

---

## PHASE 2 — AI AGENT INTEGRATION

### Step 2.1 — LangChain Agent Service (`backend/app/services/agent.py`)

```python
import asyncio
from langchain.agents import initialize_agent, Tool, AgentType
from langchain_openai import ChatOpenAI
from app.services.retrieval import search_knowledge_base
from app.embeddings import EmbeddingModel
from app.config import settings

async def run_agent(
    query: str,
    collection_name: str,
    embedding_model: EmbeddingModel = EmbeddingModel.MINILM,
    top_k: int = 5,
) -> dict:
    """
    Run the LangChain RAG agent.
    The agent has one tool: search_docs.
    It decides when to call it, retrieves context, and generates an answer.
    """

    # Define the search tool bound to this specific KB
    def search_docs(tool_query: str) -> str:
        results = search_knowledge_base(
            collection_name=collection_name,
            query=tool_query,
            top_k=top_k,
            embedding_model=embedding_model,
        )
        if not results:
            return "No relevant documentation found."
        formatted = []
        for i, r in enumerate(results, 1):
            source = r.get("source_ref", "unknown")
            score = r.get("score", 0)
            text = r.get("text", "")
            formatted.append(f"[{i}] Source: {source} (score: {score:.3f})\n{text}")
        return "\n\n---\n\n".join(formatted)

    tools = [
        Tool(
            name="search_docs",
            func=search_docs,
            description=(
                "Search the internal documentation and knowledge base. "
                "Use this tool whenever you need to answer questions about internal "
                "systems, processes, policies, code, or any company-specific information. "
                "Input: a natural language question or keyword query. "
                "Output: the most relevant documentation excerpts."
            ),
        )
    ]

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=settings.OPENAI_API_KEY,
    )

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=False,
        handle_parsing_errors=True,
        max_iterations=5,
    )

    system_context = (
        "You are an intelligent documentation assistant. "
        "Always use the search_docs tool to look up information before answering. "
        "If the search returns no relevant results, say so honestly. "
        "Always cite the source documents you used."
    )

    full_query = f"{system_context}\n\nUser question: {query}"

    # Run in thread (LangChain sync agent in async FastAPI context)
    response = await asyncio.to_thread(agent.run, full_query)

    # Also get sources for the response metadata
    raw_results = search_knowledge_base(
        collection_name=collection_name,
        query=query,
        top_k=top_k,
        embedding_model=embedding_model,
    )
    sources = [
        {"source_ref": r["source_ref"], "score": r["score"], "chunk_index": r["chunk_index"]}
        for r in raw_results
    ]

    return {"answer": response, "sources": sources}
```

---

### Step 2.2 — Memory Router (`backend/app/routers/memory.py`)

```python
from fastapi import APIRouter, HTTPException
from prisma import Prisma
from app.services.ingestion import ingest_resource
from app.services.retrieval import search_memory
from app.embeddings import EmbeddingModel
from app.vectordb import vectordb, EMBEDDING_DIMS
import uuid
from datetime import datetime

router = APIRouter(prefix="/memory", tags=["memory"])

MEMORY_COLLECTION = "conversation_memory"
MEMORY_DIM = 384

def ensure_memory_collection():
    vectordb.create_collection(MEMORY_COLLECTION, dim=MEMORY_DIM, distance="cosine")

@router.post("/ingest")
async def ingest_memory(body: dict):
    """Ingest conversation history into the memory index."""
    ensure_memory_collection()

    import json
    messages = body.get("messages", [])
    content = json.dumps(messages)

    chunks_indexed = ingest_resource(
        collection_name=MEMORY_COLLECTION,
        source_type="conversation_history_json",
        content=content,
        metadata={
            "resource_id": str(uuid.uuid4()),
            "kb_id": "memory",
            "instance_id": body.get("instance_id", ""),
            "namespace_id": "conversation_memory",
            "source_ref": f"conv_{body.get('conversation_id', '')}",
            "user_id": body.get("user_id", ""),
            "session_id": body.get("session_id", ""),
            "created_at": datetime.utcnow().isoformat(),
        },
        embedding_model=EmbeddingModel.MINILM,
    )
    return {"status": "success", "memories_indexed": chunks_indexed}

@router.post("/query")
async def query_memory(body: dict):
    """Retrieve relevant memories for a user."""
    ensure_memory_collection()
    results = search_memory(
        collection_name=MEMORY_COLLECTION,
        query=body.get("query", ""),
        user_id=body.get("user_id", ""),
        top_k=body.get("top_k", 5),
    )
    return {"memories": results}
```

---

### Step 2.3 — Observability Router (`backend/app/routers/observability.py`)

```python
from fastapi import APIRouter
from prisma import Prisma
from datetime import datetime, timedelta

router = APIRouter(prefix="/observability", tags=["observability"])

@router.get("/scores")
async def get_scores(kb_id: str, window: str = "1h"):
    """Get aggregated quality scores over a time window."""
    db = Prisma()
    await db.connect()

    hours = int(window.replace("h", "").replace("d", "") or 1)
    since = datetime.utcnow() - timedelta(hours=hours)

    logs = await db.querylog.find_many(
        where={"knowledgeBaseId": kb_id, "createdAt": {"gte": since}}
    )
    await db.disconnect()

    if not logs:
        return {"kb_id": kb_id, "window": window, "total_queries": 0}

    avg_retrieval = sum(l.retrievalScore or 0 for l in logs) / len(logs)
    avg_relevance = sum(l.chunkRelevance or 0 for l in logs) / len(logs)
    avg_hallucination = sum(l.hallucinationRate or 0 for l in logs) / len(logs)
    avg_response_ms = sum(l.responseMs or 0 for l in logs) / len(logs)

    return {
        "kb_id": kb_id,
        "window": window,
        "total_queries": len(logs),
        "avg_retrieval_score": round(avg_retrieval, 3),
        "avg_chunk_relevance": round(avg_relevance, 3),
        "avg_hallucination_rate": round(avg_hallucination, 3),
        "avg_response_ms": round(avg_response_ms),
    }
```

---

## PHASE 3 — FRONTEND

### Step 3.1 — Setup

```bash
cd documind
pnpm create vite frontend -- --template react-ts
cd frontend
pnpm install
pnpm add -D tailwindcss postcss autoprefixer
pnpm add axios react-router-dom @radix-ui/react-tabs lucide-react
npx tailwindcss init -p
```

### Step 3.2 — Two Pages to Build

**Page 1: Dashboard (`/dashboard`)**
- List all knowledge bases for an instance
- Button to create new knowledge base (name, namespace, embedding model picker)
- Per-KB: upload resources (drag-and-drop or text paste)
  - Supports: `.md`, `.txt`, `.pdf`, paste raw text, paste URL, paste JSON
  - Shows ingestion status + chunk count per resource
- Sidebar shows observability scores (retrieval avg, hallucination rate)

**Page 2: Chat (`/chat/:kb_id`)**
- Chat-style interface
- User types a question
- Calls `POST /query` with `kb_id` + `question`
- Shows assistant answer in a message bubble
- Below each answer: expandable "Sources" section showing source file + score
- Shows response time in ms per answer

### Step 3.3 — API Client (`frontend/src/lib/api.ts`)

```typescript
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export const createInstance = (name: string, description?: string) =>
  api.post("/instances", { name, description }).then((r) => r.data);

export const listInstances = () =>
  api.get("/instances").then((r) => r.data);

export const createKB = (payload: {
  instance_id: string;
  name: string;
  namespace_id?: string;
  embedding_model?: string;
}) => api.post("/knowledge-bases", payload).then((r) => r.data);

export const getKB = (kb_id: string) =>
  api.get(`/knowledge-bases/${kb_id}`).then((r) => r.data);

export const ingestResource = (formData: FormData) =>
  api.post("/resources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const queryKB = (kb_id: string, question: string, top_k = 5) =>
  api.post("/query", { kb_id, question, top_k }).then((r) => r.data);

export const searchKB = (kb_id: string, query: string, top_k = 5) =>
  api.post("/search", { kb_id, query, top_k }).then((r) => r.data);

export const getScores = (kb_id: string, window = "1h") =>
  api.get(`/observability/scores?kb_id=${kb_id}&window=${window}`).then((r) => r.data);
```

---

## REQUIREMENTS FILE

`backend/requirements.txt`:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
prisma==0.15.0
actian-vectorai
sentence-transformers==3.3.1
openai==1.54.0
langchain==0.3.0
langchain-openai==0.2.0
httpx==0.27.0
beautifulsoup4==4.12.0
pypdf==5.0.0
python-multipart==0.0.12
python-dotenv==1.0.1
ragas==0.2.0
numpy>=1.26.0
```

---

## STARTUP COMMANDS

```bash
# 1. Start Actian VectorAI DB
docker compose up -d

# 2. Start backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
prisma generate
prisma db push
uvicorn app.main:app --reload --port 8000

# 3. Start frontend (separate terminal)
cd frontend
pnpm install
pnpm dev
```

---

## KNOWN ACTIAN SDK CONSTRAINTS (READ BEFORE CODING)

From the official SDK docs — do NOT work around these, design around them:

1. `create_field_index` is currently `UNIMPLEMENTED` on the server. Do NOT attempt to use field indexes for filtering. Use `FilterBuilder` + payload filters on search instead.
2. Sparse vector upserts can fail. Do NOT use sparse vectors. Use dense vectors only.
3. Do NOT close or delete a collection while read/write operations are in progress (CRTX-202).
4. `get_many` does not return vector IDs (CRTX-233). Use `search` for retrieval, not `get_many`.
5. Always use `Distance.Cosine` and normalize your embeddings. This is the recommended default.
6. Use `asyncio.to_thread()` when calling the sync `VectorAIClient` inside async FastAPI routes.
7. The gRPC port is `50051`. If it shows as `UNIMPLEMENTED` in an error, it is a connection issue, not a code issue.

---

## DEMO SCRIPT (for hackathon judges)

When demoing, follow this exact flow:

1. Open Dashboard → Create a new Instance ("Acme Corp")
2. Create a Knowledge Base ("Engineering Docs", namespace: `company_docs`)
3. Upload a Markdown file (e.g., a README or deployment guide)
4. Watch chunk count update in real time
5. Go to Chat → Select the KB
6. Ask: "How do I deploy the payments service?"
7. Show the answer + sources panel
8. Ask a follow-up: "What CI/CD tool do we use?"
9. Show observability panel — retrieval score, response time

This flow proves ingestion → retrieval → generation → observability all working end-to-end.

---

## WHAT DONE LOOKS LIKE

Phase 1 is done when:
- `GET /health` returns `{"status": "ok"}` with vectordb info
- `POST /instances` creates an instance in Postgres
- `POST /knowledge-bases` creates an Actian collection + Postgres record
- `POST /resources` ingests a markdown file and returns `chunks_indexed > 0`
- `POST /search` returns semantically relevant chunks for a query

Phase 2 is done when:
- `POST /query` returns a natural language answer + sources
- The agent correctly calls `search_docs` before answering
- Wrong answers say "I don't know" rather than hallucinate

Phase 3 is done when:
- Dashboard shows KBs and allows file uploads
- Chat page shows answers with sources
- Full demo flow (step 1–9 above) works without errors

---

*DocuMind — Actian Hackathon Build Prompt v1.0*