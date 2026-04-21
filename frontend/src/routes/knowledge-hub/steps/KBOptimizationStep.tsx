import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { TagChip } from '@/components/knowledge/TagChip'
import { useUpdateTags } from '@/lib/hooks/useKnowledge'
import type { TagUpsert } from '@/lib/api/knowledge'
import type { OptimizationData, WizardAction } from '../AddDocumentWizard'

interface KBOptimizationStepProps {
  data: OptimizationData
  documentId: string
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
  onNext: () => void
}

const SDLC_OPTIONS = ['Planning', 'Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Maintenance', 'All']
const DOMAIN_OPTIONS = ['HR', 'Finance', 'Legal', 'IT', 'Operations', 'Product', 'Sales', 'Marketing', 'Other']
const PROJECT_TYPE_OPTIONS = ['Agile', 'Waterfall', 'Hybrid', 'DevOps', 'Other']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

// ─── Multi-select chip field ──────────────────────────────────────────────────

interface MultiSelectFieldProps {
  label: string
  options: string[]
  selected: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}

function MultiSelectField({ label, options, selected, onAdd, onRemove }: MultiSelectFieldProps) {
  const available = options.filter((o) => !selected.includes(o))

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value=""
        onChange={(e) => { if (e.target.value) onAdd(e.target.value) }}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Add {label.toLowerCase()}…</option>
        {available.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selected.map((v) => (
            <TagChip key={v} label={v} onRemove={() => onRemove(v)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Free-text keyword field ──────────────────────────────────────────────────

interface KeywordFieldProps {
  label: string
  keywords: string[]
  onAdd: (kw: string) => void
  onRemove: (kw: string) => void
  placeholder?: string
}

function KeywordField({ label, keywords, onAdd, onRemove, placeholder }: KeywordFieldProps) {
  const [input, setInput] = useState('')

  const commit = () => {
    const trimmed = input.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      onAdd(trimmed)
    }
    setInput('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
          placeholder={placeholder ?? `Type and press Enter…`}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={commit}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {keywords.map((kw) => (
            <TagChip key={kw} label={kw} onRemove={() => onRemove(kw)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step component ───────────────────────────────────────────────────────────

export function KBOptimizationStep({ data, documentId, dispatch, onBack, onNext }: KBOptimizationStepProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const updateTags = useUpdateTags()

  const toggle = (key: 'sdlc' | 'domain' | 'project_type' | 'keywords' | 'persona') => ({
    add: (value: string) =>
      dispatch({ type: 'SET_OPTIMIZATION', data: { [key]: [...data[key], value] } }),
    remove: (value: string) =>
      dispatch({ type: 'SET_OPTIMIZATION', data: { [key]: data[key].filter((v) => v !== value) } }),
  })

  const handleNext = async () => {
    setApiError(null)

    // Build tags array from all groups
    const tags: TagUpsert[] = [
      ...data.sdlc.map((v) => ({ tag_name: v, tag_type: 'sdlc' as const })),
      ...data.domain.map((v) => ({ tag_name: v, tag_type: 'domain' as const })),
      ...data.project_type.map((v) => ({ tag_name: v, tag_type: 'project_type' as const })),
      ...data.keywords.map((v) => ({ tag_name: v, tag_type: 'keyword' as const })),
      ...data.persona.map((v) => ({ tag_name: `persona:${v}`, tag_type: 'keyword' as const })),
      ...(data.priority ? [{ tag_name: `priority:${data.priority}`, tag_type: 'keyword' as const }] : []),
    ]

    try {
      await updateTags.mutateAsync({ id: documentId, tags })
      onNext()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
        : typeof detail === 'string'
          ? detail
          : 'Failed to save tags. Please try again.'
      setApiError(msg)
    }
  }

  const sdlc = toggle('sdlc')
  const domain = toggle('domain')
  const projectType = toggle('project_type')
  const keywords = toggle('keywords')
  const persona = toggle('persona')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">KB Optimization</h2>
        <p className="mt-0.5 text-sm text-gray-500">Tag this document for better search and discovery.</p>
      </div>

      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Two-column grid for multi-selects */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <MultiSelectField
          label="SDLC Applicability"
          options={SDLC_OPTIONS}
          selected={data.sdlc}
          onAdd={sdlc.add}
          onRemove={sdlc.remove}
        />

        <MultiSelectField
          label="Domain Tags"
          options={DOMAIN_OPTIONS}
          selected={data.domain}
          onAdd={domain.add}
          onRemove={domain.remove}
        />

        <MultiSelectField
          label="Project Type"
          options={PROJECT_TYPE_OPTIONS}
          selected={data.project_type}
          onAdd={projectType.add}
          onRemove={projectType.remove}
        />

        {/* Priority Weight */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Priority Weight</label>
          <select
            value={data.priority}
            onChange={(e) => dispatch({ type: 'SET_OPTIMIZATION', data: { priority: e.target.value } })}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select priority…</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Keywords — full width free-text */}
      <KeywordField
        label="Keywords"
        keywords={data.keywords}
        onAdd={keywords.add}
        onRemove={keywords.remove}
        placeholder="Type a keyword and press Enter…"
      />

      {/* Persona Relevance — full width free-text */}
      <KeywordField
        label="Persona Relevance"
        keywords={data.persona}
        onAdd={persona.add}
        onRemove={persona.remove}
        placeholder="e.g. Developer, PM, Architect…"
      />

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={updateTags.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateTags.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Next
        </button>
      </div>
    </div>
  )
}
