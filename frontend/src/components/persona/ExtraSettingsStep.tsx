import { useState } from 'react'
import { appTheme, inputStyle, sectionLabelStyle } from '@/lib/theme'
import { ToggleSwitch } from './ToggleSwitch'

const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const
const ACCESS_ROLES = ['Admin', 'PMO Director', 'Portfolio Manager', 'Analyst', 'Viewer']

export interface ExtraSettingsValues {
  data_classification_limit: string
  access_level: string[]
  hallucination_guard_mode: boolean
}

interface Props {
  values: ExtraSettingsValues
  onChange: (next: ExtraSettingsValues) => void
  errors?: Partial<Record<keyof ExtraSettingsValues, string>>
  disabled?: boolean
}

export function ExtraSettingsStep({ values, onChange, errors, disabled }: Props) {
  const set = <K extends keyof ExtraSettingsValues>(k: K, v: ExtraSettingsValues[K]) => onChange({ ...values, [k]: v })

  return (
    <div>
      <div style={sectionLabelStyle}>Persona Extra Settings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FieldWrap error={errors?.data_classification_limit}>
          <select
            value={values.data_classification_limit}
            onChange={(e) => set('data_classification_limit', e.target.value)}
            disabled={disabled}
            style={selectStyle(values.data_classification_limit)}
          >
            <option value="">Data Classification Limit (Public / Internal / Confidential / Restricted)</option>
            {CLASSIFICATIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </FieldWrap>
        <MultiSelect
          values={values.access_level}
          onChange={(vs) => set('access_level', vs)}
          placeholder="Access Level (Select roles who can access this persona)"
          options={ACCESS_ROLES}
          disabled={disabled}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: values.hallucination_guard_mode ? appTheme.cyan : '#CBD5E1',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '14px', color: appTheme.textPrimary }}>Hallucination Guard Mode</span>
          </div>
          <ToggleSwitch
            checked={values.hallucination_guard_mode}
            onChange={(v) => !disabled && set('hallucination_guard_mode', v)}
            ariaLabel="Hallucination Guard Mode"
          />
        </div>
      </div>
    </div>
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
