import apiClient from './client'
import type { AuthUser } from '../store/auth.store'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login/', data),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient.post('/auth/change-password/', data),
}
