import { C, Card, SL, RmBtn } from '../shared'
import type { Section, SwotItem, FormState } from './types'

interface SwotSectionProps {
  section: Section
  state: FormState
  updateListKey: (key: string, items: SwotItem[]) => void
}

const quadrants = [
  { id: 'strengths',     label: 'Strengths',     color: C.green,  bg: C.greenBg  },
  { id: 'weaknesses',    label: 'Weaknesses',    color: C.red,    bg: C.redBg    },
  { id: 'opportunities', label: 'Opportunities', color: C.blue,   bg: C.blueBg   },
  { id: 'threats',       label: 'Threats',       color: C.orange, bg: C.orangeBg },
]

export function SwotSection({ section, state, updateListKey }: SwotSectionProps) {
  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {quadrants.map(q => {
          const items = (state[q.id] as SwotItem[]) ?? []

          const updateItem = (i: number, v: string) => {
            const updated = [...items]
            updated[i] = { ...updated[i], description: v }
            updateListKey(q.id, updated)
          }

          const addItem = () =>
            updateListKey(q.id, [...items, { description: '', importance: 'Medium' }])

          const removeItem = (i: number) =>
            updateListKey(q.id, items.filter((_, j) => j !== i))

          return (
            <div
              key={q.id}
              style={{ background: q.bg, borderRadius: 10, padding: 16, border: `1px solid ${q.color}22` }}
            >
              <div style={{ fontWeight: 700, color: q.color, fontSize: 14, marginBottom: 10 }}>
                {q.label}
              </div>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <textarea
                    value={it.description ?? ''}
                    onChange={e => updateItem(i, e.target.value)}
                    rows={2}
                    placeholder={`Describe this ${q.label.toLowerCase().slice(0, -1)}â€¦`}
                    style={{
                      flex: 1, border: 'none', background: 'transparent', resize: 'none',
                      fontSize: 13, fontFamily: 'inherit', color: C.text, outline: 'none',
                    }}
                  />
                  <RmBtn onClick={() => removeItem(i)} />
                </div>
              ))}
              <button
                onClick={addItem}
                style={{
                  background: 'none', border: `1.5px dashed ${q.color}`, color: q.color,
                  borderRadius: 7, padding: '6px 12px', fontWeight: 600, cursor: 'pointer',
                  fontSize: 12, width: '100%', marginTop: 4,
                }}
              >
                + Add
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
