import * as InstanceDataAccess from '@/data-access/instances'
import * as KnowledgeBaseDataAccess from '@/data-access/knowledge-bases'
import * as ResourceDataAccess from '@/data-access/resources'
import * as QueryDataAccess from '@/data-access/query'
import * as SystemDataAccess from '@/data-access/system'
import { post, queryApi } from '@/data-access/client'
import type {
  AdvancedQueryRequest,
  AdvancedSearchRequest,
  CrawlIngestRequest,
  CrawlIngestResponse,
  CrawlPreviewRequest,
  CrawlPreviewResponse,
  CollectionsResponse,
  CreateInstanceRequest,
  CreateKnowledgeBaseRequest,
  HealthResponse,
  IngestResourceRequest,
  IngestResponse,
  Instance,
  KnowledgeBase,
  QueryInstanceRequest,
  QueryInstanceResponse,
  Resource,
  ResourceQueryParams,
  SearchInstanceRequest,
  SearchInstanceResponse,
} from '@/lib/types'

class LegacyApiCompatibilityClient {
  async getHealth(): Promise<HealthResponse> {
    return SystemDataAccess.getHealth()
  }

  async getInstances(): Promise<Instance[]> {
    return InstanceDataAccess.getInstances()
  }

  async createInstance(body: CreateInstanceRequest): Promise<Instance> {
    return InstanceDataAccess.createInstance(body)
  }

  async getKnowledgeBases(instanceId?: string): Promise<KnowledgeBase[]> {
    return KnowledgeBaseDataAccess.getKnowledgeBases(instanceId)
  }

  async createKnowledgeBase(
    body: CreateKnowledgeBaseRequest
  ): Promise<KnowledgeBase> {
    return KnowledgeBaseDataAccess.createKnowledgeBase(body)
  }

  async getResources(params: ResourceQueryParams): Promise<Resource[]> {
    return ResourceDataAccess.getResources(params)
  }

  async ingestResource(body: IngestResourceRequest): Promise<IngestResponse> {
    return ResourceDataAccess.ingestResource(body)
  }

  async uploadResource(formData: FormData): Promise<IngestResponse> {
    return ResourceDataAccess.uploadResource(formData)
  }

  async crawlPreview(body: CrawlPreviewRequest): Promise<CrawlPreviewResponse> {
    return ResourceDataAccess.crawlPreview(body)
  }

  async crawlIngest(body: CrawlIngestRequest): Promise<CrawlIngestResponse> {
    return ResourceDataAccess.crawlIngest(body)
  }

  async searchInstance(
    body: SearchInstanceRequest
  ): Promise<SearchInstanceResponse> {
    return QueryDataAccess.searchInstance(body)
  }

  async searchAdvanced(
    body: AdvancedSearchRequest
  ): Promise<SearchInstanceResponse> {
    return QueryDataAccess.searchAdvanced(body)
  }

  async searchLegacy(body: {
    kb_id: string
    query: string
    top_k?: number
  }): Promise<SearchInstanceResponse> {
    return post<SearchInstanceResponse, typeof body>(queryApi, '/search', body)
  }

  async queryInstance(
    body: QueryInstanceRequest
  ): Promise<QueryInstanceResponse> {
    return QueryDataAccess.queryInstance(body)
  }

  async queryAdvanced(
    body: AdvancedQueryRequest
  ): Promise<QueryInstanceResponse> {
    return QueryDataAccess.queryAdvanced(body)
  }

  async queryLegacy(body: {
    kb_id: string
    question: string
    top_k?: number
  }): Promise<QueryInstanceResponse> {
    return post<QueryInstanceResponse, typeof body>(queryApi, '/query', body)
  }

  async getCollections(): Promise<CollectionsResponse> {
    return SystemDataAccess.getCollections()
  }
}

export const api = new LegacyApiCompatibilityClient()
export default api
