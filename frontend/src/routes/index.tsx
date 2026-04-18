import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from './RequireAuth'
import { HomePage } from './home/HomePage'
import { KnowledgeListPage } from './knowledge-hub/KnowledgeListPage'
import { PersonaListPage } from './personas/PersonaListPage'
import { PersonaWizardPage } from './personas/PersonaWizardPage'
import { AdminDashboard } from './admin/AdminDashboard'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'

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
      { path: 'personas/new', element: <PersonaWizardPage /> },
      { path: 'personas/:id/view', element: <PersonaWizardPage /> },
      { path: 'personas/:id/edit', element: <PersonaWizardPage /> },
      { path: 'admin/*', element: <AdminDashboard /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
])