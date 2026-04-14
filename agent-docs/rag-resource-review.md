# RAG Resource Review (From Organizer List)

Last updated: 2026-04-14

This note summarizes each shared resource in simple terms and maps it to this project (`vector-ai` / `documind`).

## Quick decision table

| Resource | Simple summary | Use now? |
|---|---|---|
| `sentence-transformers/all-MiniLM-L6-v2` | Fast and proven text embedding baseline (384-dim). | Yes. Keep as baseline. |
| `Model2Vec` | Distills sentence-transformer models to very small static embeddings for CPU/edge use. | Yes, for edge/on-device or very low latency. |
| `Qwen3-VL-Embedding-2B` | Multimodal embedding (text/image/video), long context, but heavy model. | Later, only if real multimodal retrieval is needed. |
| `Jina Embeddings v4` | Strong multilingual and multimodal retrieval family, advanced options, heavier setup. | Later, good but more complex than current need. |
| `EmbeddingGemma-300M` | Lightweight embedding model suited for edge and multilingual usage (768-dim). | Yes, worth benchmarking against MiniLM for edge scenarios. |
| `Docling` | Strong document parsing + structure-aware/hybrid chunking for PDFs and docs. | Yes. High-priority ingestion improvement. |
| LlamaIndex semantic chunking example | Practical example of semantic chunking with tunable breakpoints/thresholds. | Yes. Good quick experimentation template. |
| `aurelio-labs/semantic-chunkers` | Multiple semantic chunking approaches; useful where chunk boundaries matter a lot. | Maybe. Evaluate after Docling baseline. |
| `ottomator-agents/all-rag-strategies` | Collection of RAG techniques and patterns (query expansion, rerank, etc.). | Yes as playbook/reference, not direct production code. |

## What is most useful for this repo first

1. Keep current `MiniLM` baseline running.
2. Build a 30-question ground-truth eval set first (as organizer suggested).
3. Integrate better chunking first (`Docling` hybrid/semantic flow).
4. Add reranking and retrieval tuning before swapping models aggressively.
5. Benchmark `Model2Vec` and `EmbeddingGemma-300M` only if edge/on-device is a goal.
6. Defer `Qwen3-VL`/`Jina v4` multimodal work until actual image/video retrieval requirements appear.

## Why this ordering

- Chunking and retrieval strategy usually improves RAG quality faster than changing embedding models immediately.
- You already have a working baseline embedding router in backend code.
- Heavy multimodal models add operational cost/complexity and are best introduced when requirements demand them.

## Source links

- https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- https://github.com/MinishLab/model2vec
- https://huggingface.co/Qwen/Qwen3-VL-Embedding-2B
- https://huggingface.co/jinaai/jina-embeddings-v4
- https://huggingface.co/google/embeddinggemma-300m
- https://github.com/docling-project/docling
- https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/
- https://github.com/aurelio-labs/semantic-chunkers
- https://github.com/coleam00/ottomator-agents/tree/main/all-rag-strategies

