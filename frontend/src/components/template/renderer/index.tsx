import React, { useState, useCallback } from 'react'
import { C, PT, FooterBtns } from '../shared'
import type { TemplateBody, TemplateUI, FieldDef, FormState, ListItem, SignatoryItem, WbsItem, PhaseItem, OkrObjective, BscObjective, SwotItem } from './types'
import { FieldRenderer }     from './FieldRenderer'
import { FormSection }       from './FormSection'
import { ScopeSection }      from './ScopeSection'
import { ClosureSection }    from './ClosureSection'
import { SignatorySection }  from './SignatorySection'
import { ListSection }       from './ListSection'
import { TableSection }      from './TableSection'
import { TabsSection }       from './TabsSection'
import { StatusSection }     from './StatusSection'
import { SwotSection }       from './SwotSection'
import { BscMapSection }     from './BscMapSection'
import { OkrSection }        from './OkrSection'
import { PhaseListSection }  from './PhaseListSection'
import { WbsSection }        from './WbsSection'

// Re-export FieldRenderer so downstream importers don't need to reach into sub-files
export { FieldRenderer }

// ─── State initialiser ────────────────────────────────────────────────────────

function initState(ui: TemplateUI): FormState {
  const s: FormState = {}

  const initField = (f: FieldDef) => {
    if (!(f.key in s)) {
      s[f.key] = f.default ?? (f.type === 'checkbox' ? false : f.type === 'toggle' ? (f.options?.[0] ?? '') : '')
    }
  }

  for (const section of ui.sections) {
    for (const f of section.fields ?? []) initField(f)
    for (const row of section.rows ?? []) for (const f of row.fields) initField(f)
    for (const f of section.scopeFields ?? []) { if (!(f.key in s)) s[f.key] = '' }
    for (const ci of section.closureItems ?? []) { if (!(ci.key in s)) s[ci.key] = '' }

    if (section.type === 'list') {
      if (section.listConfig) {
        s[section.id] = [{ ...section.listConfig.defaultItem, id: `${section.listConfig.idPrefix}-001` }] as ListItem[]
      } else if (section.fields) {
        const defaultItem = Object.fromEntries(section.fields.map(f => [f.key, f.default ?? ''])) as ListItem
        s[section.id] = [{ ...defaultItem, id: `${section.itemId ?? 'ITEM'}-001` }] as ListItem[]
      }
    }

    if (section.type === 'table') {
      s[section.id] = [{ id: '1', ...(section.defaultRow ?? {}) }] as ListItem[]
    }

    if (section.type === 'signatory') {
      s[section.id] = [{ name: '', role: '', date: '', approved: false }] as SignatoryItem[]
    }

    if (section.type === 'tabs') {
      for (const tab of section.tabs ?? []) {
        if (tab.listConfig) {
          s[tab.id] = [{ ...tab.listConfig.defaultItem, id: `${tab.listConfig.idPrefix}-001` }] as ListItem[]
        } else if (tab.fields) {
          const defaultItem = Object.fromEntries(tab.fields.map(f => [f.key, f.default ?? ''])) as ListItem
          s[tab.id] = [{ ...defaultItem, id: `${tab.itemId ?? 'ITEM'}-001` }] as ListItem[]
        }
      }
    }

    if (section.type === 'swot') {
      for (const q of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
        s[q] = [{ description: '', importance: 'Medium' }] as SwotItem[]
      }
    }

    if (section.type === 'bsc_map') {
      for (const p of section.perspectives ?? []) s[p.id] = [] as BscObjective[]
    }

    if (section.type === 'okr') {
      s[section.id] = [] as OkrObjective[]
    }

    if (section.type === 'phase_list') {
      s[section.id] = [
        { id: 'PH-01', phase: '', start: '', end: '', status: 'Not Started', keyActivities: '', milestones: '', benefits: '' },
      ] as PhaseItem[]
    }

    if (section.type === 'wbs') {
      s[section.id] = [
        { id: '1', wbsCode: '1.0', level: 1, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' },
        { id: '2', wbsCode: '1.1', level: 2, name: '', deliverable: '', owner: '', effort: '', status: 'Not Started' },
      ] as WbsItem[]
    }

    if (section.type === 'status') {
      if (section.progressKey && !(section.progressKey in s)) s[section.progressKey] = '0'
      if (section.statusKey   && !(section.statusKey   in s)) s[section.statusKey]   = 'On Track'
      for (const hk of section.healthKeys ?? []) { if (!(hk.key in s)) s[hk.key] = 'On Track' }
      if (section.budgetKeys) {
        if (!(section.budgetKeys.spent in s)) s[section.budgetKeys.spent] = ''
        if (!(section.budgetKeys.total in s)) s[section.budgetKeys.total] = ''
      }
    }
  }

  return s
}

// ─── Main renderer ────────────────────────────────────────────────────────────

interface TemplateBodyRendererProps {
  body: string | object
}

export function TemplateBodyRenderer({ body }: TemplateBodyRendererProps) {
  const parsed = (() => {
    try { return (typeof body === 'string' ? JSON.parse(body) : body) as TemplateBody }
    catch { return null }
  })()
  const ui = parsed?.ui ?? null

  const [state, setState] = useState<FormState>(() => ui ? initState(ui) : {})

  const update = useCallback((key: string, value: unknown) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateListKey = useCallback((key: string, items: unknown[]) => {
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
                listState={(state[section.id] as SignatoryItem[]) ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'list':
            return (
              <ListSection
                key={section.id}
                section={section}
                listState={(state[section.id] as ListItem[]) ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'table':
            return (
              <TableSection
                key={section.id}
                section={section}
                listState={(state[section.id] as ListItem[]) ?? []}
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
            return (
              <SwotSection
                key={section.id}
                section={section}
                state={state}
                updateListKey={(k, v) => updateListKey(k, v)}
              />
            )

          case 'bsc_map':
            return (
              <BscMapSection
                key={section.id}
                section={section}
                state={state}
                updateListKey={updateListKey}
              />
            )

          case 'okr':
            return (
              <OkrSection
                key={section.id}
                section={section}
                listState={(state[section.id] as OkrObjective[]) ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'phase_list':
            return (
              <PhaseListSection
                key={section.id}
                section={section}
                listState={(state[section.id] as PhaseItem[]) ?? []}
                updateList={items => updateListKey(section.id, items)}
              />
            )

          case 'wbs':
            return (
              <WbsSection
                key={section.id}
                section={section}
                listState={(state[section.id] as WbsItem[]) ?? []}
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
