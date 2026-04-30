import React, { useState, useEffect, useCallback } from 'react'
import { C, Field, Sel, Card, PT, SL, FooterBtns, Toggle, AddBtn, RmBtn, TW, TD } from './shared'

// ─── JSON schema types ────────────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'textarea' | 'select' | 'toggle' | 'range' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: string[]
  rows?: number
  default?: string | boolean
  small?: boolean
  span?: number   // grid column span (default 1)
}

interface RowDef {
  columns: number
  fields: FieldDef[]
}

interface TableColumn {
  key: string
  label: string
  type: 'text' | 'date' | 'select' | 'static' | 'range'
  options?: string[]
  width?: number
  static?: boolean
}

interface ClosureItem {
  key: string
  label: string
  color: 'green' | 'red' | 'yellow' | 'blue'
  rows?: number
  placeholder?: string
}

interface TabConfig {
  id: string
  label: string
  type?: string
  // old format
  listConfig?: ListConfig
  // new flat format
  addLabel?: string
  itemId?: string
  columns?: number
  fields?: FieldDef[]
}

interface ListConfig {
  idPrefix: string
  addLabel: string
  defaultItem: Record<string, any>
  itemLayout: RowDef[]
}

interface Section {
  id: string
  title?: string
  type: 'form' | 'list' | 'table' | 'scope' | 'closure' | 'signatory' | 'tabs' | 'swot' | 'status' | 'bsc_map' | 'phase_list' | 'okr' | 'wbs'
  // form
  columns?: number
  fields?: FieldDef[]
  rows?: RowDef[]
  // list — old format
  listConfig?: ListConfig
  // list — new flat format
  itemId?: string
  // tabs
  tabs?: TabConfig[]
  // table
  tableColumns?: TableColumn[]
  defaultRow?: Record<string, any>
  addLabel?: string
  // scope
  scopeFields?: { key: string; label: string; rows?: number; placeholder?: string }[]
  // closure
  closureItems?: ClosureItem[]
  closureColumns?: number   // default 2
  // bsc_map: uses fields grouped by perspective
  perspectives?: { id: string; label: string; color: string; bg: string }[]
  // status: progress + status toggles + health indicators
  progressKey?: string
  statusKey?: string
  healthKeys?: { label: string; key: string }[]
  budgetKeys?: { spent: string; total: string }
  // phase_list section
  phaseFields?: RowDef[]
  phaseAddLabel?: string
}

interface TemplateUI {
  title?: string
  subtitle?: string
  submitLabel?: string
  saveLabel?: string
  sections: Section[]
}

interface TemplateBody {
  ui: TemplateUI
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

const colorMap: Record<string, { color: string; bg: string; border: string }> = {
  green: { color: C.green, bg: C.greenBg, border: `${C.green}22` },
  red: { color: C.red, bg: C.redBg, border: `${C.red}22` },
  yellow: { color: C.yellow, bg: C.yellowBg, border: `${C.yellow}22` },
  blue: { color: C.blue, bg: C.blueBg, border: `${C.blue}22` },
}

// ─── Field renderer ───────────────────────────────────────────────────────────

interface FieldRendererProps {
  def: FieldDef
  value: any
  onChange: (v: any) => void
}

function FieldRenderer({ def, value, onChange }: FieldRendererProps) {
  const val = value ?? def.default ?? ''

  if (def.type === 'select') {
    return (
      <Sel
        label={def.label}
        value={val}
        onChange={onChange}
        options={def.options ?? []}
        placeholder={def.placeholder}
        required={def.required}
      />
    )
  }

  if (def.type === 'toggle') {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          {def.label}{def.required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
        </div>
        <Toggle
          options={def.options ?? []}
          value={val}
          onChange={onChange}
          small={def.small}
        />
      </div>
    )
  }

  if (def.type === 'range') {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{def.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{val}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={val}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', accentColor: C.primary }}
        />
      </div>
    )
  }

  if (def.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={!!val}
          onChange={e => onChange(e.target.checked)}
          style={{ accentColor: C.primary }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{def.label}</span>
      </div>
    )
  }

  return (
    <Field
      label={def.label}
      value={val}
      onChange={onChange}
      type={def.type === 'date' ? 'date' : 'text'}
      multiline={def.type === 'textarea'}
      rows={def.rows ?? 3}
      placeholder={def.placeholder}
      required={def.required}
    />
  )
}

// ─── Grid row renderer ────────────────────────────────────────────────────────

function GridRow({ rowDef, state, update }: {
  rowDef: RowDef
  state: Record<string, any>
  update: (key: string, v: any) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rowDef.columns}, 1fr)`, gap: 14, marginBottom: 4 }}>
      {rowDef.fields.map(f => (
        <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
          <FieldRenderer def={f} value={state[f.key]} onChange={v => update(f.key, v)} />
        </div>
      ))}
    </div>
  )
}

// ─── Section: form ────────────────────────────────────────────────────────────

function FormSection({ section, state, update }: {
  section: Section
  state: Record<string, any>
  update: (key: string, v: any) => void
}) {
  const content = section.rows
    ? section.rows.map((row, ri) => <GridRow key={ri} rowDef={row} state={state} update={update} />)
    : (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.columns ?? 1}, 1fr)`, gap: 14 }}>
        {(section.fields ?? []).map(f => (
          <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
            <FieldRenderer def={f} value={state[f.key]} onChange={v => update(f.key, v)} />
          </div>
        ))}
      </div>
    )

  if (!section.title) return <Card>{content}</Card>

  return (
    <Card>
      <SL>{section.title}</SL>
      {content}
    </Card>
  )
}

