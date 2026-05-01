import { apiClient } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KnowledgeCollection {
  knowledge_collection_id: string
  collection_name: string
  collection_code: string
  description: string | null
  status: 'active' | 'inactive'
  document_count: number
  created_at: string
}

export interface DocumentGovernance {
  classification_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  document_owner: string | null
  effective_date: string | null
  review_date: string | null
  expiry_date: string | null
  review_status: string | null
  allow_external_llm_usage: boolean
  llm_model_id: string | null
}

export interface DocumentTag {
  knowledge_document_tag_id: string
  tag_name: string
  tag_type: 'domain' | 'sdlc' | 'project_type' | 'keyword'
  status: 'active' | 'inactive'
}

export interface KnowledgeDocument {
  knowledge_document_id: string
  knowledge_collection_id: string
  title: string
  document_type: string | null
  summary_description: string | null
  version_number: string | null
  source_code: string | null
  status: 'draft' | 'active' | 'archived' | 'deleted'
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

export interface DocumentAccessEntry {
  knowledge_document_access_id: string
  user_id: string | null
  access_type: string
}

export interface DocumentListItem extends KnowledgeDocument {
  governance: DocumentGovernance | null
  tags: DocumentTag[]
  access_entries?: DocumentAccessEntry[]
}

export interface GovernanceUpsert {
  classification_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  document_owner?: string
  effective_date?: string
  review_date?: string
  expiry_date?: string
  review_status?: string
  allow_external_llm_usage?: boolean
  llm_model_id?: string
}

export interface TagUpsert {
  tag_name: string
  tag_type: 'domain' | 'sdlc' | 'project_type' | 'keyword'
}

export interface AccessEntry {
  user_id: string
  access_type: 'read' | 'write' | 'admin'
}

export interface DocumentCreate {
  title: string
  document_type?: string
  knowledge_collection_id: string
  summary_description?: string
  version_number?: string
  source_code?: string
}

export interface DocumentUpdate {
  title?: string
  document_type?: string
  knowledge_collection_id?: string
  summary_description?: string
  version_number?: string
  source_code?: string
  status?: 'draft' | 'active' | 'archived' | 'deleted'
}

export interface UploadedFile {
  file_id: string
  original_file_name: string
  mime_type: string
  file_size_bytes: number
  upload_status: string
  storage_path: string
  created_at: string
}

export interface IngestionJob {
  document_ingestion_job_id: string
  knowledge_document_id: string
  job_type: 'initial' | 'reindex' | 'update'
  job_status: 'queued' | 'processing' | 'completed' | 'failed'
  total_chunks: number | null
  processed_chunks: number | null
  progress_pct: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

export interface LLMModel {
  llm_model_id: string
  provider_name: string
  model_name: string
  model_code: string
  is_external: boolean
}

export interface KnowledgeUser {
  user_id: string
  username: string
  email: string
}

export interface DocumentFilters {
  search?: string
  document_type?: string
  knowledge_collection_id?: string
  classification_level?: string
  sdlc?: string
  domain?: string
  persona?: string
  status?: string
  skip?: number
  limit?: number
}

// ─── Collections ─────────────────────────────────────────────────────────────

export const fetchCollections = () =>
  apiClient.get<KnowledgeCollection[]>('/api/v1/knowledge/collections').then((r) => r.data)

export const fetchCollection = (id: string) =>
  apiClient.get<KnowledgeCollection>(`/api/v1/knowledge/collections/${id}`).then((r) => r.data)

export const createCollection = (data: { collection_code: string; collection_name: string; description?: string }) =>
  apiClient.post<KnowledgeCollection>('/api/v1/knowledge/collections', data).then((r) => r.data)

// ─── Documents ───────────────────────────────────────────────────────────────

export const fetchDocuments = (filters: DocumentFilters = {}) => {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.document_type) params.document_type = filters.document_type
  if (filters.knowledge_collection_id) params.knowledge_collection_id = filters.knowledge_collection_id
  if (filters.classification_level) params.classification_level = filters.classification_level
  if (filters.sdlc) params.sdlc = filters.sdlc
  if (filters.domain) params.domain = filters.domain
  if (filters.persona) params.persona = filters.persona
  if (filters.status) params.status = filters.status
  if (filters.skip !== undefined) params.skip = filters.skip
  if (filters.limit !== undefined) params.limit = filters.limit
  return apiClient.get<DocumentListItem[]>('/api/v1/knowledge/documents', { params }).then((r) => r.data)
}

export const fetchDocument = (id: string) =>
  apiClient.get<DocumentListItem>(`/api/v1/knowledge/documents/${id}`).then((r) => r.data)

export const createDocument = (data: DocumentCreate) =>
  apiClient.post<KnowledgeDocument>('/api/v1/knowledge/documents', data).then((r) => r.data)

export const updateDocument = (id: string, data: DocumentUpdate) =>
  apiClient.put<KnowledgeDocument>(`/api/v1/knowledge/documents/${id}`, data).then((r) => r.data)

export const upsertGovernance = (id: string, data: GovernanceUpsert) =>
  apiClient.put(`/api/v1/knowledge/documents/${id}/governance`, data).then((r) => r.data)

export const updateTags = (id: string, tags: TagUpsert[]) =>
  apiClient.put(`/api/v1/knowledge/documents/${id}/tags`, tags).then((r) => r.data)

export const updateAccess = (id: string, entries: AccessEntry[]) =>
  apiClient.put(`/api/v1/knowledge/documents/${id}/access`, entries).then((r) => r.data)

export const updateDocumentStatus = (id: string, status: string) =>
  apiClient.patch(`/api/v1/knowledge/documents/${id}/status`, { status }).then((r) => r.data)

export const reindexDocument = (id: string) =>
  apiClient.post(`/api/v1/knowledge/documents/${id}/reindex`).then((r) => r.data)

// ─── Files ───────────────────────────────────────────────────────────────────

export const uploadFile = (formData: FormData) =>
  apiClient
    .post<UploadedFile>('/api/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

export const getFileMeta = (fileId: string) =>
  apiClient.get<UploadedFile>(`/api/v1/files/${fileId}`).then((r) => r.data)

export const getFileDownloadUrl = (fileId: string) =>
  apiClient.get<{ download_url: string }>(`/api/v1/files/${fileId}/download`).then((r) => r.data)

// ─── References ──────────────────────────────────────────────────────────────

export const fetchLLMModels = () =>
  apiClient.get<LLMModel[]>('/api/v1/knowledge/llm-models').then((r) => r.data)

export const fetchKnowledgeUsers = () =>
  apiClient.get<KnowledgeUser[]>('/api/v1/knowledge/users').then((r) => r.data)

// ─── Ingestion Jobs ───────────────────────────────────────────────────────────

export const fetchJob = (id: string) =>
  apiClient.get<IngestionJob>(`/api/v1/knowledge/jobs/${id}`).then((r) => r.data)

export const fetchJobs = () =>
  apiClient.get<IngestionJob[]>('/api/v1/knowledge/jobs').then((r) => r.data)
