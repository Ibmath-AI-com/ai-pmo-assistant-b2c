import React from 'react'
import { C, Card, SL, AddBtn, RmBtn } from '../shared'
import type { Section, WbsItem, FieldValue } from './types'

interface WbsSectionProps {
  section: Section
  listState: WbsItem[]
  updateList: (items: WbsItem[]) => void
}

const levelColors: Record<number, { bg: string; col: string }> = {
  1: { bg: '#1D4ED8', col: '#fff' },
  2: { bg: C.blueBg,    col: C.blue   },
  3: { bg: C.purpleBg,  col: C.purple },
  4: { bg: '#F0FDF4',   col: C.green  },
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: 5,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
}

export function WbsSection({ section, listState, updateList }: WbsSectionProps) {
  const updateItem = (i: number, k: keyof WbsItem, v: FieldValue) => {
    const updated = [...listState]
    updated[i] = { ...updated[i], [k]: v } as WbsItem
    updateList(updated)
  }

  const addItem = (level: number) =>
    updateList([
      ...listState,
      { id: `wbs-${listState.length + 1}`, wbsCode: '', level, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' },
    ])

  const removeItem = (i: number) => updateList(listState.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {listState.map((item, i) => {
        const lc = levelColors[item.level] ?? { bg: '#F3F4F6', col: C.textSub }
        return (
          <div
            key={i}
            style={{ marginLeft: (item.level - 1) * 32, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: lc.bg, color: lc.col,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2,
            }}>
              L{item.level}
            </div>
            <div style={{ flex: 1, background: '#F8FAFF', borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                <input
                  value={item.wbsCode}
                  onChange={e => updateItem(i, 'wbsCode', e.target.value)}
                  placeholder="WBS #"
                  style={{ ...inputStyle, fontWeight: 700, color: C.primary }}
                />
                <input
                  value={item.name}
                  onChange={e => updateItem(i, 'name', e.target.value)}
                  placeholder={item.level === 1 ? 'Phase Name' : item.level === 2 ? 'Work Package' : 'Activity'}
                  style={{ ...inputStyle, fontWeight: item.level === 1 ? 700 : 400 }}
                />
                <input
                  value={item.deliverable}
                  onChange={e => updateItem(i, 'deliverable', e.target.value)}
                  placeholder="Deliverable"
                  style={inputStyle}
                />
                <input
                  value={item.owner}
                  onChange={e => updateItem(i, 'owner', e.target.value)}
                  placeholder="Owner"
                  style={inputStyle}
                />
                <input
                  value={item.effort}
                  onChange={e => updateItem(i, 'effort', e.target.value)}
                  placeholder="Days"
                  style={inputStyle}
                />
                <select
                  value={item.status}
                  onChange={e => updateItem(i, 'status', e.target.value)}
                  style={{ ...inputStyle, fontSize: 11 }}
                >
                  {['Not Started', 'In Progress', 'Completed', 'On Hold'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(level => (
          <AddBtn key={level} onClick={() => addItem(level)} label={`+ Level ${level}`} />
        ))}
      </div>
    </Card>
  )
}
