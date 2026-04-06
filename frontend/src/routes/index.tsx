import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from './home/HomePage'
import { KnowledgeListPage } from './knowledge-hub/KnowledgeListPage'
import { PersonaListPage } from './personas/PersonaListPage'
import { AdminDashboard } from './admin/AdminDashboard'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'knowledge-hub', element: <KnowledgeListPage /> },
      { path: 'personas', element: <PersonaListPage /> },
      { path: 'admin/*', element: <AdminDashboard /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
])