// ─── Section: scope ───────────────────────────────────────────────────────────

function ScopeSection({ section, state, update }: {
  section: Section
  state: Record<string, any>
  update: (key: string, v: any) => void
}) {
  const fields = section.scopeFields ?? []
  const colors = [
    { color: C.green, bg: C.greenBg, emoji: '✔' },
    { color: C.red, bg: C.redBg, emoji: '✕' },
  ]

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${fields.length}, 1fr)`, gap: 14 }}>
        {fields.map((f, i) => {
          const c = colors[i] ?? colors[0]
          return (
            <div key={f.key}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 6 }}>
                {c.emoji} {f.label}
              </div>
              <textarea
                rows={f.rows ?? 5}
                value={state[f.key] ?? ''}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '10px 14px', border: `1.5px solid ${c.color}44`,
                  borderRadius: 8, background: c.bg, fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', color: C.text,
                }}
              />
            </div>
          )
        })}
      </div>
      {/* Any remaining form fields after scope */}
      {(section.fields ?? []).map(f => (
        <div key={f.key} style={{ marginTop: 14 }}>
          <FieldRenderer def={f} value={state[f.key]} onChange={v => update(f.key, v)} />
        </div>
      ))}
    </Card>
  )
}

// ─── Section: closure ─────────────────────────────────────────────────────────

function ClosureSection({ section, state, update }: {
  section: Section
  state: Record<string, any>
  update: (key: string, v: any) => void
}) {
  const items = section.closureItems ?? []
  const cols = section.closureColumns ?? 2

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {items.map(item => {
          const clr = colorMap[item.color]
          return (
            <div key={item.key} style={{ background: clr.bg, borderRadius: 10, padding: 14, border: `1px solid ${clr.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: clr.color, marginBottom: 8 }}>{item.label}</div>
              <textarea
                rows={item.rows ?? 4}
                value={state[item.key] ?? ''}
                onChange={e => update(item.key, e.target.value)}
                placeholder={item.placeholder}
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', color: C.text }}
              />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Section: signatory ───────────────────────────────────────────────────────

