import {
  mockCollections,
  mockHealth,
  mockInstances,
  mockKnowledgeBases,
  mockResources,
} from '@/lib/mock-data'

export const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL

export const localStore = {
  instances: mockInstances,
  knowledgeBases: mockKnowledgeBases,
  resources: mockResources,
  collections: mockCollections,
  health: mockHealth,
}

