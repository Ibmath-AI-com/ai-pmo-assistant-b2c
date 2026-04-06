import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginRequest, type RegisterRequest } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const login = async (data: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(data)
      setTokens(res.access_token, res.refresh_token)
      const user = await authApi.me()
      setUser(user)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Invalid email or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const register = async (data: RegisterRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register(data)
      setTokens(res.access_token, res.refresh_token)
      const user = await authApi.me()
      setUser(user)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Registration failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { register, loading, error }
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout errors
    } finally {
      logout()
      navigate('/login')
    }
  }
}
