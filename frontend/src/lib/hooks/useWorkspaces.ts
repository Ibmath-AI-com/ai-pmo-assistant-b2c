import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  workspacesApi,
  type WorkspaceCreateRequest,
} from '../api/workspaces'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.list(),
  })
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspacesApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkspaceCreateRequest) => workspacesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useUpdateWorkspace(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<WorkspaceCreateRequest>) =>
      workspacesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      qc.invalidateQueries({ queryKey: ['workspace', id] })
    },
  })
}

export function useAddWorkspaceMember(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ user_id, member_role }: { user_id: string; member_role: string }) =>
      workspacesApi.addMember(id, user_id, member_role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', id] }),
  })
}

export function useRemoveWorkspaceMember(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (user_id: string) => workspacesApi.removeMember(id, user_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', id] }),
  })
}
