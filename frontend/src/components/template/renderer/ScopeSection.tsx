import React from 'react'
import { C, Card, SL } from '../shared'
import { FieldRenderer } from './FieldRenderer'
import type { Section, FieldValue, FormState } from './types'

interface ScopeSectionProps {
  section: Section
  state: FormState
  update: (key: string, v: FieldValue) => void
}

const scopeColors = [
  { color: C.green, bg: C.greenBg, emoji: '✔' },
  { color: C.red, bg: C.redBg, emoji: '✕' },
]

export function ScopeSection({ section, state, update }: ScopeSectionProps) {
  const fields = section.scopeFields ?? []

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${fields.length}, 1fr)`, gap: 14 }}>
        {fields.map((f, i) => {
          const c = scopeColors[i] ?? scopeColors[0]
          return (
            <div key={f.key}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 6 }}>
                {c.emoji} {f.label}
              </div>
              <textarea
                rows={f.rows ?? 5}
                value={(state[f.key] as string) ?? ''}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '10px 14px', border: `1.5px solid ${c.color}44`,
                  borderRadius: 8, background: c.bg, fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', color: C.text,
                }}
              />
            </div>
          )
        })}
      </div>
      {(section.fields ?? []).map(f => (
        <div key={f.key} style={{ marginTop: 14 }}>
          <FieldRenderer
            def={f}
            value={(state[f.key] as FieldValue) ?? f.default ?? ''}
            onChange={v => update(f.key, v)}
          />
        </div>
      ))}
    </Card>
  )
}
