import React from 'react'
import { C, Card, SL, AddBtn, RmBtn } from '../shared'
import { FieldRenderer, GridRow } from './FieldRenderer'
import type { Section, FieldValue, ListItem } from './types'

interface ListSectionProps {
  section: Section
  listState: ListItem[]
  updateList: (items: ListItem[]) => void
}

export function ListSection({ section, listState, updateList }: ListSectionProps) {
  const cfg       = section.listConfig
  const idPrefix  = cfg?.idPrefix ?? section.itemId ?? 'ITEM'
  const addLabel  = cfg?.addLabel ?? section.addLabel ?? '+ Add Item'
  const defaultItem: ListItem = cfg
    ? cfg.defaultItem
    : Object.fromEntries((section.fields ?? []).map(f => [f.key, (f.default ?? '') as FieldValue]))

  const updateItem = (i: number, k: string, v: FieldValue) => {
    const updated = [...listState]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addItem = () => {
    const n = listState.length + 1
    const id = `${idPrefix}-${String(n).padStart(3, '0')}`
    updateList([...listState, { ...defaultItem, id }])
  }

  const removeItem = (i: number) => updateList(listState.filter((_, j) => j !== i))

  const renderItemFields = (item: ListItem, i: number) => {
    if (cfg?.itemLayout) {
      return cfg.itemLayout.map((row, ri) => (
        <div
          key={ri}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${row.columns}, 1fr)`, gap: 14, marginBottom: 4 }}
        >
          {row.fields.map(f => (
            <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
              <FieldRenderer
                def={f}
                value={(item[f.key] as FieldValue) ?? f.default ?? ''}
                onChange={v => updateItem(i, f.key, v)}
              />
            </div>
          ))}
        </div>
      ))
    }
    // flat format
    const cols = section.columns ?? 2
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {(section.fields ?? []).map(f => (
          <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
            <FieldRenderer
              def={f}
              value={(item[f.key] as FieldValue) ?? f.default ?? ''}
              onChange={v => updateItem(i, f.key, v)}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {listState.map((item, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, color: C.primary }}>{item.id as string}</span>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
          {renderItemFields(item, i)}
        </Card>
      ))}
      <AddBtn onClick={addItem} label={addLabel} />
    </div>
  )
}

// Re-export GridRow so TabsSection can use it without extra imports
export { GridRow }
