import React from 'react'
import { C, Card, SL, Field, Sel, AddBtn, RmBtn } from '../shared'
import type { Section, OkrObjective, KeyResult, FieldValue } from './types'

interface OkrSectionProps {
  section: Section
  listState: OkrObjective[]
  updateList: (items: OkrObjective[]) => void
}

const perspClr: Record<string, [string, string]> = {
  'Financial':         [C.blue,   C.blueBg  ],
  'Customer':          [C.green,  C.greenBg ],
  'Internal Process':  [C.orange, C.orangeBg],
  'Learning & Growth': [C.teal,   C.tealBg  ],
}

export function OkrSection({ section, listState, updateList }: OkrSectionProps) {
  const updateObj = (oi: number, k: keyof OkrObjective, v: FieldValue) => {
    const n = [...listState]
    n[oi] = { ...n[oi], [k]: v } as OkrObjective
    updateList(n)
  }

  const addKr = (oi: number) => {
    const n = [...listState]
    const krs: KeyResult[] = [
      ...n[oi].keyResults,
      { id: `KR-${String(oi + 1).padStart(3, '0')}-${n[oi].keyResults.length + 1}`, result: '', target: '', current: '', unit: '', weight: '' },
    ]
    n[oi] = { ...n[oi], keyResults: krs }
    updateList(n)
  }

  const updateKr = (oi: number, ki: number, k: keyof KeyResult, v: string) => {
    const n = [...listState]
    const krs = [...n[oi].keyResults]
    krs[ki] = { ...krs[ki], [k]: v }
    n[oi] = { ...n[oi], keyResults: krs }
    updateList(n)
  }

  const rmKr = (oi: number, ki: number) => {
    const n = [...listState]
    n[oi] = { ...n[oi], keyResults: n[oi].keyResults.filter((_, j) => j !== ki) }
    updateList(n)
  }

  const addObj = () =>
    updateList([
      ...listState,
      { id: `O-${String(listState.length + 1).padStart(3, '0')}`, objective: '', perspective: 'Financial', owner: '', status: 'On Track', keyResults: [] },
    ])

  const rmObj = (oi: number) => updateList(listState.filter((_, j) => j !== oi))

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {listState.map((obj, oi) => {
        const [pCol, pBg] = perspClr[obj.perspective] ?? [C.primary, C.primaryLight]
        return (
          <Card key={oi}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, color: C.primary }}>{obj.id}</span>
              <RmBtn onClick={() => rmObj(oi)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, marginBottom: 12 }}>
              <Field label="Objective" required value={obj.objective} onChange={v => updateObj(oi, 'objective', v)} placeholder="Aspirational goal…" />
              <Sel label="BSC Perspective" value={obj.perspective} onChange={v => updateObj(oi, 'perspective', v)} options={['Financial', 'Customer', 'Internal Process', 'Learning & Growth']} />
              <Field label="Owner" value={obj.owner} onChange={v => updateObj(oi, 'owner', v)} placeholder="Name / Team" />
              <Sel label="Status" value={obj.status} onChange={v => updateObj(oi, 'status', v)} options={['On Track', 'At Risk', 'Off Track']} />
            </div>

            <SL>Key Results</SL>
            {obj.keyResults.map((kr, ki) => (
              <div
                key={ki}
                style={{ background: pBg, border: `1px solid ${pCol}22`, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pCol }}>{kr.id}</span>
                  <RmBtn onClick={() => rmKr(oi, ki)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Key Result"  value={kr.result}  onChange={v => updateKr(oi, ki, 'result',  String(v))} placeholder="Measurable outcome…" />
                  <Field label="Target"      value={kr.target}  onChange={v => updateKr(oi, ki, 'target',  String(v))} placeholder="Target" />
                  <Field label="Current"     value={kr.current} onChange={v => updateKr(oi, ki, 'current', String(v))} placeholder="Current" />
                  <Field label="Unit"        value={kr.unit}    onChange={v => updateKr(oi, ki, 'unit',    String(v))} placeholder="%" />
                  <Field label="Weight %"    value={kr.weight}  onChange={v => updateKr(oi, ki, 'weight',  String(v))} placeholder="%" />
                </div>
              </div>
            ))}
            <button
              onClick={() => addKr(oi)}
              style={{
                background: 'none', border: `1.5px dashed ${pCol}`, color: pCol,
                borderRadius: 7, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 12,
              }}
            >
              + Add Key Result
            </button>
          </Card>
        )
      })}
      <AddBtn onClick={addObj} label="+ Add Objective" />
    </div>
  )
}
