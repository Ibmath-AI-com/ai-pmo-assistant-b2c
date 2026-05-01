import React from 'react'
import { C, Card, SL, AddBtn, RmBtn, TW, TD } from '../shared'
import type { Section, FieldValue, ListItem } from './types'

interface TableSectionProps {
  section: Section
  listState: ListItem[]
  updateList: (items: ListItem[]) => void
}

const inputStyle: React.CSSProperties = {
  border: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 60, width: '100%',
}

const selectStyle: React.CSSProperties = {
  border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 6px',
  fontSize: 11, fontFamily: 'inherit',
}

export function TableSection({ section, listState, updateList }: TableSectionProps) {
  const cols     = section.tableColumns ?? []
  const addLabel = section.addLabel ?? '+ Add Row'
  const defaultRow = section.defaultRow ?? {}

  const updateRow = (i: number, k: string, v: FieldValue) => {
    const updated = [...listState]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addRow = () => {
    const n = listState.length + 1
    updateList([...listState, { id: String(n), ...defaultRow }])
  }

  const removeRow = (i: number) => updateList(listState.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <TW
        headers={cols.map(c => c.label)}
        rows={listState.map((row, i) => [
          ...cols.map(c => {
            if (c.static) {
              return (
                <TD key={c.key} sx={{ fontWeight: 700, color: C.primary, fontSize: 11 }}>
                  {row[c.key] as string}
                </TD>
              )
            }
            if (c.type === 'select') {
              return (
                <TD key={c.key}>
                  <select
                    value={(row[c.key] as string) ?? ''}
                    onChange={e => updateRow(i, c.key, e.target.value)}
                    style={selectStyle}
                  >
                    {(c.options ?? []).map(o => <option key={o}>{o}</option>)}
                  </select>
                </TD>
              )
            }
            if (c.type === 'date') {
              return (
                <TD key={c.key}>
                  <input
                    type="date"
                    value={(row[c.key] as string) ?? ''}
                    onChange={e => updateRow(i, c.key, e.target.value)}
                    style={{ ...selectStyle, width: undefined }}
                  />
                </TD>
              )
            }
            if (c.type === 'range') {
              return (
                <TD key={c.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="range" min="0" max="100"
                      value={(row[c.key] as string) ?? '0'}
                      onChange={e => updateRow(i, c.key, e.target.value)}
                      style={{ width: 70 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, minWidth: 32 }}>
                      {(row[c.key] as number) ?? 0}%
                    </span>
                  </div>
                </TD>
              )
            }
            return (
              <TD key={c.key}>
                <input
                  value={(row[c.key] as string) ?? ''}
                  onChange={e => updateRow(i, c.key, e.target.value)}
                  placeholder={c.label}
                  style={{ ...inputStyle, width: c.width ?? undefined }}
                />
              </TD>
            )
          }),
          <TD key="__rm"><RmBtn onClick={() => removeRow(i)} /></TD>,
        ])}
      />
      <AddBtn onClick={addRow} label={addLabel} />
    </Card>
  )
}
