import { apiClient } from './client'

export interface Workspace {
  workspace_id: string
  workspace_name: string
  workspace_code: string | null
  entity_title: string | null
  description: string | null
  status: string
  is_template: boolean
  creator_user_id: string | null
  default_persona_id: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export interface WorkspaceMember {
  workspace_member_id: string
  user_id: string | null
  member_role: string
  joined_at: string | null
  status: string
}

export interface WorkspaceSetting {
  workspace_setting_id: string
  setting_key: string
  setting_value: string | null
  value_type: string | null
}

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[]
  settings: WorkspaceSetting[]
  tags: { workspace_tag_id: string; tag_name: string }[]
}

export interface WorkspaceCreateRequest {
  workspace_name: string
  workspace_code?: string
  entity_title?: string
  description?: string
  is_template?: boolean
  metadata_json?: Record<string, unknown>
}

export const workspacesApi = {
  list: () =>
    apiClient.get<Workspace[]>('/api/v1/workspaces').then((r) => r.data),

  get: (id: string) =>
    apiClient
      .get<WorkspaceDetail>(`/api/v1/workspaces/${id}`)
      .then((r) => r.data),

  create: (data: WorkspaceCreateRequest) =>
    apiClient.post<Workspace>('/api/v1/workspaces', data).then((r) => r.data),

  update: (id: string, data: Partial<WorkspaceCreateRequest>) =>
    apiClient.put<Workspace>(`/api/v1/workspaces/${id}`, data).then((r) => r.data),

  addMember: (id: string, user_id: string, member_role: string) =>
    apiClient
      .post<WorkspaceMember>(`/api/v1/workspaces/${id}/members`, {
        user_id,
        member_role,
      })
      .then((r) => r.data),

  removeMember: (id: string, user_id: string) =>
    apiClient.delete(`/api/v1/workspaces/${id}/members/${user_id}`),

  updateSettings: (id: string, settings: { setting_key: string; setting_value: string; value_type?: string }[]) =>
    apiClient
      .put<WorkspaceSetting[]>(`/api/v1/workspaces/${id}/settings`, { settings })
      .then((r) => r.data),
}
