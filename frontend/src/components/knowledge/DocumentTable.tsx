import { useState } from 'react'
import { appTheme } from '@/lib/theme'
import type { DocumentListItem, KnowledgeCollection } from '@/lib/api/knowledge'
import { ClassificationBadge } from './ClassificationBadge'
import { StatusBadge } from './StatusBadge'

interface DocumentTableProps {
  documents: DocumentListItem[]
  collections: KnowledgeCollection[]
  isLoading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onActivate: (id: string) => void
  onDeactivate: (id: string) => void
  onReindex: (id: string) => void
  onDelete: (id: string) => void
}

function truncateId(id: string) {
  return id.slice(0, 8) + '…'
}

function getTagsByType(tags: DocumentListItem['tags'] | undefined | null, type: string) {
  return (tags ?? []).filter((t) => t.tag_type === type && t.status === 'active')
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: appTheme.textSecondary,
  backgroundColor: '#F8FAFC',
  borderBottom: `1px solid ${appTheme.border}`,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: '13px',
  color: appTheme.textPrimary,
  borderBottom: `1px solid ${appTheme.border}`,
  verticalAlign: 'middle',
}

function InlineTag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: 500, backgroundColor: bg, color }}>
      {label}
    </span>
  )
}

function ActionsMenu({
  status, onView, onEdit, onActivate, onDeactivate, onReindex, onDelete,
}: {
  status: string
  onView: () => void
  onEdit: () => void
  onActivate: () => void
  onDeactivate: () => void
  onReindex: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const items = [
    { label: 'View Document', action: onView },
    { label: 'Update Settings', action: onEdit },
    ...(status === 'active'
      ? [{ label: 'Deactivate', action: onDeactivate }]
      : [{ label: 'Activate', action: onActivate }]),
    { label: 'Reindex', action: onReindex },
    { label: 'Delete', action: onDelete, danger: true },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: open ? '#F1F5F9' : 'transparent',
          cursor: 'pointer',
          color: appTheme.textSecondary,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = open ? '#F1F5F9' : 'transparent')}
      >
        ⋯
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: '32px',
              right: 0,
              backgroundColor: appTheme.cardBg,
              border: `1px solid ${appTheme.border}`,
              borderRadius: appTheme.radiusCard,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              padding: '4px 0',
              minWidth: '150px',
              zIndex: 20,
            }}
          >
            {items.map(({ label, action, danger }) => (
              <button
                key={label}
                type="button"
                onClick={() => { action(); setOpen(false) }}
                onMouseEnter={() => setHovered(label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 16px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  color: danger ? appTheme.danger : appTheme.textSubtle,
                  backgroundColor: hovered === label ? '#F1F5F9' : 'transparent',
                  fontFamily: appTheme.font,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function DocumentTable({
  documents,
  collections,
  isLoading,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onReindex,
  onDelete,
}: DocumentTableProps) {
  const collectionMap = new Map(collections.map((c) => [c.knowledge_collection_id, c.collection_name]))

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: appTheme.cardBg,
          border: `1px solid ${appTheme.border}`,
          borderRadius: appTheme.radiusCard,
          padding: '32px',
          textAlign: 'center',
          fontSize: '13px',
          color: appTheme.textSecondary,
          fontFamily: appTheme.font,
        }}
      >
        Loading documents…
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div
        style={{
          backgroundColor: appTheme.cardBg,
          border: `1px solid ${appTheme.border}`,
          borderRadius: appTheme.radiusCard,
          padding: '32px',
          textAlign: 'center',
          fontSize: '13px',
          color: appTheme.textSecondary,
          fontFamily: appTheme.font,
        }}
      >
        No records found.
      </div>
    )
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: appTheme.radiusCard,
        border: `1px solid ${appTheme.border}`,
        fontFamily: appTheme.font,
      }}
    >
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', backgroundColor: appTheme.cardBg, fontSize: '13px' }}>
        <thead>
          <tr>
            {['ID', 'Document Title', 'KB Collection', 'Classification', 'SDLC', 'Domain', 'Persona(s)', 'Status', ''].map(
              (col) => <th key={col} style={thStyle}>{col}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const sdlcTags = getTagsByType(doc.tags, 'sdlc')
            const domainTags = getTagsByType(doc.tags, 'domain')
            const personaTags = (doc.tags ?? []).filter(
              (t) => t.tag_name.startsWith('persona:') && t.status === 'active'
            )
            const collectionName =
              collectionMap.get(doc.knowledge_collection_id) ?? truncateId(doc.knowledge_collection_id)

            return (
              <tr
                key={doc.knowledge_document_id}
                style={{ transition: 'background-color 100ms' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = appTheme.rowAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px', color: appTheme.textSecondary }}>
                  {truncateId(doc.knowledge_document_id)}
                </td>
                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={() => onView(doc.knowledge_document_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: appTheme.textPrimary,
                      textAlign: 'left',
                      fontFamily: appTheme.font,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = appTheme.accentBlue)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = appTheme.textPrimary)}
                  >
                    {doc.title}
                  </button>
                </td>
                <td style={{ ...tdStyle, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: appTheme.textSecondary }}>
                  {collectionName}
                </td>
                <td style={tdStyle}>
                  <ClassificationBadge level={doc.governance?.classification_level} />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {sdlcTags.length > 0
                      ? sdlcTags.map((t) => (
                          <InlineTag key={t.knowledge_document_tag_id} label={t.tag_name} bg="#EFF6FF" color={appTheme.accentBlue} />
                        ))
                      : <span style={{ fontSize: '12px', color: appTheme.textPlaceholder }}>—</span>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {domainTags.length > 0
                      ? domainTags.map((t) => (
                          <InlineTag key={t.knowledge_document_tag_id} label={t.tag_name} bg="#F0FDFA" color="#0F766E" />
                        ))
                      : <span style={{ fontSize: '12px', color: appTheme.textPlaceholder }}>—</span>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {personaTags.length > 0
                      ? personaTags.map((t) => (
                          <InlineTag key={t.knowledge_document_tag_id} label={t.tag_name.replace('persona:', '')} bg="#FAF5FF" color="#7C3AED" />
                        ))
                      : <span style={{ fontSize: '12px', color: appTheme.textPlaceholder }}>—</span>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <StatusBadge status={doc.status} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <ActionsMenu
                    status={doc.status}
                    onView={() => onView(doc.knowledge_document_id)}
                    onEdit={() => onEdit(doc.knowledge_document_id)}
                    onActivate={() => onActivate(doc.knowledge_document_id)}
                    onDeactivate={() => onDeactivate(doc.knowledge_document_id)}
                    onReindex={() => onReindex(doc.knowledge_document_id)}
                    onDelete={() => onDelete(doc.knowledge_document_id)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
