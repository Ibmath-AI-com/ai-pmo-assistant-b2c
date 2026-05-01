import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  personasApi,
  type PersonaListFilters,
  type PersonaCreateRequest,
  type BehaviorUpdateRequest,
  type ModelPolicyUpdateRequest,
  type AllowedModelItem,
  type DomainTagItem,
} from '../api/personas'

export function usePersonas(filters?: PersonaListFilters) {
  console.log("🚀 ~ usePersonas ~ filters:", filters)
  return useQuery({
    queryKey: ['personas', filters],
    queryFn: () => personasApi.list(filters),
    staleTime: 1000 * 60 * 2, // 2 min — show cached list instantly on re-navigation
  })
}

export function usePersona(id: string | undefined) {
  return useQuery({
    queryKey: ['persona', id],
    queryFn: () => personasApi.get(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreatePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonaCreateRequest) => personasApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personas'] }),
  })
}

export function useUpdatePersona(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<PersonaCreateRequest>) =>
      personasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] })
      qc.invalidateQueries({ queryKey: ['persona', id] })
    },
  })
}

export function useSetPersonaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      personasApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personas'] }),
  })
}

export function useUpdatePersonaBehavior(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BehaviorUpdateRequest) =>
      personasApi.updateBehavior(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}

export function useUpdatePersonaModelPolicy(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ModelPolicyUpdateRequest) =>
      personasApi.updateModelPolicy(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}

export function useUpdateAllowedModels(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (models: AllowedModelItem[]) =>
      personasApi.updateAllowedModels(id, models),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}

export function useUpdatePersonaKnowledge(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (collection_ids: string[]) =>
      personasApi.updateKnowledge(id, collection_ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}

export function useUpdatePersonaDomainTags(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tags: DomainTagItem[]) =>
      personasApi.updateDomainTags(id, tags),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}

export function useUpdatePersonaAccess(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (user_ids: string[]) => personasApi.updateAccess(id, user_ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persona', id] }),
  })
}