function SignatorySection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const items: Array<{ name: string; role: string; date: string; approved: boolean }> = listState

  const updateItem = (i: number, k: string, v: any) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addItem = () => updateList([...items, { name: '', role: '', date: '', approved: false }])
  const removeItem = (i: number) => updateList(items.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {items.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: 12, background: '#F8FAFF', borderRadius: 8, border: `1px solid ${C.border}` }}>
          <button
            onClick={() => updateItem(i, 'approved', !s.approved)}
            style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${s.approved ? C.green : C.border}`, background: s.approved ? C.greenBg : '#fff', color: s.approved ? C.green : C.textMuted, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}
          >
            {s.approved ? '✔' : ''}
          </button>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input value={s.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Full Name" style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <input value={s.role} onChange={e => updateItem(i, 'role', e.target.value)} placeholder="Role / Title" style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <input type="date" value={s.date} onChange={e => updateItem(i, 'date', e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <RmBtn onClick={() => removeItem(i)} />
        </div>
      ))}
      <AddBtn onClick={addItem} label="+ Add Signatory" />
    </Card>
  )
}

// ─── Section: list ────────────────────────────────────────────────────────────

function ListSection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const cfg = section.listConfig
  const idPrefix   = cfg?.idPrefix  ?? section.itemId  ?? 'ITEM'
  const addLabel   = cfg?.addLabel  ?? section.addLabel ?? '+ Add Item'
  const defaultItem = cfg
    ? cfg.defaultItem
    : Object.fromEntries((section.fields ?? []).map(f => [f.key, f.default ?? '']))
  const items: any[] = listState

  const updateItem = (i: number, k: string, v: any) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addItem = () => {
    const n = items.length + 1
    const id = `${idPrefix}-${String(n).padStart(3, '0')}`
    updateList([...items, { ...defaultItem, id }])
  }

  const removeItem = (i: number) => updateList(items.filter((_, j) => j !== i))

  // Render fields: old format uses cfg.itemLayout (explicit rows), new uses flat fields + columns grid
  const renderItemFields = (item: any, i: number) => {
    if (cfg?.itemLayout) {
      return cfg.itemLayout.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.columns}, 1fr)`, gap: 14, marginBottom: 4 }}>
          {row.fields.map(f => (
            <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
              <FieldRenderer def={f} value={item[f.key]} onChange={v => updateItem(i, f.key, v)} />
            </div>
          ))}
        </div>
      ))
    }
    // new flat format
    const cols = section.columns ?? 2
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {(section.fields ?? []).map(f => (
          <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : undefined}>
            <FieldRenderer def={f} value={item[f.key]} onChange={v => updateItem(i, f.key, v)} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {items.map((item, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, color: C.primary }}>{item.id}</span>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
          {renderItemFields(item, i)}
        </Card>
      ))}
      <AddBtn onClick={addItem} label={addLabel} />
    </div>
  )
}

// ─── Section: table ───────────────────────────────────────────────────────────

