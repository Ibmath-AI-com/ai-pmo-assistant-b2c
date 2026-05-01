
import { C, Field, Sel, Toggle } from '../shared'
import type { FieldDef, FieldValue, FormState } from './types'

// ─── Single-field renderer ────────────────────────────────────────────────────

interface FieldRendererProps {
  def: FieldDef
  value: FieldValue
  onChange: (v: FieldValue) => void
}

export function FieldRenderer({ def, value, onChange }: FieldRendererProps) {
  const val = value ?? def.default ?? ''

  if (def.type === 'select') {
    return (
      <Sel
        label={def.label}
        value={String(val)}
        onChange={onChange}
        options={def.options ?? []}
        placeholder={def.placeholder}
        required={def.required}
      />
    )
  }

  if (def.type === 'toggle') {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          {def.label}
          {def.required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
        </div>
        <Toggle
          options={def.options ?? []}
          value={String(val)}
          onChange={onChange}
          small={def.small}
        />
      </div>
    )
  }

  if (def.type === 'range') {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{def.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{val}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={val as string | number}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', accentColor: C.primary }}
        />
      </div>
    )
  }

  if (def.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={!!val}
          onChange={e => onChange(e.target.checked)}
          style={{ accentColor: C.primary }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{def.label}</span>
      </div>
    )
  }

  return (
    <Field
      label={def.label}
      value={String(val)}
      onChange={onChange}
      type={def.type === 'date' ? 'date' : 'text'}
      multiline={def.type === 'textarea'}
      rows={def.rows ?? 3}
      placeholder={def.placeholder}
      required={def.required}
    />
  )
}

// ─── Grid row of fields ───────────────────────────────────────────────────────

interface GridRowProps {
  rowDef: { columns: number; fields: FieldDef[] }
  state: FormState
  update: (key: string, v: FieldValue) => void
}

export function GridRow({ rowDef, state, update }: GridRowProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rowDef.columns}, 1fr)`, gap: 14, marginBottom: 4 }}>
      {rowDef.fields.map(f => (
        <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
          <FieldRenderer
            def={f}
            value={(state[f.key] as FieldValue) ?? f.default ?? ''}
            onChange={v => update(f.key, v)}
          />
        </div>
      ))}
    </div>
  )
}
