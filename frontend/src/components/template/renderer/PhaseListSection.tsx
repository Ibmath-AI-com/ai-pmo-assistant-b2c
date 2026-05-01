import React from 'react'
import { C, Card, SL, AddBtn, RmBtn } from '../shared'
import { FieldRenderer } from './FieldRenderer'
import type { Section, PhaseItem, FieldValue } from './types'

interface PhaseListSectionProps {
  section: Section
  listState: PhaseItem[]
  updateList: (items: PhaseItem[]) => void
}

export function PhaseListSection({ section, listState, updateList }: PhaseListSectionProps) {
  const phaseFields = section.phaseFields ?? []
  const addLabel    = section.phaseAddLabel ?? '+ Add Phase'

  const updateItem = (i: number, k: keyof PhaseItem, v: FieldValue) => {
    const updated = [...listState]
    updated[i] = { ...updated[i], [k]: v } as PhaseItem
    updateList(updated)
  }

  const addItem = () =>
    updateList([
      ...listState,
      { id: `PH-${String(listState.length + 1).padStart(2, '0')}`, phase: '', start: '', end: '', status: 'Not Started', keyActivities: '', milestones: '', benefits: '' },
    ])

  const removeItem = (i: number) => updateList(listState.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {listState.map((item, i) => (
        <div
          key={i}
          style={{ background: '#F8FAFF', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, color: C.primary }}>{item.id}</span>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
          {phaseFields.map((row, ri) => (
            <div
              key={ri}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${row.columns}, 1fr)`, gap: 12, marginBottom: 4 }}
            >
              {row.fields.map(f => (
                <FieldRenderer
                  key={f.key}
                  def={f}
                  value={(item[f.key as keyof PhaseItem] as FieldValue) ?? f.default ?? ''}
                  onChange={v => updateItem(i, f.key as keyof PhaseItem, v)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
      <AddBtn onClick={addItem} label={addLabel} />
    </Card>
  )
}
