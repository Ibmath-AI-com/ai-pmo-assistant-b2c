import { apiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_id: string
}

export interface UserProfile {
  user_id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  status: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register', data).then((r) => r.data),

  logout: () =>
    apiClient.post('/api/v1/auth/logout').then((r) => r.data),

  me: () =>
    apiClient.get<UserProfile>('/api/v1/users/me').then((r) => r.data),
}
