import { appTheme, inputStyle, sectionLabelStyle, textareaStyle } from '@/lib/theme'

const TONES = ['Executive', 'Analytical', 'Advisory', 'Formal'] as const
const FORMATS = ['Structured Report', 'Bullet Points', 'Narrative'] as const

const RAG_LLM_MODES = [
  { value: 'rag_only', label: 'Use RAG Only', caps: { rag: true, illm: false, xllm: false } },
  { value: 'rag_internal', label: 'Use RAG & Internal LLM', caps: { rag: true, illm: true, xllm: false } },
  { value: 'rag_internal_external', label: 'Use RAG, Internal LLM and External LLM', caps: { rag: true, illm: true, xllm: true } },
  { value: 'rag_external', label: 'Use RAG & External LLM', caps: { rag: true, illm: false, xllm: true } },
  { value: 'internal_only', label: 'Use Internal LLM Only', caps: { rag: false, illm: true, xllm: false } },
  { value: 'internal_external', label: 'Use Internal and External LLM Only', caps: { rag: false, illm: true, xllm: true } },
  { value: 'external_only', label: 'Use External LLM Only', caps: { rag: false, illm: false, xllm: true } },
] as const

const SELECTION_OPTIONS_BY_MODE: Record<string, string[]> = {
  rag_only: ['Corporate KB', 'Strategy KB', 'Risk KB'],
  rag_internal: ['Corporate KB + Llama 3.1', 'Strategy KB + Mistral'],
  rag_internal_external: ['Corporate KB + Llama 3.1 + GPT-4o', 'Strategy KB + Mistral + Claude Sonnet'],
  rag_external: ['Corporate KB + GPT-4o', 'Strategy KB + Claude Sonnet'],
  internal_only: ['Llama 3.1', 'Mistral', 'Qwen'],
  internal_external: ['Llama 3.1 + GPT-4o', 'Mistral + Claude Sonnet'],
  external_only: ['GPT-4o', 'Claude Sonnet', 'Claude Opus', 'Gemini 1.5'],
}

export interface AIBehaviorValues {
  system_instruction: string
  tone_of_voice: string
  response_format_preference: string
  rag_llm_usage: string
  rag_llm_selection: string
}

interface Props {
  values: AIBehaviorValues
  onChange: (next: AIBehaviorValues) => void
  errors?: Partial<Record<keyof AIBehaviorValues, string>>
  disabled?: boolean
}

export function AIBehaviorStep({ values, onChange, errors, disabled }: Props) {
  const set = <K extends keyof AIBehaviorValues>(k: K, v: AIBehaviorValues[K]) => onChange({ ...values, [k]: v })

  const selectionOptions = values.rag_llm_usage ? SELECTION_OPTIONS_BY_MODE[values.rag_llm_usage] ?? [] : []

  return (
    <div>
      <div style={sectionLabelStyle}>Personal AI behavior</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FieldWrap error={errors?.system_instruction}>
          <textarea
            value={values.system_instruction}
            onChange={(e) => set('system_instruction', e.target.value)}
            placeholder="System instruction (Defines persona expertise, tone, constraints)"
            disabled={disabled}
            rows={3}
            style={textareaStyle}
          />
        </FieldWrap>
        <Select
          value={values.tone_of_voice}
          onChange={(v) => set('tone_of_voice', v)}
          placeholder="Tone of voice (Executive / Analytical / Advisory / Formal)"
          options={[...TONES]}
          disabled={disabled}
        />
        <Select
          value={values.response_format_preference}
          onChange={(v) => set('response_format_preference', v)}
          placeholder="Response Format Preferences (Structured Report / Bullet Points / Narrative)"
          options={[...FORMATS]}
          disabled={disabled}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '45% 1fr', gap: '14px' }}>
          <FieldWrap error={errors?.rag_llm_usage}>
            <select
              value={values.rag_llm_usage}
              onChange={(e) =>
                onChange({ ...values, rag_llm_usage: e.target.value, rag_llm_selection: '' })
              }
              disabled={disabled}
              style={selectStyle(values.rag_llm_usage)}
            >
              <option value="">RAG and LLM usage</option>
              {RAG_LLM_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FieldWrap>
          <select
            value={values.rag_llm_selection}
            onChange={(e) => set('rag_llm_selection', e.target.value)}
            disabled={disabled || !values.rag_llm_usage}
            style={selectStyle(values.rag_llm_selection)}
          >
            <option value="">Select RAG / LLM based on your selection</option>
            {selectionOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
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
        <option key={o} value={o} style={{ color: appTheme.textPrimary }}>
          {o}
        </option>
      ))}
    </select>
  )
}

function FieldWrap({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{error}</div>}
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

export { RAG_LLM_MODES }
