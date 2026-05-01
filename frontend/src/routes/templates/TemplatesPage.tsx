import { useState } from 'react'
import { C } from '../../components/template/shared'
import { TemplateBodyRenderer } from '../../components/template/TemplateBodyRenderer'
import { useTemplateFamilies, useTemplates, useTemplateLatestVersion } from '../../lib/hooks/useTemplates'

export function TemplatesPage() {
  const { data: families, isLoading: familiesLoading } = useTemplateFamilies()

  // Track explicit user selections; fall back to first available when unset
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>()
  const [perFamilyTemplate, setPerFamilyTemplate] = useState<Record<string, string>>({})

  const activeFamilyId = selectedFamilyId ?? families?.[0]?.id

  const { data: templates, isLoading: templatesLoading } = useTemplates(
    activeFamilyId ? { family_id: activeFamilyId } : undefined
  )

  // Active template: explicit selection or first template for this family
  const activeTemplateId = activeFamilyId
    ? (perFamilyTemplate[activeFamilyId] ?? templates?.[0]?.template_id)
    : undefined

  const { data: latestVersion, isLoading: versionLoading } = useTemplateLatestVersion(activeTemplateId)

  const handleFamilyChange = (id: string) => {
    setSelectedFamilyId(id)
  }

  const handleTemplateChange = (templateId: string) => {
    if (!activeFamilyId) return
    setPerFamilyTemplate(prev => ({ ...prev, [activeFamilyId]: templateId }))
  }

  return (
    <div style={{
      background: C.pageBg,
      margin: '-24px',
      height: 'calc(100vh - 104px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header tabs — template families */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        flexShrink: 0,
        minHeight: 48,
        alignItems: 'flex-end',
      }}>
        {familiesLoading ? (
          <span style={{ padding: '12px 20px', color: C.textSub, fontSize: 13 }}>Loading…</span>
        ) : (
          families?.map(family => (
            <button
              key={family.id}
              onClick={() => handleFamilyChange(family.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: activeFamilyId === family.id ? 700 : 500,
                color: activeFamilyId === family.id ? C.primary : C.textSub,
                borderBottom: activeFamilyId === family.id
                  ? `2px solid ${C.primary}`
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {family.name} Templates
            </button>
          ))
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar — template list */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          background: '#fff',
          borderRight: `1px solid ${C.border}`,
          overflowY: 'auto',
          padding: '12px 0',
          height: '100%',
        }}>
          {templatesLoading ? (
            <div style={{ padding: '12px 18px', color: C.textSub, fontSize: 13 }}>Loading…</div>
          ) : !templates?.length ? (
            <div style={{ padding: '12px 18px', color: C.textMuted, fontSize: 13 }}>No templates found.</div>
          ) : (
            templates.map(template => {
              const isActive = activeTemplateId === template.template_id
              return (
                <button
                  key={template.template_id}
                  onClick={() => handleTemplateChange(template.template_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 18px',
                    border: 'none',
                    background: isActive ? C.sidebarActiveBg : 'transparent',
                    color: isActive ? C.sidebarActiveText : C.textSub,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderRight: isActive
                      ? `3px solid ${C.sidebarActiveBorder}`
                      : '3px solid transparent',
                    textAlign: 'left',
                    transition: 'all .12s',
                    lineHeight: 1.4,
                  }}
                >
                  {template.template_name}
                </button>
              )
            })
          )}
        </aside>

        {/* Main content — template body */}
        <main style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto',
          background: C.pageBg,
          height: '100%',
        }}>
          <div style={{ maxWidth: 920 }}>
            {versionLoading ? (
              <div style={{ color: C.textSub, padding: 60, textAlign: 'center', fontSize: 15 }}>
                Loading template…
              </div>
            ) : latestVersion?.template_body ? (
              <TemplateBodyRenderer
                key={activeTemplateId}
                body={latestVersion.template_body}
              />
            ) : activeTemplateId ? (
              <div style={{ color: C.textSub, padding: 60, textAlign: 'center', fontSize: 15 }}>
                No content available for this template.
              </div>
            ) : (
              <div style={{ color: C.textSub, padding: 60, textAlign: 'center', fontSize: 15 }}>
                Select a template from the sidebar.
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  )
}
