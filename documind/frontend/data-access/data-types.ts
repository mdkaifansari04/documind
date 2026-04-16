// Shared API and domain types for data-access + hooks layers.

export type ApiResponse<T = unknown> = {
  status: number
  body: T
}

export interface ApiError {
  status: number
  message: string
  details?: Record<string, unknown>
  code?: string
}

export interface Instance {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface KnowledgeBase {
  id: string
  instance_id: string
  name: string
  namespace_id: string
  collection_name: string
  embedding_model: string
  embedding_dim: number
  distance_metric: string
  status: 'active' | 'inactive' | 'processing'
  created_at: string
  updated_at: string
  embedding_profile?: string
  llm_profile?: string
}

export interface Resource {
  id: string
  knowledge_base_id: string
  source_type: 'text' | 'markdown' | 'pdf' | 'html' | 'docx' | 'url'
  source_ref: string
  chunks_indexed: number
  status: 'processing' | 'done' | 'failed'
  created_at: string
  updated_at: string
}

export interface SearchResult {
  id: number | string
  text: string
  score: number
  source_ref: string
  chunk_index: number
  resource_id: string
  namespace_id: string
}

export interface SearchInstanceResponse {
  kb_id?: string
  instance_id?: string
  namespace_id?: string
  results: SearchResult[]
}

export interface QueryInstanceResponse {
  kb_id?: string
  instance_id?: string
  namespace_id?: string
  answer: string
  sources: SearchResult[]
  response_ms: number
  llm_profile: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  vectordb: {
    title: string
    version: string
  }
}

export interface CollectionsResponse {
  collections: string[]
  knowledge_bases: KnowledgeBase[]
}

export interface IngestResponse {
  status: 'success' | 'error'
  kb_id?: string
  resource_id: string
  chunks_indexed: number
}

export interface CreateInstanceRequest {
  name: string
  description?: string
}

export interface CreateKnowledgeBaseRequest {
  instance_id: string
  namespace_id: string
  name: string
  embedding_profile?: string
  embedding_model?: string
  llm_profile?: string
  distance_metric?: 'cosine' | 'euclidean' | 'dot'
}

export interface IngestResourceRequest {
  instance_id?: string
  namespace_id?: string
  kb_id?: string
  source_type: 'text' | 'markdown' | 'pdf' | 'html' | 'docx' | 'url'
  content: string
  source_ref?: string
  user_id?: string
  session_id?: string
}

export interface CrawlPreviewRequest {
  kb_id?: string
  instance_id?: string
  namespace_id?: string
  url: string
  crawl_subpages?: boolean
  max_pages?: number
  scope_mode?: 'strict_docs' | 'same_domain'
  scope_path?: string
  seed_urls?: string[]
}

export interface CrawlPreviewLinkItem {
  url: string
  score: number
  reasons: string[]
}

export interface CrawlPreviewResponse {
  status: 'success' | 'error'
  kb_id: string
  instance_id: string
  namespace_id: string
  root_url: string
  crawl_subpages: boolean
  scope_mode: 'strict_docs' | 'same_domain'
  scope_path: string
  count: number
  links: string[]
  link_items?: CrawlPreviewLinkItem[]
}

export interface CrawlIngestRequest extends CrawlPreviewRequest {
  urls?: string[]
  skip_existing?: boolean
}

export interface CrawlIngestResultItem {
  url: string
  status: 'success' | 'failed' | 'skipped'
  resource_id?: string
  chunks_indexed?: number
  error?: string
  reason?: string
}

export interface CrawlIngestResponse {
  status: 'success' | 'error'
  kb_id: string
  instance_id: string
  namespace_id: string
  total_links: number
  success_count: number
  failed_count: number
  skipped_count?: number
  total_chunks_indexed: number
  results: CrawlIngestResultItem[]
}

export interface SearchInstanceRequest {
  instance_id: string
  namespace_id: string
  query: string
  top_k?: number
}

export interface QueryInstanceRequest {
  instance_id: string
  namespace_id: string
  question: string
  top_k?: number
}

export interface FilterClause {
  field: string
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'any_of' | 'contains'
  value: string | number | boolean | string[]
}

export interface AdvancedFilters {
  must?: FilterClause[]
  must_not?: FilterClause[]
}

export interface HybridConfig {
  method: 'rrf' | 'dbsf'
  dense_weight?: number
  keyword_weight?: number
}

export interface AdvancedSearchRequest {
  instance_id: string
  namespace_id: string
  query: string
  mode?: 'semantic' | 'hybrid'
  hybrid?: HybridConfig
  filters?: AdvancedFilters
  top_k?: number
}

export interface AdvancedQueryRequest {
  instance_id: string
  namespace_id: string
  question: string
  mode?: 'semantic' | 'hybrid'
  hybrid?: HybridConfig
  filters?: AdvancedFilters
  top_k?: number
}

export interface AppContext {
  activeInstanceId: string | null
  activeInstanceName: string | null
  activeNamespaceId: string | null
  activeKbId: string | null
  lastUpdatedAt: string | null
}

export type ScopeMode = 'single_scope' | 'multi_scope'

export interface ChatScope {
  mode: ScopeMode
  instanceId: string | null
  namespaceIds: string[]
  kbIds: string[]
  useAdvanced: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  scopeSnapshot: ChatScope
  responseMs?: number
  llmProfile?: string
  sources?: SearchResult[]
}

export type ResourceQueryParams = {
  instance_id?: string
  namespace_id?: string
  kb_id?: string
}
