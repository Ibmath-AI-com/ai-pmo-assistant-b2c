import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from './RequireAuth'
import { HomePage } from './home/HomePage'
import { KnowledgeListPage } from './knowledge-hub/KnowledgeListPage'
import { AddDocumentWizard } from './knowledge-hub/AddDocumentWizard'
import { PersonaListPage } from './personas/PersonaListPage'
import { PersonaWizardPage } from './personas/PersonaWizardPage'
import { ProjectPage } from './projects/ProjectPage'
import { AdminDashboard } from './admin/AdminDashboard'
import { ProfilePage } from './profile/ProfilePage'
import { TemplatesPage } from './templates/TemplatesPage'
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
      { path: 'knowledge-hub/new', element: <AddDocumentWizard /> },
      { path: 'knowledge-hub/:id/edit', element: <AddDocumentWizard /> },
      { path: 'personas', element: <PersonaListPage /> },
      { path: 'personas/new', element: <PersonaWizardPage /> },
      { path: 'personas/:id/view', element: <PersonaWizardPage /> },
      { path: 'personas/:id/edit', element: <PersonaWizardPage /> },
      { path: 'projects/new', element: <ProjectPage /> },
      { path: 'projects/:id/edit', element: <ProjectPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'admin/*', element: <AdminDashboard /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
])
