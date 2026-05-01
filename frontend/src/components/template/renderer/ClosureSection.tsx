import React from 'react'
import { C, Card, SL } from '../shared'
import type { Section, FieldValue, FormState } from './types'

interface ClosureSectionProps {
  section: Section
  state: FormState
  update: (key: string, v: FieldValue) => void
}

const colorMap: Record<string, { color: string; bg: string; border: string }> = {
  green:  { color: C.green,  bg: C.greenBg,  border: `${C.green}22`  },
  red:    { color: C.red,    bg: C.redBg,    border: `${C.red}22`    },
  yellow: { color: C.yellow, bg: C.yellowBg, border: `${C.yellow}22` },
  blue:   { color: C.blue,   bg: C.blueBg,   border: `${C.blue}22`   },
}

export function ClosureSection({ section, state, update }: ClosureSectionProps) {
  const items = section.closureItems ?? []
  const cols = section.closureColumns ?? 2

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {items.map(item => {
          const clr = colorMap[item.color]
          return (
            <div
              key={item.key}
              style={{ background: clr.bg, borderRadius: 10, padding: 14, border: `1px solid ${clr.border}` }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: clr.color, marginBottom: 8 }}>
                {item.label}
              </div>
              <textarea
                rows={item.rows ?? 4}
                value={(state[item.key] as string) ?? ''}
                onChange={e => update(item.key, e.target.value)}
                placeholder={item.placeholder}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', color: C.text,
                }}
              />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
