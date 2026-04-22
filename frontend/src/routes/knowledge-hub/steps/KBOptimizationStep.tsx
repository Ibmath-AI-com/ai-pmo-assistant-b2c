import { useState } from 'react'
import { appTheme, inputStyle, sectionLabelStyle } from '@/lib/theme'
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: appTheme.textSecondary, marginBottom: '4px', fontFamily: appTheme.font }}>
      {children}
    </label>
  )
}

function MultiSelectField({ label, options, selected, onAdd, onRemove }: {
  label: string
  options: string[]
  selected: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
}) {
  const available = options.filter((o) => !selected.includes(o))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <FieldLabel>{label}</FieldLabel>
      <select
        value=""
        onChange={(e) => { if (e.target.value) onAdd(e.target.value) }}
        style={{ ...selectStyle, color: appTheme.textPlaceholder }}
      >
        <option value="">Add {label.toLowerCase()}…</option>
        {available.map((o) => <option key={o} value={o} style={{ color: appTheme.textPrimary }}>{o}</option>)}
      </select>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {selected.map((v) => <TagChip key={v} label={v} onRemove={() => onRemove(v)} />)}
        </div>
      )}
    </div>
  )
}

function KeywordField({ label, keywords, onAdd, onRemove, placeholder }: {
  label: string
  keywords: string[]
  onAdd: (kw: string) => void
  onRemove: (kw: string) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const commit = () => {
    const trimmed = input.trim()
    if (trimmed && !keywords.includes(trimmed)) onAdd(trimmed)
    setInput('')
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
          placeholder={placeholder ?? 'Type and press Enter…'}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={commit}
          style={{
            height: '40px',
            padding: '0 16px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: appTheme.textSubtle,
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: appTheme.font,
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
      {keywords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {keywords.map((kw) => <TagChip key={kw} label={kw} onRemove={() => onRemove(kw)} />)}
        </div>
      )}
    </div>
  )
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={sectionLabelStyle}>KB Optimization</div>

      {apiError && (
        <div style={{ padding: '10px 12px', borderRadius: appTheme.radiusInput, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: appTheme.danger, fontSize: '13px' }}>
          {apiError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <MultiSelectField label="SDLC Applicability" options={SDLC_OPTIONS} selected={data.sdlc} onAdd={sdlc.add} onRemove={sdlc.remove} />
        <MultiSelectField label="Domain Tags" options={DOMAIN_OPTIONS} selected={data.domain} onAdd={domain.add} onRemove={domain.remove} />
        <MultiSelectField label="Project Type" options={PROJECT_TYPE_OPTIONS} selected={data.project_type} onAdd={projectType.add} onRemove={projectType.remove} />

        {/* Priority Weight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel>Priority Weight</FieldLabel>
          <select
            value={data.priority}
            onChange={(e) => dispatch({ type: 'SET_OPTIMIZATION', data: { priority: e.target.value } })}
            style={{ ...selectStyle, color: data.priority ? appTheme.textPrimary : appTheme.textPlaceholder }}
          >
            <option value="">Select priority…</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p} style={{ color: appTheme.textPrimary }}>{p}</option>)}
          </select>
        </div>
      </div>

      <KeywordField label="Keywords" keywords={data.keywords} onAdd={keywords.add} onRemove={keywords.remove} placeholder="Type a keyword and press Enter…" />
      <KeywordField label="Persona Relevance" keywords={data.persona} onAdd={persona.add} onRemove={persona.remove} placeholder="e.g. Developer, PM, Architect…" />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            height: '40px',
            padding: '0 22px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: appTheme.textSubtle,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: appTheme.font,
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={updateTags.isPending}
          style={{
            height: '40px',
            padding: '0 28px',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            backgroundColor: appTheme.primaryBlue,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: updateTags.isPending ? 'not-allowed' : 'pointer',
            opacity: updateTags.isPending ? 0.7 : 1,
            fontFamily: appTheme.font,
          }}
        >
          {updateTags.isPending ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  )
}
