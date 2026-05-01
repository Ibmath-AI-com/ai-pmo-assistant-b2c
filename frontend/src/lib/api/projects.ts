import { apiClient } from './client'

export interface Project {
  project_id: string
  created_by: string
  project_name: string
  objective: string | null
  instructions: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  project_file_id: string
  project_id: string
  file_id: string
  source: string
  original_file_name: string
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
}

export interface ProjectCreate {
  project_name: string
  objective?: string
  instructions?: string
}

export interface ProjectUpdate {
  project_name?: string
  objective?: string
  instructions?: string
}

export const fetchProjects = (limit = 5, skip = 0) =>
  apiClient
    .get<Project[]>('/api/v1/projects', { params: { limit, skip } })
    .then((r) => r.data)

export const fetchProject = (id: string) =>
  apiClient.get<Project>(`/api/v1/projects/${id}`).then((r) => r.data)

export const createProject = (data: ProjectCreate) =>
  apiClient.post<Project>('/api/v1/projects', data).then((r) => r.data)

export const updateProject = (id: string, data: ProjectUpdate) =>
  apiClient.patch<Project>(`/api/v1/projects/${id}`, data).then((r) => r.data)

export const deleteProject = (id: string) =>
  apiClient.delete(`/api/v1/projects/${id}`)

export const fetchProjectFiles = (projectId: string) =>
  apiClient.get<ProjectFile[]>(`/api/v1/projects/${projectId}/files`).then((r) => r.data)

export const uploadProjectFile = (projectId: string, formData: FormData) =>
  apiClient
    .post<ProjectFile>(`/api/v1/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

export const deleteProjectFile = (projectId: string, projectFileId: string) =>
  apiClient.delete(`/api/v1/projects/${projectId}/files/${projectFileId}`)
