import { post, queryApi } from '@/data-access/client'
import { USE_MOCK } from '@/data-access/local'
import type {
  AdvancedQueryRequest,
  AdvancedSearchRequest,
  QueryInstanceRequest,
  QueryInstanceResponse,
  SearchInstanceRequest,
  SearchInstanceResponse,
} from '@/data-access/data-types'

function getMockSearchResults(query: string): SearchInstanceResponse {
  return {
    results: [
      {
        id: 'chunk-1',
        text: `This is a relevant chunk about "${query}" from your indexed knowledge base.`,
        score: 0.92,
        source_ref: 'getting-started.md',
        chunk_index: 0,
        resource_id: 'resource-1',
        namespace_id: 'product_docs',
      },
      {
        id: 'chunk-2',
        text: `Another matching result for "${query}" from a different resource.`,
        score: 0.87,
        source_ref: 'routing-notes.txt',
        chunk_index: 4,
        resource_id: 'resource-2',
        namespace_id: 'engineering',
      },
    ],
  }
}

function getMockQueryResponse(question: string): QueryInstanceResponse {
  return {
    answer: `Mock answer for "${question}" based on indexed resources.`,
    sources: getMockSearchResults(question).results,
    response_ms: 186,
    llm_profile: 'balanced',
  }
}

export const searchInstance = async (body: SearchInstanceRequest) => {
  if (USE_MOCK) {
    return getMockSearchResults(body.query)
  }
  return post<SearchInstanceResponse, SearchInstanceRequest>(
    queryApi,
    '/search/instance',
    body
  )
}

export const searchAdvanced = async (body: AdvancedSearchRequest) => {
  if (USE_MOCK) {
    return getMockSearchResults(body.query)
  }
  return post<SearchInstanceResponse, AdvancedSearchRequest>(
    queryApi,
    '/search/advanced',
    body
  )
}

export const queryInstance = async (body: QueryInstanceRequest) => {
  if (USE_MOCK) {
    return getMockQueryResponse(body.question)
  }
  return post<QueryInstanceResponse, QueryInstanceRequest>(
    queryApi,
    '/query/instance',
    body
  )
}

export const queryAdvanced = async (body: AdvancedQueryRequest) => {
  if (USE_MOCK) {
    return getMockQueryResponse(body.question)
  }
  return post<QueryInstanceResponse, AdvancedQueryRequest>(
    queryApi,
    '/query/advanced',
    body
  )
}

