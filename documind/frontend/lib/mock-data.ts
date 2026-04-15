import type { Instance, KnowledgeBase, Resource, HealthResponse, CollectionsResponse } from './types'

export const mockInstances: Instance[] = [
  {
    id: "c1111111-1111-4111-8111-111111111111",
    name: "Demo Test App",
    description: "Main sandbox for frontend + agent testing",
    created_at: "2026-04-16T10:00:00.000000",
    updated_at: "2026-04-16T10:00:00.000000"
  },
  {
    id: "c2222222-2222-4222-8222-222222222222",
    name: "Civillet Docs",
    description: "Civillet framework documentation",
    created_at: "2026-04-16T10:05:00.000000",
    updated_at: "2026-04-16T10:05:00.000000"
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    name: "Svelte Docs",
    description: "Svelte guides and API references",
    created_at: "2026-04-16T10:10:00.000000",
    updated_at: "2026-04-16T10:10:00.000000"
  }
]

export const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: "k1111111-1111-4111-8111-111111111111",
    instance_id: "c1111111-1111-4111-8111-111111111111",
    name: "Product Docs KB",
    namespace_id: "product_docs",
    collection_name: "kb_c1111111_k1111111",
    embedding_model: "minilm",
    embedding_profile: "general_text_search",
    embedding_dim: 384,
    llm_profile: "balanced",
    distance_metric: "cosine",
    status: "active",
    created_at: "2026-04-16T10:20:00.000000",
    updated_at: "2026-04-16T10:20:00.000000"
  },
  {
    id: "k2222222-2222-4222-8222-222222222222",
    instance_id: "c2222222-2222-4222-8222-222222222222",
    name: "Civillet Core KB",
    namespace_id: "civillet_core",
    collection_name: "kb_c2222222_k2222222",
    embedding_model: "minilm",
    embedding_profile: "general_text_search",
    embedding_dim: 384,
    llm_profile: "balanced",
    distance_metric: "cosine",
    status: "active",
    created_at: "2026-04-16T10:25:00.000000",
    updated_at: "2026-04-16T10:25:00.000000"
  },
  {
    id: "k3333333-3333-4333-8333-333333333333",
    instance_id: "c3333333-3333-4333-8333-333333333333",
    name: "Svelte Runes KB",
    namespace_id: "svelte_runes",
    collection_name: "kb_c3333333_k3333333",
    embedding_model: "minilm",
    embedding_profile: "general_text_search",
    embedding_dim: 384,
    llm_profile: "balanced",
    distance_metric: "cosine",
    status: "active",
    created_at: "2026-04-16T10:30:00.000000",
    updated_at: "2026-04-16T10:30:00.000000"
  }
]

export const mockResources: Resource[] = [
  {
    id: "r1111111-1111-4111-8111-111111111111",
    knowledge_base_id: "k1111111-1111-4111-8111-111111111111",
    source_type: "markdown",
    source_ref: "getting-started.md",
    chunks_indexed: 14,
    status: "done",
    created_at: "2026-04-16T10:35:00.000000",
    updated_at: "2026-04-16T10:35:10.000000"
  },
  {
    id: "r2222222-2222-4222-8222-222222222222",
    knowledge_base_id: "k2222222-2222-4222-8222-222222222222",
    source_type: "text",
    source_ref: "routing-notes.txt",
    chunks_indexed: 8,
    status: "done",
    created_at: "2026-04-16T10:36:00.000000",
    updated_at: "2026-04-16T10:36:05.000000"
  },
  {
    id: "r3333333-3333-4333-8333-333333333333",
    knowledge_base_id: "k3333333-3333-4333-8333-333333333333",
    source_type: "pdf",
    source_ref: "svelte-runes-guide.pdf",
    chunks_indexed: 96,
    status: "done",
    created_at: "2026-04-16T10:37:00.000000",
    updated_at: "2026-04-16T10:37:30.000000"
  }
]

export const mockHealth: HealthResponse = {
  status: "ok",
  vectordb: {
    title: "Actian Vector",
    version: "Mock 1.0.0"
  }
}

export const mockCollections: CollectionsResponse = {
  collections: [
    "kb_c1111111_k1111111",
    "kb_c2222222_k2222222",
    "kb_c3333333_k3333333"
  ],
  knowledge_bases: mockKnowledgeBases
}
