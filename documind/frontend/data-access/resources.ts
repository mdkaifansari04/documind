import type { AxiosRequestConfig } from 'axios'
import { get, post, resourceApi } from '@/data-access/client'
import { USE_MOCK, localStore } from '@/data-access/local'
import type {
  IngestResourceRequest,
  IngestResponse,
  Resource,
  ResourceQueryParams,
} from '@/data-access/data-types'

export const getResources = async (params: ResourceQueryParams) => {
  if (USE_MOCK) {
    let filtered = [...localStore.resources]

    if (params.kb_id) {
      filtered = filtered.filter((r) => r.knowledge_base_id === params.kb_id)
    }

    if (params.instance_id) {
      const kbIds = localStore.knowledgeBases
        .filter((kb) => kb.instance_id === params.instance_id)
        .map((kb) => kb.id)
      filtered = filtered.filter((r) => kbIds.includes(r.knowledge_base_id))
    }

    if (params.namespace_id) {
      const kbIds = localStore.knowledgeBases
        .filter((kb) => kb.namespace_id === params.namespace_id)
        .map((kb) => kb.id)
      filtered = filtered.filter((r) => kbIds.includes(r.knowledge_base_id))
    }

    return filtered
  }

  const searchParams = new URLSearchParams()
  if (params.instance_id) searchParams.set('instance_id', params.instance_id)
  if (params.namespace_id) searchParams.set('namespace_id', params.namespace_id)
  if (params.kb_id) searchParams.set('kb_id', params.kb_id)
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

  return get<Resource[]>(resourceApi, `/resources${query}`)
}

export const ingestResource = async (body: IngestResourceRequest) => {
  if (USE_MOCK) {
    const next: Resource = {
      id: crypto.randomUUID(),
      knowledge_base_id: body.kb_id ?? '',
      source_type: body.source_type,
      source_ref: body.source_ref || 'inline-content',
      chunks_indexed: Math.floor(Math.random() * 20) + 5,
      status: 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStore.resources.push(next)
    return {
      status: 'success',
      kb_id: body.kb_id,
      resource_id: next.id,
      chunks_indexed: next.chunks_indexed,
    } as IngestResponse
  }

  return post<IngestResponse, IngestResourceRequest>(resourceApi, '/resources', body)
}

export const uploadResource = async (formData: FormData) => {
  if (USE_MOCK) {
    const file = formData.get('file') as File | null
    const kbId = (formData.get('kb_id') as string | null) ?? ''
    const next: Resource = {
      id: crypto.randomUUID(),
      knowledge_base_id: kbId,
      source_type: file?.name?.endsWith('.pdf') ? 'pdf' : 'text',
      source_ref: file?.name || 'uploaded-file',
      chunks_indexed: Math.floor(Math.random() * 50) + 10,
      status: 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStore.resources.push(next)
    return {
      status: 'success',
      kb_id: kbId,
      resource_id: next.id,
      chunks_indexed: next.chunks_indexed,
    } as IngestResponse
  }

  const config: AxiosRequestConfig<FormData> = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }

  return post<IngestResponse, FormData>(resourceApi, '/resources', formData, config)
}

