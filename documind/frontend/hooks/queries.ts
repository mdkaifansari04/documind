import { useQuery } from '@tanstack/react-query'
import * as InstanceDataAccess from '@/data-access/instances'
import * as KnowledgeBaseDataAccess from '@/data-access/knowledge-bases'
import * as ResourceDataAccess from '@/data-access/resources'
import * as SystemDataAccess from '@/data-access/system'
import type { ResourceQueryParams } from '@/data-access/data-types'

export const queryKeys = {
  instances: () => ['instances'] as const,
  knowledgeBasesRoot: () => ['knowledge-bases'] as const,
  knowledgeBases: (instanceId?: string) =>
    ['knowledge-bases', instanceId ?? 'all'] as const,
  resourcesRoot: () => ['resources'] as const,
  resources: (params: ResourceQueryParams) => ['resources', params] as const,
  health: () => ['health'] as const,
  collections: () => ['collections'] as const,
}

const realtimeQueryOptions = {
  refetchOnWindowFocus: false,
} as const

export const useInstances = () =>
  useQuery({
    queryKey: queryKeys.instances(),
    queryFn: InstanceDataAccess.getInstances,
    ...realtimeQueryOptions,
  })

export const useKnowledgeBases = (instanceId?: string) =>
  useQuery({
    queryKey: queryKeys.knowledgeBases(instanceId),
    queryFn: () => KnowledgeBaseDataAccess.getKnowledgeBases(instanceId),
    ...realtimeQueryOptions,
  })

export const useResources = (params: ResourceQueryParams, enabled = true) =>
  useQuery({
    queryKey: queryKeys.resources(params),
    queryFn: () => ResourceDataAccess.getResources(params),
    enabled,
    ...realtimeQueryOptions,
  })

export const useHealth = () =>
  useQuery({
    queryKey: queryKeys.health(),
    queryFn: SystemDataAccess.getHealth,
    refetchInterval: 30_000,
    ...realtimeQueryOptions,
  })

export const useCollections = () =>
  useQuery({
    queryKey: queryKeys.collections(),
    queryFn: SystemDataAccess.getCollections,
    ...realtimeQueryOptions,
  })
