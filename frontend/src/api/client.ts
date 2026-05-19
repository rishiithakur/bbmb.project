import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '../store/auth.store'

const getBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL
  if (viteApiUrl !== undefined && viteApiUrl !== '') {
    return viteApiUrl.endsWith('/') ? viteApiUrl.slice(0, -1) : viteApiUrl
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl !== undefined) {
    return envUrl === '' ? '/api/v1' : envUrl
  }
  return '/api/v1'
}

const BASE_URL = getBaseUrl()

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST INTERCEPTOR — attach JWT access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// RESPONSE INTERCEPTOR — handle 401, auto-refresh token
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

// Add automatic retry logic for failed DB/API connections or network timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Only retry if it is a network error, timeout, or server 502/503/504 error
    const isNetworkError = !error.response;
    const isServerUnavailable = error.response?.status >= 502 && error.response?.status <= 504;
    const isTimeout = error.code === 'ECONNABORTED';

    if ((isNetworkError || isServerUnavailable || isTimeout) && (!originalRequest._retryCount || originalRequest._retryCount < MAX_RETRIES)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      console.warn(`[API CLIENT] Connection warning: ${error.message}. Retrying ${originalRequest.url} (Attempt ${originalRequest._retryCount}/${MAX_RETRIES})...`);
      
      // Delay with backoff
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * originalRequest._retryCount));
      return apiClient(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        const newAccess: string = res.data.access
        useAuthStore.getState().setAccessToken(newAccess)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
