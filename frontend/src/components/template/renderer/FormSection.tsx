import { Card, SL } from '../shared'
import { FieldRenderer, GridRow } from './FieldRenderer'
import type { Section, FieldValue, FormState } from './types'

interface FormSectionProps {
  section: Section
  state: FormState
  update: (key: string, v: FieldValue) => void
}

export function FormSection({ section, state, update }: FormSectionProps) {
  const content = section.rows
    ? section.rows.map((row, ri) => (
        <GridRow key={ri} rowDef={row} state={state} update={update} />
      ))
    : (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.columns ?? 1}, 1fr)`, gap: 14 }}>
        {(section.fields ?? []).map(f => (
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

  if (!section.title) return <Card>{content}</Card>

  return (
    <Card>
      <SL>{section.title}</SL>
      {content}
    </Card>
  )
}
