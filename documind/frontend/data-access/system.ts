import { get, systemApi } from '@/data-access/client'
import { USE_MOCK, localStore } from '@/data-access/local'
import type { CollectionsResponse, HealthResponse } from '@/data-access/data-types'

export const getHealth = async () => {
  if (USE_MOCK) {
    return localStore.health as HealthResponse
  }
  return get<HealthResponse>(systemApi, '/health')
}

export const getCollections = async () => {
  if (USE_MOCK) {
    return localStore.collections as CollectionsResponse
  }
  return get<CollectionsResponse>(systemApi, '/collections')
}

