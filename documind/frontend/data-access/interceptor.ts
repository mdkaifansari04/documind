import type { InternalAxiosRequestConfig } from 'axios'

const ACCESS_TOKEN_KEY = 'documind.accessToken'

export function tokenInterceptor(config: InternalAxiosRequestConfig) {
  if (typeof window === 'undefined') {
    return config
  }

  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) {
    return config
  }

  if (!config.headers) {
    return config
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
}

