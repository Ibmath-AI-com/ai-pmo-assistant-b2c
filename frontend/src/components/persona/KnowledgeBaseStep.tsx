import { useState } from 'react'
import { appTheme, inputStyle, sectionLabelStyle } from '@/lib/theme'

const SDLC = ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure', 'All Phases'] as const
const DOMAINS = [
  'Risk',
  'Governance',
  'KPI',
  'Benefits',
  'Portfolio',
  'Change Management',
  'Strategy Execution',
  'KPIs',
  'Strategy Planning',
] as const
const RETRIEVAL = ['Conservative', 'Standard', 'Deep Retrieval'] as const
const KB_OPTIONS = ['Corporate Strategy', 'Risk Library', 'Portfolio Reports', 'PMO Playbook']
const LLM_OPTIONS = ['GPT-4o', 'Claude Sonnet', 'Claude Opus', 'Llama 3.1', 'Mistral']

export interface KnowledgeBaseValues {
  allowed_knowledge_bases: string[]
  allowed_llms: string[]
  sdlc_applicability: string
  domain_tags: string[]
  retrieval_depth: string
}

interface Props {
  values: KnowledgeBaseValues
  onChange: (next: KnowledgeBaseValues) => void
  disabled?: boolean
}

export function KnowledgeBaseStep({ values, onChange, disabled }: Props) {
  const set = <K extends keyof KnowledgeBaseValues>(k: K, v: KnowledgeBaseValues[K]) => onChange({ ...values, [k]: v })

  return (
    <div>
      <div style={sectionLabelStyle}>Knowledge base settings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <MultiSelect
          values={values.allowed_knowledge_bases}
          onChange={(vs) => set('allowed_knowledge_bases', vs)}
          placeholder="Allowed Knowledge base"
          options={KB_OPTIONS}
          disabled={disabled}
        />
        <MultiSelect
          values={values.allowed_llms}
          onChange={(vs) => set('allowed_llms', vs)}
          placeholder="Allowed LLMs"
          options={LLM_OPTIONS}
          disabled={disabled}
        />
        <Select
          value={values.sdlc_applicability}
          onChange={(v) => set('sdlc_applicability', v)}
          placeholder="SDLC Applicability"
          options={[...SDLC]}
          disabled={disabled}
        />
        <MultiSelect
          values={values.domain_tags}
          onChange={(vs) => set('domain_tags', vs)}
          placeholder="Domain Tags (Risk / Governance / KPI / Benefits / Portfolio / Change Management / Strategy Execution / KPIs / Strategy Planning)"
          options={[...DOMAINS]}
          disabled={disabled}
        />
        <Select
          value={values.retrieval_depth}
          onChange={(v) => set('retrieval_depth', v)}
          placeholder="Retrieval Depth Level (Conservative / Standard / Deep Retrieval)"
          options={[...RETRIEVAL]}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function Select({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  disabled?: boolean
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={selectStyle(value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function MultiSelect({
  values,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
  options: string[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const display = values.length === 0 ? placeholder : values.join(', ')

  const toggle = (o: string) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o))
    else onChange([...values, o])
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: values.length === 0 ? appTheme.textPlaceholder : appTheme.textPrimary,
          paddingRight: '32px',
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {display}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div
            style={{
              position: 'absolute',
              top: '44px',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              border: `1px solid ${appTheme.borderSoft}`,
              borderRadius: appTheme.radiusInput,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 21,
            }}
          >
            {options.map((o) => {
              const selected = values.includes(o)
              return (
                <label
                  key={o}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: appTheme.textPrimary,
                    cursor: 'pointer',
                    backgroundColor: selected ? '#EFF6FF' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={selected} onChange={() => toggle(o)} />
                  {o}
                </label>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function selectStyle(value: string): React.CSSProperties {
  return {
    ...inputStyle,
    color: value ? appTheme.textPrimary : appTheme.textPlaceholder,
    appearance: 'none',
    backgroundImage:
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  }
}
