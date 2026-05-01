import { C, Card, SL, AddBtn, RmBtn } from '../shared'
import type { Section, SignatoryItem } from './types'

interface SignatorySectionProps {
  section: Section
  listState: SignatoryItem[]
  updateList: (items: SignatoryItem[]) => void
}

export function SignatorySection({ section, listState, updateList }: SignatorySectionProps) {
  const updateItem = (i: number, k: keyof SignatoryItem, v: string | boolean) => {
    const updated = [...listState]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addItem = () =>
    updateList([...listState, { name: '', role: '', date: '', approved: false }])

  const removeItem = (i: number) =>
    updateList(listState.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {listState.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
            padding: 12, background: '#F8FAFF', borderRadius: 8, border: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={() => updateItem(i, 'approved', !s.approved)}
            style={{
              width: 38, height: 38, borderRadius: 8,
              border: `2px solid ${s.approved ? C.green : C.border}`,
              background: s.approved ? C.greenBg : '#fff',
              color: s.approved ? C.green : C.textMuted,
              fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700,
            }}
          >
            {s.approved ? 'âœ”' : ''}
          </button>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input
              value={s.name}
              onChange={e => updateItem(i, 'name', e.target.value)}
              placeholder="Full Name"
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <input
              value={s.role}
              onChange={e => updateItem(i, 'role', e.target.value)}
              placeholder="Role / Title"
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <input
              type="date"
              value={s.date}
              onChange={e => updateItem(i, 'date', e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <RmBtn onClick={() => removeItem(i)} />
        </div>
      ))}
      <AddBtn onClick={addItem} label="+ Add Signatory" />
    </Card>
  )
}
