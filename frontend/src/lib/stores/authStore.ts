import { create } from 'zustand'
import type { UserProfile } from '../api/auth'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: UserProfile) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    set({ isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },
}))
