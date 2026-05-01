import React from 'react'
import { C, Card, SL, Field, RmBtn } from '../shared'
import type { Section, BscObjective, FormState } from './types'

interface BscMapSectionProps {
  section: Section
  state: FormState
  updateListKey: (key: string, items: BscObjective[]) => void
}

const defaultPerspectives = [
  { id: 'financial', label: 'Financial',        color: C.blue,   bg: C.blueBg   },
  { id: 'customer',  label: 'Customer',          color: C.green,  bg: C.greenBg  },
  { id: 'process',   label: 'Internal Process',  color: C.orange, bg: C.orangeBg },
  { id: 'learning',  label: 'Learning & Growth', color: C.teal,   bg: C.tealBg   },
]

export function BscMapSection({ section, state, updateListKey }: BscMapSectionProps) {
  const perspectives = section.perspectives ?? defaultPerspectives

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {perspectives.map(p => {
        const items = (state[p.id] as BscObjective[]) ?? []

        const updateItem = (i: number, k: keyof BscObjective, v: string) => {
          const updated = [...items]
          updated[i] = { ...updated[i], [k]: v }
          updateListKey(p.id, updated)
        }

        const addItem = () =>
          updateListKey(p.id, [
            ...items,
            { id: `SO-${String(items.length + 1).padStart(3, '0')}`, perspective: p.id, objective: '', description: '', cause: '' },
          ])

        const removeItem = (i: number) =>
          updateListKey(p.id, items.filter((_, j) => j !== i))

        return (
          <Card key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: p.color }} />
              <SL>{p.label} Perspective</SL>
            </div>
            {items.map((o, i) => (
              <div
                key={i}
                style={{ background: p.bg, border: `1px solid ${p.color}22`, borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: p.color, fontSize: 12 }}>{o.id}</span>
                  <RmBtn onClick={() => removeItem(i)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Strategic Objective" required value={o.objective} onChange={v => updateItem(i, 'objective', String(v))} placeholder="Objective name" />
                  <Field label="Description" value={o.description} onChange={v => updateItem(i, 'description', String(v))} placeholder="What this means…" />
                  <Field label="Linked Objectives (IDs)" value={o.cause} onChange={v => updateItem(i, 'cause', String(v))} placeholder="e.g. SO-003, SO-004" />
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              style={{
                background: 'none', border: `1.5px dashed ${p.color}`, color: p.color,
                borderRadius: 7, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 12, marginTop: 4,
              }}
            >
              + Add {p.label} Objective
            </button>
          </Card>
        )
      })}
    </div>
  )
}
