import { apiClient } from './client'

export interface Persona {
  persona_id: string
  persona_code: string
  persona_name: string
  persona_category: string
  short_description: string | null
  organization_id: string | null
  user_id: string | null
  avatar_file_id: string | null
  is_system_persona: boolean
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface PersonaDetail extends Persona {
  behavior_setting: BehaviorSetting | null
  model_policy: ModelPolicy | null
  domain_tags: DomainTag[]
  access_roles: AccessRole[]
  workspace_mappings: WorkspaceMapping[]
}

export interface BehaviorSetting {
  persona_behavior_setting_id: string
  system_instruction: string | null
  tone_of_voice: string | null
  response_format_preference: string | null
  default_language: string
  max_response_length: number
  temperature: number | null
}

export interface ModelPolicy {
  persona_model_policy_id: string
  default_model_id: string | null
  chat_mode: string | null
  use_rag: boolean
  use_internal_llm: boolean
  use_external_llm: boolean
  classification_limit: string | null
  allow_file_upload: boolean
  allow_external_sources: boolean
  updated_at: string | null
}

export interface DomainTag {
  persona_domain_tag_id: string
  tag_name: string
  tag_type: string
}

export interface AccessRole {
  persona_access_role_id: string
  user_id: string | null
}

export interface WorkspaceMapping {
  persona_workspace_mapping_id: string
  workspace_id: string
  is_default: boolean
  status: string
  created_at: string | null
}

export interface PersonaListFilters {
  organization_id?: string
  category?: string
  status?: string
}

export interface PersonaCreateRequest {
  persona_code: string
  persona_name: string
  persona_category: string
  short_description?: string
  organization_id?: string
}

export interface BehaviorUpdateRequest {
  system_instruction?: string
  tone_of_voice?: string
  response_format_preference?: string
  default_language?: string
  max_response_length?: number
  temperature?: number
}

export interface ModelPolicyUpdateRequest {
  default_model_id?: string | null
  chat_mode?: string
  use_rag?: boolean
  use_internal_llm?: boolean
  use_external_llm?: boolean
  classification_limit?: string
  allow_file_upload?: boolean
  allow_external_sources?: boolean
}

export interface AllowedModelItem {
  model_id: string
  priority_order?: number
  is_default?: boolean
}

export interface DomainTagItem {
  tag_name: string
  tag_type: 'domain' | 'sdlc' | 'project_type'
}

export const personasApi = {
  list: (filters?: PersonaListFilters) =>
    apiClient
      .get<Persona[]>('/api/v1/personas', { params: filters })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<PersonaDetail>(`/api/v1/personas/${id}`).then((r) => r.data),

  create: (data: PersonaCreateRequest) =>
    apiClient.post<Persona>('/api/v1/personas', data).then((r) => r.data),

  update: (id: string, data: Partial<PersonaCreateRequest>) =>
    apiClient.put<Persona>(`/api/v1/personas/${id}`, data).then((r) => r.data),

  setStatus: (id: string, status: string) =>
    apiClient
      .patch<{ persona_id: string; status: string }>(
        `/api/v1/personas/${id}/status`,
        { status }
      )
      .then((r) => r.data),

  updateBehavior: (id: string, data: BehaviorUpdateRequest) =>
    apiClient
      .put<BehaviorSetting>(`/api/v1/personas/${id}/behavior`, data)
      .then((r) => r.data),

  updateModelPolicy: (id: string, data: ModelPolicyUpdateRequest) =>
    apiClient
      .put<ModelPolicy>(`/api/v1/personas/${id}/model-policy`, data)
      .then((r) => r.data),

  updateAllowedModels: (id: string, models: AllowedModelItem[]) =>
    apiClient
      .put(`/api/v1/personas/${id}/allowed-models`, { models })
      .then((r) => r.data),

  updateKnowledge: (id: string, collection_ids: string[]) =>
    apiClient
      .put(`/api/v1/personas/${id}/knowledge`, { collection_ids })
      .then((r) => r.data),

  updateDomainTags: (id: string, tags: DomainTagItem[]) =>
    apiClient
      .put<DomainTag[]>(`/api/v1/personas/${id}/domain-tags`, { tags })
      .then((r) => r.data),

  updateAccess: (id: string, user_ids: string[]) =>
    apiClient
      .put(`/api/v1/personas/${id}/access`, { user_ids })
      .then((r) => r.data),
}
