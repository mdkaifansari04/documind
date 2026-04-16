import { get, post, knowledgeBaseApi } from '@/data-access/client'
import { USE_MOCK, localStore } from '@/data-access/local'
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
} from '@/data-access/data-types'

export const getKnowledgeBases = async (instanceId?: string) => {
  if (USE_MOCK) {
    if (!instanceId) {
      return localStore.knowledgeBases
    }
    return localStore.knowledgeBases.filter((kb) => kb.instance_id === instanceId)
  }

  const query = instanceId ? `?instance_id=${instanceId}` : ''
  return get<KnowledgeBase[]>(knowledgeBaseApi, `/knowledge-bases${query}`)
}

export const createKnowledgeBase = async (body: CreateKnowledgeBaseRequest) => {
  if (USE_MOCK) {
    const next: KnowledgeBase = {
      id: crypto.randomUUID(),
      instance_id: body.instance_id,
      namespace_id: body.namespace_id,
      name: body.name,
      collection_name: `kb_${body.instance_id.slice(0, 8)}_${crypto.randomUUID().slice(0, 8)}`,
      embedding_model: body.embedding_model ?? 'minilm',
      embedding_profile: body.embedding_profile ?? 'general_text_search',
      embedding_dim: 384,
      llm_profile: body.llm_profile ?? 'balanced',
      distance_metric: body.distance_metric ?? 'cosine',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStore.knowledgeBases.push(next)
    return next
  }

  return post<KnowledgeBase, CreateKnowledgeBaseRequest>(
    knowledgeBaseApi,
    '/knowledge-bases',
    body
  )
}

