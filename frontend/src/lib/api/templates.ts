import { apiClient } from './client'

export interface TemplateFamily {
  id: string
  name: string
  system_name: string
}

export interface Template {
  template_id: string
  template_code: string
  template_name: string
  description: string | null
  output_format: string | null
  category: string | null
  is_system: boolean
  status: string
  organization_id: string | null
  template_family_id: string | null
  family: TemplateFamily | null
  created_at: string | null
  updated_at: string | null
}

export interface TemplateVersion {
  template_version_id: string
  template_id: string
  version_no: number
  template_body: string | object | null
  change_notes: string | null
  status: string
  created_at: string | null
  created_by: string | null
}

export interface TemplateListFilters {
  family_id?: string
  category?: string
  status?: string
}

export const templatesApi = {
  listFamilies: () =>
    apiClient.get<TemplateFamily[]>('/api/v1/templates/families').then(r => r.data),

  list: (params?: TemplateListFilters) =>
    apiClient.get<Template[]>('/api/v1/templates', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Template>(`/api/v1/templates/${id}`).then(r => r.data),

  listVersions: (templateId: string) =>
    apiClient
      .get<TemplateVersion[]>(`/api/v1/templates/${templateId}/versions`)
      .then(r => r.data),

  getLatestVersion: (templateId: string) =>
    apiClient
      .get<TemplateVersion>(`/api/v1/templates/${templateId}/versions/latest`)
      .then(r => r.data),
}
