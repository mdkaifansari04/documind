import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { tokenInterceptor } from '@/data-access/interceptor'
import type { ApiError, ApiResponse } from '@/data-access/data-types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

function createServiceClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL })
  client.interceptors.request.use(tokenInterceptor)
  return client
}

export const instanceApi = createServiceClient(API_BASE_URL)
export const knowledgeBaseApi = createServiceClient(API_BASE_URL)
export const resourceApi = createServiceClient(API_BASE_URL)
export const queryApi = createServiceClient(API_BASE_URL)
export const systemApi = createServiceClient(API_BASE_URL)

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.status === 'number' && 'body' in candidate
}

export class ApiClientError extends Error implements ApiError {
  status: number
  details?: Record<string, unknown>
  code?: string

  constructor(params: {
    status: number
    message: string
    details?: Record<string, unknown>
    code?: string
  }) {
    super(params.message)
    this.name = 'ApiClientError'
    this.status = params.status
    this.details = params.details
    this.code = params.code
  }
}

function toApiClientError(error: unknown): ApiClientError {
  const axiosError = error as AxiosError<Record<string, unknown>>
  const responseData = axiosError.response?.data
  const detail =
    typeof responseData?.detail === 'string'
      ? responseData.detail
      : undefined
  const message =
    (typeof responseData?.message === 'string' && responseData.message) ||
    detail ||
    axiosError.message ||
    'Request failed'
  const status = axiosError.response?.status ?? 500
  const code =
    typeof responseData?.code === 'string' ? responseData.code : undefined

  return new ApiClientError({
    status,
    message,
    details: responseData,
    code,
  })
}

function unwrapData<T>(payload: T | ApiResponse<T>): T {
  if (isApiResponse<T>(payload)) {
    return payload.body
  }
  return payload
}

async function request<T>(
  action: () => Promise<{ data: T | ApiResponse<T> }>
): Promise<T> {
  try {
    const { data } = await action()
    return unwrapData<T>(data)
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw toApiClientError(error)
    }
    throw new ApiClientError({
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown request error',
    })
  }
}

export function get<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
) {
  return request<T>(() => client.get<T | ApiResponse<T>>(url, config))
}

export function post<T, TBody = unknown>(
  client: AxiosInstance,
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
) {
  return request<T>(() => client.post<T | ApiResponse<T>>(url, body, config))
}

export function put<T, TBody = unknown>(
  client: AxiosInstance,
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
) {
  return request<T>(() => client.put<T | ApiResponse<T>>(url, body, config))
}

export function patch<T, TBody = unknown>(
  client: AxiosInstance,
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig
) {
  return request<T>(() => client.patch<T | ApiResponse<T>>(url, body, config))
}

export function del<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
) {
  return request<T>(() => client.delete<T | ApiResponse<T>>(url, config))
}