function TableSection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const cols = section.tableColumns ?? []
  const rows: any[] = listState
  const addLabel = section.addLabel ?? '+ Add Row'
  const defaultRow = section.defaultRow ?? {}

  const updateRow = (i: number, k: string, v: any) => {
    const updated = [...rows]
    updated[i] = { ...updated[i], [k]: v }
    updateList(updated)
  }

  const addRow = () => {
    const n = rows.length + 1
    updateList([...rows, { id: String(n), ...defaultRow }])
  }

  const removeRow = (i: number) => updateList(rows.filter((_, j) => j !== i))

  const inputStyle: React.CSSProperties = {
    border: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 60, width: '100%',
  }
  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 6px', fontSize: 11, fontFamily: 'inherit',
  }

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <TW
        headers={cols.map(c => c.label)}
        rows={rows.map((row, i) => [
          ...cols.map(c => {
            if (c.static) return <TD key={c.key} sx={{ fontWeight: 700, color: C.primary, fontSize: 11 }}>{row[c.key]}</TD>
            if (c.type === 'select') return (
              <TD key={c.key}>
                <select value={row[c.key] ?? ''} onChange={e => updateRow(i, c.key, e.target.value)} style={selectStyle}>
                  {(c.options ?? []).map(o => <option key={o}>{o}</option>)}
                </select>
              </TD>
            )
            if (c.type === 'date') return (
              <TD key={c.key}>
                <input type="date" value={row[c.key] ?? ''} onChange={e => updateRow(i, c.key, e.target.value)} style={{ ...selectStyle, width: undefined }} />
              </TD>
            )
            if (c.type === 'range') return (
              <TD key={c.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="range" min="0" max="100" value={row[c.key] ?? '0'} onChange={e => updateRow(i, c.key, e.target.value)} style={{ width: 70 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, minWidth: 32 }}>{row[c.key] ?? 0}%</span>
                </div>
              </TD>
            )
            return (
              <TD key={c.key}>
                <input value={row[c.key] ?? ''} onChange={e => updateRow(i, c.key, e.target.value)} placeholder={c.label} style={{ ...inputStyle, width: c.width ?? undefined }} />
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

// ─── Section: tabs (RAID) ─────────────────────────────────────────────────────

function TabsSection({ section, state, updateListKey }: {
  section: Section
  state: Record<string, any>
  updateListKey: (key: string, items: any[]) => void
}) {
  const tabs = section.tabs ?? []
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? C.primary : C.textSub,
              fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map(t => {
        if (activeTab !== t.id) return null
        const listState = (state[t.id] ?? []) as any[]
        return (
          <ListSection
            key={t.id}
            section={{
              id: t.id, type: 'list',
              listConfig: t.listConfig,
              fields: t.fields, itemId: t.itemId,
              addLabel: t.addLabel, columns: t.columns,
            }}
            listState={listState}
            updateList={items => updateListKey(t.id, items)}
          />
        )
      })}
    </div>
  )
}

// ─── Section: status (progress + health) ─────────────────────────────────────

function StatusSection({ section, state, update }: {
  section: Section
  state: Record<string, any>
  update: (key: string, v: any) => void
}) {
  const statusColors: Record<string, string> = { 'On Track': C.green, 'At Risk': C.yellow, 'Off Track': C.red }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
      <Card>
        <SL>Overall Status</SL>
        {section.progressKey && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: C.primary, lineHeight: 1 }}>{state[section.progressKey] ?? 0}%</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>Complete</div>
            <input type="range" min="0" max="100" value={state[section.progressKey] ?? 0} onChange={e => update(section.progressKey!, e.target.value)} style={{ width: '100%', marginTop: 8 }} />
          </div>
        )}
        {section.statusKey && ['On Track', 'At Risk', 'Off Track'].map(s => (
          <button key={s} onClick={() => update(section.statusKey!, s)} style={{ display: 'block', width: '100%', marginBottom: 6, padding: 9, borderRadius: 8, border: `2px solid ${state[section.statusKey!] === s ? statusColors[s] : C.border}`, background: state[section.statusKey!] === s ? statusColors[s] + '18' : '#fff', color: state[section.statusKey!] === s ? statusColors[s] : C.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>{s}</button>
        ))}
      </Card>
      <Card>
        <SL>Health Indicators</SL>
        {(section.healthKeys ?? []).map(({ label, key }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120 }}>{label}</span>
            <Toggle small options={['On Track', 'At Risk', 'Off Track']} value={state[key] ?? 'On Track'} onChange={v => update(key, v)} />
          </div>
        ))}
        {section.budgetKeys && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <Field label="Budget Spent ($)" value={state[section.budgetKeys.spent] ?? ''} onChange={v => update(section.budgetKeys!.spent, v)} placeholder="0" />
            <Field label="Total Budget ($)" value={state[section.budgetKeys.total] ?? ''} onChange={v => update(section.budgetKeys!.total, v)} placeholder="0" />
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Section: swot ────────────────────────────────────────────────────────────

function SwotSection({ section, state, updateListKey }: {
  section: Section
  state: Record<string, any>
  updateListKey: (key: string, items: any[]) => void
}) {
  const quadrants = [
    { id: 'strengths', label: 'Strengths', color: C.green, bg: C.greenBg, prompt: 'Internal positive factors…' },
    { id: 'weaknesses', label: 'Weaknesses', color: C.red, bg: C.redBg, prompt: 'Internal negative factors…' },
    { id: 'opportunities', label: 'Opportunities', color: C.blue, bg: C.blueBg, prompt: 'External positive factors…' },
    { id: 'threats', label: 'Threats', color: C.orange, bg: C.orangeBg, prompt: 'External negative factors…' },
  ]

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {quadrants.map(q => {
          const items: any[] = state[q.id] ?? []
          const updateItem = (i: number, k: string, v: any) => {
            const updated = [...items]
            updated[i] = { ...updated[i], [k]: v }
            updateListKey(q.id, updated)
          }
          const addItem = () => updateListKey(q.id, [...items, { description: '', importance: 'Medium', bscLink: '' }])
          const removeItem = (i: number) => updateListKey(q.id, items.filter((_, j) => j !== i))

          return (
            <div key={q.id} style={{ background: q.bg, borderRadius: 10, padding: 16, border: `1px solid ${q.color}22` }}>
              <div style={{ fontWeight: 700, color: q.color, fontSize: 14, marginBottom: 10 }}>{q.label}</div>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <textarea value={it.description ?? ''} onChange={e => updateItem(i, 'description', e.target.value)} rows={2}
                    placeholder={`Describe this ${q.label.toLowerCase().slice(0, -1)}…`}
                    style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', fontSize: 13, fontFamily: 'inherit', color: C.text, outline: 'none' }} />
                  <RmBtn onClick={() => removeItem(i)} />
                </div>
              ))}
              <button onClick={addItem} style={{ background: 'none', border: `1.5px dashed ${q.color}`, color: q.color, borderRadius: 7, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 12, width: '100%', marginTop: 4 }}>+ Add</button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Section: bsc_map (BSC perspective-grouped objectives) ────────────────────

function BscMapSection({ section, state, updateListKey }: {
  section: Section
  state: Record<string, any>
  updateListKey: (key: string, items: any[]) => void
}) {
  const perspectives = section.perspectives ?? [
    { id: 'financial', label: 'Financial', color: C.blue, bg: C.blueBg },
    { id: 'customer', label: 'Customer', color: C.green, bg: C.greenBg },
    { id: 'process', label: 'Internal Process', color: C.orange, bg: C.orangeBg },
    { id: 'learning', label: 'Learning & Growth', color: C.teal, bg: C.tealBg },
  ]

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {perspectives.map(p => {
        const items: any[] = state[p.id] ?? []
        const updateItem = (i: number, k: string, v: any) => {
          const updated = [...items]
          updated[i] = { ...updated[i], [k]: v }
          updateListKey(p.id, updated)
        }
        const addItem = () => updateListKey(p.id, [...items, { id: `SO-${String(items.length + 1).padStart(3, '0')}`, perspective: p.id, objective: '', description: '', cause: '' }])
        const removeItem = (i: number) => updateListKey(p.id, items.filter((_, j) => j !== i))

        return (
          <Card key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: p.color }} />
              <SL>{p.label} Perspective</SL>
            </div>
            {items.map((o, i) => (
              <div key={i} style={{ background: p.bg, border: `1px solid ${p.color}22`, borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: p.color, fontSize: 12 }}>{o.id}</span>
                  <RmBtn onClick={() => removeItem(i)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Strategic Objective" required value={o.objective ?? ''} onChange={v => updateItem(i, 'objective', v)} placeholder="Objective name" />
                  <Field label="Description" value={o.description ?? ''} onChange={v => updateItem(i, 'description', v)} placeholder="What this means…" />
                  <Field label="Linked Objectives (IDs)" value={o.cause ?? ''} onChange={v => updateItem(i, 'cause', v)} placeholder="e.g. SO-003, SO-004" />
                </div>
              </div>
            ))}
            <button onClick={addItem} style={{ background: 'none', border: `1.5px dashed ${p.color}`, color: p.color, borderRadius: 7, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 12, marginTop: 4 }}>+ Add {p.label} Objective</button>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Section: okr ─────────────────────────────────────────────────────────────

function OkrSection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const perspClr: Record<string, [string, string]> = {
    Financial: [C.blue, C.blueBg],
    Customer: [C.green, C.greenBg],
    'Internal Process': [C.orange, C.orangeBg],
    'Learning & Growth': [C.teal, C.tealBg],
  }

  const objectives: any[] = listState

  const updateObj = (oi: number, k: string, v: any) => {
    const n = [...objectives]; n[oi] = { ...n[oi], [k]: v }; updateList(n)
  }
  const addKr = (oi: number) => {
    const n = [...objectives]
    const krs = [...n[oi].keyResults, { id: `KR-${String(oi + 1).padStart(3, '0')}-${n[oi].keyResults.length + 1}`, result: '', target: '', current: '', unit: '', weight: '' }]
    n[oi] = { ...n[oi], keyResults: krs }; updateList(n)
  }
  const updateKr = (oi: number, ki: number, k: string, v: any) => {
    const n = [...objectives]; const krs = [...n[oi].keyResults]; krs[ki] = { ...krs[ki], [k]: v }
    n[oi] = { ...n[oi], keyResults: krs }; updateList(n)
  }
  const rmKr = (oi: number, ki: number) => {
    const n = [...objectives]; n[oi] = { ...n[oi], keyResults: n[oi].keyResults.filter((_: any, j: number) => j !== ki) }; updateList(n)
  }
  const addObj = () => updateList([...objectives, { id: `O-${String(objectives.length + 1).padStart(3, '0')}`, objective: '', perspective: 'Financial', owner: '', status: 'On Track', keyResults: [] }])
  const rmObj = (oi: number) => updateList(objectives.filter((_, j) => j !== oi))

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}
      {objectives.map((obj, oi) => {
        const [pCol, pBg] = perspClr[obj.perspective] ?? [C.primary, C.primaryLight]
        return (
          <Card key={oi}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, color: C.primary }}>{obj.id}</span>
              <RmBtn onClick={() => rmObj(oi)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14, marginBottom: 12 }}>
              <Field label="Objective" required value={obj.objective ?? ''} onChange={v => updateObj(oi, 'objective', v)} placeholder="Aspirational goal…" />
              <Sel label="BSC Perspective" value={obj.perspective ?? 'Financial'} onChange={v => updateObj(oi, 'perspective', v)} options={['Financial', 'Customer', 'Internal Process', 'Learning & Growth']} />
              <Field label="Owner" value={obj.owner ?? ''} onChange={v => updateObj(oi, 'owner', v)} placeholder="Name / Team" />
              <Sel label="Status" value={obj.status ?? 'On Track'} onChange={v => updateObj(oi, 'status', v)} options={['On Track', 'At Risk', 'Off Track']} />
            </div>
            <SL>Key Results</SL>
            {(obj.keyResults ?? []).map((kr: any, ki: number) => (
              <div key={ki} style={{ background: pBg, border: `1px solid ${pCol}22`, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pCol }}>{kr.id}</span>
                  <RmBtn onClick={() => rmKr(oi, ki)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 10 }}>
                  <Field label="Key Result" value={kr.result ?? ''} onChange={v => updateKr(oi, ki, 'result', v)} placeholder="Measurable outcome…" />
                  <Field label="Target" value={kr.target ?? ''} onChange={v => updateKr(oi, ki, 'target', v)} placeholder="Target" />
                  <Field label="Current" value={kr.current ?? ''} onChange={v => updateKr(oi, ki, 'current', v)} placeholder="Current" />
                  <Field label="Unit" value={kr.unit ?? ''} onChange={v => updateKr(oi, ki, 'unit', v)} placeholder="%" />
                  <Field label="Weight %" value={kr.weight ?? ''} onChange={v => updateKr(oi, ki, 'weight', v)} placeholder="%" />
                </div>
              </div>
            ))}
            <button onClick={() => addKr(oi)} style={{ background: 'none', border: `1.5px dashed ${pCol}`, color: pCol, borderRadius: 7, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>+ Add Key Result</button>
          </Card>
        )
      })}
      <AddBtn onClick={addObj} label="+ Add Objective" />
    </div>
  )
}

// ─── Section: phase_list (Program Roadmap phases) ─────────────────────────────

function PhaseListSection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const items: any[] = listState
  const phaseFields = section.phaseFields ?? []
  const addLabel = section.phaseAddLabel ?? '+ Add Phase'

  const updateItem = (i: number, k: string, v: any) => {
    const updated = [...items]; updated[i] = { ...updated[i], [k]: v }; updateList(updated)
  }
  const addItem = () => updateList([...items, { id: `PH-${String(items.length + 1).padStart(2, '0')}`, phase: '', start: '', end: '', status: 'Not Started', keyActivities: '', milestones: '', benefits: '' }])
  const removeItem = (i: number) => updateList(items.filter((_, j) => j !== i))

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {items.map((item, i) => (
        <div key={i} style={{ background: '#F8FAFF', borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, color: C.primary }}>{item.id}</span>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
          {phaseFields.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.columns}, 1fr)`, gap: 12, marginBottom: 4 }}>
              {row.fields.map(f => (
                <FieldRenderer key={f.key} def={f} value={item[f.key]} onChange={v => updateItem(i, f.key, v)} />
              ))}
            </div>
          ))}
        </div>
      ))}
      <AddBtn onClick={addItem} label={addLabel} />
    </Card>
  )
}

// ─── Section: wbs ─────────────────────────────────────────────────────────────

function WbsSection({ section, listState, updateList }: {
  section: Section
  listState: any[]
  updateList: (items: any[]) => void
}) {
  const items: any[] = listState
  const levelColors: Record<number, { bg: string; col: string }> = {
    1: { bg: '#1D4ED8', col: '#fff' },
    2: { bg: C.blueBg, col: C.blue },
    3: { bg: C.purpleBg, col: C.purple },
    4: { bg: '#F0FDF4', col: C.green },
  }

  const updateItem = (i: number, k: string, v: any) => {
    const updated = [...items]; updated[i] = { ...updated[i], [k]: v }; updateList(updated)
  }
  const addItem = (level: number) => {
    updateList([...items, { id: String(Date.now()), wbsCode: '', level, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' }])
  }
  const removeItem = (i: number) => updateList(items.filter((_, j) => j !== i))

  const inputStyle: React.CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }

  return (
    <Card>
      {section.title && <SL>{section.title}</SL>}
      {items.map((item, i) => {
        const lc = levelColors[item.level] ?? { bg: '#F3F4F6', col: C.textSub }
        return (
          <div key={i} style={{ marginLeft: (item.level - 1) * 32, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: lc.bg, color: lc.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>L{item.level}</div>
            <div style={{ flex: 1, background: '#F8FAFF', borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                <input value={item.wbsCode ?? ''} onChange={e => updateItem(i, 'wbsCode', e.target.value)} placeholder="WBS #" style={{ ...inputStyle, fontWeight: 700, color: C.primary }} />
                <input value={item.name ?? ''} onChange={e => updateItem(i, 'name', e.target.value)} placeholder={item.level === 1 ? 'Phase Name' : item.level === 2 ? 'Work Package' : 'Activity'} style={{ ...inputStyle, fontWeight: item.level === 1 ? 700 : 400 }} />
                <input value={item.deliverable ?? ''} onChange={e => updateItem(i, 'deliverable', e.target.value)} placeholder="Deliverable" style={inputStyle} />
                <input value={item.owner ?? ''} onChange={e => updateItem(i, 'owner', e.target.value)} placeholder="Owner" style={inputStyle} />
                <input value={item.effort ?? ''} onChange={e => updateItem(i, 'effort', e.target.value)} placeholder="Days" style={inputStyle} />
                <select value={item.status ?? 'Not Started'} onChange={e => updateItem(i, 'status', e.target.value)} style={{ ...inputStyle, fontSize: 11 }}>
                  {['Not Started', 'In Progress', 'Completed', 'On Hold'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <RmBtn onClick={() => removeItem(i)} />
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(level => <AddBtn key={level} onClick={() => addItem(level)} label={`+ Level ${level}`} />)}
      </div>
    </Card>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────

interface TemplateBodyRendererProps {
  body: string | object
}

function initState(ui: TemplateUI): Record<string, any> {
  const s: Record<string, any> = {}

  const initField = (f: FieldDef) => {
    if (!(f.key in s)) {
      s[f.key] = f.default ?? (f.type === 'checkbox' ? false : f.type === 'toggle' ? (f.options?.[0] ?? '') : '')
    }
  }

  for (const section of ui.sections) {
    // form fields
    for (const f of section.fields ?? []) initField(f)
    for (const row of section.rows ?? []) for (const f of row.fields) initField(f)
    // scope fields (just the textarea values)
    for (const f of section.scopeFields ?? []) { if (!(f.key in s)) s[f.key] = '' }
    // closure items
    for (const ci of section.closureItems ?? []) { if (!(ci.key in s)) s[ci.key] = '' }

    // lists
    if (section.type === 'list') {
      if (section.listConfig) {
        s[section.id] = [{ ...section.listConfig.defaultItem, id: `${section.listConfig.idPrefix}-001` }]
      } else if (section.fields) {
        const defaultItem = Object.fromEntries(section.fields.map(f => [f.key, f.default ?? '']))
        s[section.id] = [{ ...defaultItem, id: `${section.itemId ?? 'ITEM'}-001` }]
      }
    }
    if (section.type === 'table') {
      const defaultRow = section.defaultRow ?? {}
      s[section.id] = [{ id: '1', ...defaultRow }]
    }
    if (section.type === 'signatory') {
      s[section.id] = [{ name: '', role: '', date: '', approved: false }]
    }
    if (section.type === 'tabs') {
      for (const tab of section.tabs ?? []) {
        if (tab.listConfig) {
          s[tab.id] = [{ ...tab.listConfig.defaultItem, id: `${tab.listConfig.idPrefix}-001` }]
        } else if (tab.fields) {
          const defaultItem = Object.fromEntries(tab.fields.map(f => [f.key, f.default ?? '']))
          s[tab.id] = [{ ...defaultItem, id: `${tab.itemId ?? 'ITEM'}-001` }]
        }
      }
    }
    if (section.type === 'swot') {
      for (const q of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
        s[q] = [{ description: '', importance: 'Medium' }]
      }
    }
    if (section.type === 'bsc_map') {
      for (const p of section.perspectives ?? []) s[p.id] = []
    }
    if (section.type === 'okr') {
      s[section.id] = []
    }
    if (section.type === 'phase_list') {
      s[section.id] = [{ id: 'PH-01', phase: '', start: '', end: '', status: 'Not Started', keyActivities: '', milestones: '', benefits: '' }]
    }
    if (section.type === 'wbs') {
      s[section.id] = [
        { id: '1', wbsCode: '1.0', level: 1, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' },
        { id: '2', wbsCode: '1.1', level: 2, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' },
      ]
    }

    // status section health keys init
    if (section.type === 'status') {
      if (section.progressKey && !(section.progressKey in s)) s[section.progressKey] = '0'
      if (section.statusKey && !(section.statusKey in s)) s[section.statusKey] = 'On Track'
      for (const hk of section.healthKeys ?? []) { if (!(hk.key in s)) s[hk.key] = 'On Track' }
      if (section.budgetKeys) {
        if (!(section.budgetKeys.spent in s)) s[section.budgetKeys.spent] = ''
        if (!(section.budgetKeys.total in s)) s[section.budgetKeys.total] = ''
      }
    }
  }

  return s
}

export function TemplateBodyRenderer({ body }: TemplateBodyRendererProps) {
  const parsed = (() => { try { return (typeof body === 'string' ? JSON.parse(body) : body) as TemplateBody } catch { return null } })()
  const ui: TemplateUI | null = parsed?.ui ?? null

  const [state, setState] = useState<Record<string, any>>(() => ui ? initState(ui) : {})

  useEffect(() => {
    if (ui) setState(initState(ui))
  }, [body])

  const update = useCallback((key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateListKey = useCallback((key: string, items: any[]) => {
    setState(prev => ({ ...prev, [key]: items }))
  }, [])

  if (!ui) {
    return (
      <div style={{ padding: 40, color: C.textSub, textAlign: 'center' }}>
        Could not parse template content.
      </div>
    )
  }

  return (
    <div>
      {ui.title && <PT sub={ui.subtitle}>{ui.title}</PT>}

      {ui.sections.map(section => {
        switch (section.type) {
          case 'form':
            return <FormSection key={section.id} section={section} state={state} update={update} />

          case 'scope':
            return <ScopeSection key={section.id} section={section} state={state} update={update} />

          case 'closure':
            return <ClosureSection key={section.id} section={section} state={state} update={update} />

          case 'signatory':
            return (
              <SignatorySection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'list':
            return (
              <ListSection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'table':
            return (
              <TableSection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'tabs':
            return (
              <TabsSection
                key={section.id}
                section={section}
                state={state}
                updateListKey={updateListKey}
              />
            )

          case 'status':
            return <StatusSection key={section.id} section={section} state={state} update={update} />

          case 'swot':
            return <SwotSection key={section.id} section={section} state={state} updateListKey={(k, v) => updateListKey(k, v)} />

          case 'bsc_map':
            return <BscMapSection key={section.id} section={section} state={state} updateListKey={updateListKey} />

          case 'okr':
            return (
              <OkrSection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'phase_list':
            return (
              <PhaseListSection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'wbs':
            return (
              <WbsSection
                key={section.id}
                section={section}
                listState={state[section.id] ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          default:
            return null
        }
      })}

      <FooterBtns saveLabel={ui.saveLabel ?? 'Save Draft'} submitLabel={ui.submitLabel ?? 'Submit'} />
    </div>
  )
}
