import { C, Card, SL, Field, Toggle } from '../shared'
import type { Section, FieldValue, FormState } from './types'

interface StatusSectionProps {
  section: Section
  state: FormState
  update: (key: string, v: FieldValue) => void
}

const statusColors: Record<string, string> = {
  'On Track': C.green,
  'At Risk':  C.yellow,
  'Off Track': C.red,
}

export function StatusSection({ section, state, update }: StatusSectionProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
      {/* Left: overall progress + status buttons */}
      <Card>
        <SL>Overall Status</SL>
        {section.progressKey && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: C.primary, lineHeight: 1 }}>
              {(state[section.progressKey] as number) ?? 0}%
            </div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Complete</div>
            <input
              type="range" min="0" max="100"
              value={(state[section.progressKey] as number) ?? 0}
              onChange={e => update(section.progressKey!, e.target.value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
        )}
        {section.statusKey &&
          ['On Track', 'At Risk', 'Off Track'].map(s => (
            <button
              key={s}
              onClick={() => update(section.statusKey!, s)}
              style={{
                display: 'block', width: '100%', marginBottom: 6, padding: 9, borderRadius: 8,
                border: `2px solid ${state[section.statusKey!] === s ? statusColors[s] : C.border}`,
                background: state[section.statusKey!] === s ? `${statusColors[s]}18` : '#fff',
                color: state[section.statusKey!] === s ? statusColors[s] : C.textSub,
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              }}
            >
              {s}
            </button>
          ))
        }
      </Card>

      {/* Right: health indicators + budget */}
      <Card>
        <SL>Health Indicators</SL>
        {(section.healthKeys ?? []).map(({ label, key }) => (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120 }}>{label}</span>
            <Toggle
              small
              options={['On Track', 'At Risk', 'Off Track']}
              value={(state[key] as string) ?? 'On Track'}
              onChange={v => update(key, v)}
            />
          </div>
        ))}
        {section.budgetKeys && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <Field
              label="Budget Spent ($)"
              value={(state[section.budgetKeys.spent] as string) ?? ''}
              onChange={v => update(section.budgetKeys!.spent, v)}
              placeholder="0"
            />
            <Field
              label="Total Budget ($)"
              value={(state[section.budgetKeys.total] as string) ?? ''}
              onChange={v => update(section.budgetKeys!.total, v)}
              placeholder="0"
            />
          </div>
        )}
      </Card>
    </div>
  )
}
