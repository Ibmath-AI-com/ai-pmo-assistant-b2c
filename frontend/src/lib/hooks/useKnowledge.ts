import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDocument,
  fetchCollection,
  fetchCollections,
  fetchDocument,
  fetchDocuments,
  fetchJob,
  fetchJobs,
  fetchKnowledgeUsers,
  fetchLLMModels,
  getFileDownloadUrl,
  reindexDocument,
  updateAccess,
  updateDocument,
  updateDocumentStatus,
  updateTags,
  uploadFile,
  upsertGovernance,
  type AccessEntry,
  type DocumentCreate,
  type DocumentFilters,
  type DocumentUpdate,
  type GovernanceUpsert,
  type TagUpsert,
} from '../api/knowledge'

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const knowledgeKeys = {
  collections: ['collections'] as const,
  collection: (id: string) => ['collections', id] as const,
  documents: (filters: DocumentFilters) => ['documents', filters] as const,
  document: (id: string) => ['documents', id] as const,
  job: (id: string) => ['jobs', id] as const,
  jobs: ['jobs'] as const,
}

// ─── Collection Queries ───────────────────────────────────────────────────────

export const useCollections = () =>
  useQuery({
    queryKey: knowledgeKeys.collections,
    queryFn: fetchCollections,
  })

export const useCollection = (id: string) =>
  useQuery({
    queryKey: knowledgeKeys.collection(id),
    queryFn: () => fetchCollection(id),
    enabled: !!id,
  })

// ─── Document Queries ─────────────────────────────────────────────────────────

export const useDocuments = (filters: DocumentFilters = {}) =>
  useQuery({
    queryKey: knowledgeKeys.documents(filters),
    queryFn: () => fetchDocuments(filters),
  })

export const useDocument = (id: string) =>
  useQuery({
    queryKey: knowledgeKeys.document(id),
    queryFn: () => fetchDocument(id),
    enabled: !!id,
  })

// ─── Document Mutations ───────────────────────────────────────────────────────

export const useCreateDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DocumentCreate) => createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdate }) => updateDocument(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.document(id) })
    },
  })
}

export const useUpdateGovernance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GovernanceUpsert }) => upsertGovernance(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.document(id) })
    },
  })
}

export const useUpdateTags = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: TagUpsert[] }) => updateTags(id, tags),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.document(id) })
    },
  })
}

export const useUpdateAccess = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, entries }: { id: string; entries: AccessEntry[] }) => updateAccess(id, entries),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.document(id) })
    },
  })
}

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateDocumentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useReindexDocument = () =>
  useMutation({
    mutationFn: (id: string) => reindexDocument(id),
  })

// ─── File Mutations ───────────────────────────────────────────────────────────

export const useUploadFile = () =>
  useMutation({
    mutationFn: (formData: FormData) => uploadFile(formData),
  })

export const useFileDownloadUrl = (fileId: string) =>
  useQuery({
    queryKey: ['file-download', fileId],
    queryFn: () => getFileDownloadUrl(fileId),
    enabled: !!fileId,
    staleTime: 1000 * 60 * 5, // 5 min — presigned URLs expire
  })

// ─── Reference Queries ────────────────────────────────────────────────────────

export const useLLMModels = () =>
  useQuery({
    queryKey: ['llm-models'],
    queryFn: fetchLLMModels,
    staleTime: 1000 * 60 * 10, // 10 min — rarely changes
  })

export const useKnowledgeUsers = () =>
  useQuery({
    queryKey: ['knowledge-users'],
    queryFn: fetchKnowledgeUsers,
    staleTime: 1000 * 60 * 5,
  })

// ─── Job Queries ──────────────────────────────────────────────────────────────

export const useJob = (id: string, enabled = true) =>
  useQuery({
    queryKey: knowledgeKeys.job(id),
    queryFn: () => fetchJob(id),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.job_status
      if (status === 'completed' || status === 'failed') return false
      return 3000
    },
  })

export const useJobs = () =>
  useQuery({
    queryKey: knowledgeKeys.jobs,
    queryFn: fetchJobs,
  })
