import { useQuery } from '@tanstack/react-query'
import { templatesApi, type TemplateListFilters } from '../api/templates'

export function useTemplateFamilies() {
  return useQuery({
    queryKey: ['template-families'],
    queryFn: () => templatesApi.listFamilies(),
  })
}

export function useTemplates(filters?: TemplateListFilters) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: () => templatesApi.list(filters),
    enabled: !!(filters?.family_id),
  })
}

export function useTemplateLatestVersion(templateId?: string) {
  return useQuery({
    queryKey: ['template-latest-version', templateId],
    queryFn: () => templatesApi.getLatestVersion(templateId!),
    enabled: !!templateId,
  })
}
