import { get, post, instanceApi } from '@/data-access/client'
import { USE_MOCK, localStore } from '@/data-access/local'
import type { CreateInstanceRequest, Instance } from '@/data-access/data-types'

export const getInstances = async () => {
  if (USE_MOCK) {
    return localStore.instances
  }
  return get<Instance[]>(instanceApi, '/instances')
}

export const createInstance = async (body: CreateInstanceRequest) => {
  if (USE_MOCK) {
    const next: Instance = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStore.instances.push(next)
    return next
  }

  return post<Instance, CreateInstanceRequest>(instanceApi, '/instances', body)
}

