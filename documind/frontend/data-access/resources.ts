import type { AxiosRequestConfig } from 'axios'
import { get, post, resourceApi } from '@/data-access/client'
import { USE_MOCK, localStore } from '@/data-access/local'
import type {
  CrawlIngestRequest,
  CrawlIngestResponse,
  CrawlPreviewRequest,
  CrawlPreviewResponse,
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
    const kbId =
      body.kb_id ??
      localStore.knowledgeBases.find(
        (kb) =>
          kb.instance_id === body.instance_id &&
          kb.namespace_id === (body.namespace_id ?? 'company_docs')
      )?.id ??
      ''
    const next: Resource = {
      id: crypto.randomUUID(),
      knowledge_base_id: kbId,
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
      kb_id: kbId,
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

export const crawlPreview = async (body: CrawlPreviewRequest) => {
  if (USE_MOCK) {
    const seedUrls = [body.url, ...(body.seed_urls ?? [])]
    const root = seedUrls[0] || body.url
    const count = body.crawl_subpages ? Math.min(body.max_pages ?? 20, 6) : 1
    const rawLinks = seedUrls.flatMap((seed) =>
      Array.from({ length: count }).map((_, index) =>
        index === 0 ? seed : `${seed.replace(/\/$/, '')}/page-${index + 1}`
      )
    )
    const links = Array.from(new Set(rawLinks)).slice(0, body.max_pages ?? 20)
    const link_items = links.map((url, index) => ({
      url,
      score: Math.max(55, 100 - index * 8),
      reasons: ['same_domain', 'within_scope'],
    }))

    return {
      status: 'success',
      kb_id: body.kb_id ?? '',
      instance_id: body.instance_id ?? '',
      namespace_id: body.namespace_id ?? 'company_docs',
      root_url: root,
      crawl_subpages: !!body.crawl_subpages,
      scope_mode: body.scope_mode ?? 'strict_docs',
      scope_path: body.scope_path ?? '/docs',
      seed_urls: seedUrls,
      count: links.length,
      links,
      link_items,
    } as CrawlPreviewResponse
  }

  return post<CrawlPreviewResponse, CrawlPreviewRequest>(
    resourceApi,
    '/resources/crawl/preview',
    body
  )
}

export const crawlIngest = async (body: CrawlIngestRequest) => {
  if (USE_MOCK) {
    const links = body.urls?.length ? body.urls : [body.url]
    const existingSourceRefs = new Set(
      localStore.resources
        .filter((resource) =>
          body.kb_id ? resource.knowledge_base_id === body.kb_id : true
        )
        .map((resource) => resource.source_ref)
    )
    const results = links.map((url) => {
      if (body.skip_existing && existingSourceRefs.has(url)) {
        return {
          url,
          status: 'skipped' as const,
          reason: 'already_ingested',
        }
      }
      const next: Resource = {
        id: crypto.randomUUID(),
        knowledge_base_id: body.kb_id ?? '',
        source_type: 'url',
        source_ref: url,
        chunks_indexed: Math.floor(Math.random() * 20) + 5,
        status: 'done',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      localStore.resources.push(next)
      return {
        url,
        status: 'success' as const,
        resource_id: next.id,
        chunks_indexed: next.chunks_indexed,
      }
    })
    const successCount = results.filter((item) => item.status === 'success').length
    const skippedCount = results.filter((item) => item.status === 'skipped').length

    return {
      status: 'success',
      kb_id: body.kb_id ?? '',
      instance_id: body.instance_id ?? '',
      namespace_id: body.namespace_id ?? 'company_docs',
      total_links: links.length,
      success_count: successCount,
      failed_count: 0,
      skipped_count: skippedCount,
      total_chunks_indexed: results.reduce((sum, item) => sum + (item.chunks_indexed ?? 0), 0),
      results,
    } as CrawlIngestResponse
  }

  return post<CrawlIngestResponse, CrawlIngestRequest>(
    resourceApi,
    '/resources/crawl/ingest',
    body
  )
}
