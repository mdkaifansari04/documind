import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as InstanceDataAccess from '@/data-access/instances'
import * as KnowledgeBaseDataAccess from '@/data-access/knowledge-bases'
import * as ResourceDataAccess from '@/data-access/resources'
import * as QueryDataAccess from '@/data-access/query'
import { queryKeys } from '@/hooks/queries'

async function invalidateInstanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.instances() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.collections() }),
  ])
}

async function invalidateKnowledgeBaseData(
  queryClient: ReturnType<typeof useQueryClient>,
  instanceId?: string
) {
  const jobs: Promise<unknown>[] = [
    queryClient.invalidateQueries({
      queryKey: queryKeys.knowledgeBasesRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.collections(),
    }),
  ]
  if (instanceId) {
    jobs.push(
      queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgeBases(instanceId),
      })
    )
  }
  await Promise.all(jobs)
}

async function invalidateResourceData(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.resourcesRoot() })
}

export const useCreateInstance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: InstanceDataAccess.createInstance,
    onSuccess: async () => {
      await invalidateInstanceData(queryClient)
    },
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: KnowledgeBaseDataAccess.createKnowledgeBase,
    onSuccess: async (data) => {
      await invalidateKnowledgeBaseData(queryClient, data.instance_id)
    },
  })
}

export const useIngestResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ResourceDataAccess.ingestResource,
    onSuccess: async () => {
      await invalidateResourceData(queryClient)
    },
  })
}

export const useUploadResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ResourceDataAccess.uploadResource,
    onSuccess: async () => {
      await invalidateResourceData(queryClient)
    },
  })
}

export const useCrawlPreview = () =>
  useMutation({
    mutationFn: ResourceDataAccess.crawlPreview,
  })

export const useCrawlIngest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ResourceDataAccess.crawlIngest,
    onSuccess: async () => {
      await invalidateResourceData(queryClient)
    },
  })
}

export const useSearchInstanceMutation = () =>
  useMutation({
    mutationFn: QueryDataAccess.searchInstance,
  })

export const useSearchAdvancedMutation = () =>
  useMutation({
    mutationFn: QueryDataAccess.searchAdvanced,
  })

export const useQueryInstanceMutation = () =>
  useMutation({
    mutationFn: QueryDataAccess.queryInstance,
  })

export const useQueryAdvancedMutation = () =>
  useMutation({
    mutationFn: QueryDataAccess.queryAdvanced,
  })
