import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProject,
  deleteProject,
  deleteProjectFile,
  fetchProjectFiles,
  fetchProjects,
  updateProject,
  uploadProjectFile,
  type ProjectCreate,
  type ProjectUpdate,
} from '../api/projects'

const PROJECTS_KEY = ['projects'] as const
const projectFilesKey = (id: string) => ['project-files', id] as const

export const useProjects = (limit = 5, skip = 0) =>
  useQuery({
    queryKey: [...PROJECTS_KEY, { limit, skip }],
    queryFn: () => fetchProjects(limit, skip),
    staleTime: 1000 * 60 * 2,
  })

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectCreate) => createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export const useUpdateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) => updateProject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export const useProjectFiles = (projectId: string) =>
  useQuery({
    queryKey: projectFilesKey(projectId),
    queryFn: () => fetchProjectFiles(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 30,
  })

export const useUploadProjectFile = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => uploadProjectFile(projectId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectFilesKey(projectId) }),
  })
}

export const useDeleteProjectFile = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectFileId: string) => deleteProjectFile(projectId, projectFileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectFilesKey(projectId) }),
  })
}
