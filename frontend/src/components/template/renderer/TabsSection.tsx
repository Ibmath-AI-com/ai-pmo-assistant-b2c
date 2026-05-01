import { useState } from 'react'
import { C, SL } from '../shared'
import { ListSection } from './ListSection'
import type { Section, ListItem, FormState } from './types'

interface TabsSectionProps {
  section: Section
  state: FormState
  updateListKey: (key: string, items: ListItem[]) => void
}

export function TabsSection({ section, state, updateListKey }: TabsSectionProps) {
  const tabs = section.tabs ?? []
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  return (
    <div>
      {section.title && <div style={{ marginBottom: 12 }}><SL>{section.title}</SL></div>}

      {/* Tab bar */}
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

      {/* Active tab content */}
      {tabs.map(t => {
        if (activeTab !== t.id) return null
        const listState = (state[t.id] as ListItem[]) ?? []
        return (
          <ListSection
            key={t.id}
            section={{
              id: t.id,
              type: 'list',
              listConfig: t.listConfig,
              fields: t.fields,
              itemId: t.itemId,
              addLabel: t.addLabel,
              columns: t.columns,
            }}
            listState={listState}
            updateList={items => updateListKey(t.id, items)}
          />
        )
      })}
    </div>
  )
}
