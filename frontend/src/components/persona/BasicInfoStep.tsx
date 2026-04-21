import { useRef } from 'react'
import { appTheme, inputStyle, sectionLabelStyle, textareaStyle } from '@/lib/theme'

const CATEGORIES = ['PMO', 'Strategy', 'Risk', 'Portfolio', 'Custom'] as const

export interface BasicInfoValues {
  persona_name: string
  role_title: string
  persona_category: string
  short_description: string
  avatar_file_name: string
}

interface Props {
  values: BasicInfoValues
  onChange: (next: BasicInfoValues) => void
  errors?: Partial<Record<keyof BasicInfoValues, string>>
  disabled?: boolean
}

export function BasicInfoStep({ values, onChange, errors, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof BasicInfoValues>(k: K, v: BasicInfoValues[K]) => onChange({ ...values, [k]: v })

  return (
    <div>
      <div style={sectionLabelStyle}>Knowledge base Basic Information</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FieldInput
          value={values.persona_name}
          onChange={(v) => set('persona_name', v)}
          placeholder="Persona Name"
          error={errors?.persona_name}
          disabled={disabled}
        />
        <FieldInput
          value={values.role_title}
          onChange={(v) => set('role_title', v)}
          placeholder="Persona Role Title (formal role description)"
          error={errors?.role_title}
          disabled={disabled}
        />
        <FieldSelect
          value={values.persona_category}
          onChange={(v) => set('persona_category', v)}
          placeholder="Persona Category (PMO / Strategy / Risk / Portfolio / Custom)"
          options={[...CATEGORIES]}
          error={errors?.persona_category}
          disabled={disabled}
        />
        <FieldTextarea
          value={values.short_description}
          onChange={(v) => set('short_description', v)}
          placeholder="Persona Short Description"
          error={errors?.short_description}
          disabled={disabled}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            readOnly
            placeholder="Avatar"
            value={values.avatar_file_name}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => set('avatar_file_name', e.target.files?.[0]?.name ?? '')}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            style={{
              height: '40px',
              padding: '0 22px',
              borderRadius: appTheme.radiusInput,
              border: `1px solid ${appTheme.accentBlue}`,
              backgroundColor: '#FFFFFF',
              color: appTheme.accentBlue,
              fontSize: '13px',
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            Browse
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldInput({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  disabled?: boolean
}) {
  return (
    <FieldWrap error={error}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={inputStyle}
      />
    </FieldWrap>
  )
}

function FieldSelect({
  value,
  onChange,
  placeholder,
  options,
  error,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  error?: string
  disabled?: boolean
}) {
  return (
    <FieldWrap error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          ...inputStyle,
          color: value ? appTheme.textPrimary : appTheme.textPlaceholder,
          appearance: 'none',
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '32px',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} style={{ color: appTheme.textPrimary }}>
            {o}
          </option>
        ))}
      </select>
    </FieldWrap>
  )
}

function FieldTextarea({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  disabled?: boolean
}) {
  return (
    <FieldWrap error={error}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        style={textareaStyle}
      />
    </FieldWrap>
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
