import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appTheme } from '@/lib/theme'
import { FilterBar } from '@/components/knowledge/FilterBar'
import { DocumentTable } from '@/components/knowledge/DocumentTable'
import { ConfirmModal } from '@/components/persona/ConfirmModal'
import { useToast } from '@/components/persona/useToast'
import {
  useCollections,
  useDocuments,
  useUpdateDocumentStatus,
  useReindexDocument,
} from '@/lib/hooks/useKnowledge'
import type { DocumentFilters } from '@/lib/api/knowledge'

const DEFAULT_FILTERS: DocumentFilters = { limit: 20, skip: 0 }

type ConfirmDialog =
  | { type: 'deactivate'; id: string }
  | { type: 'activate'; id: string }
  | { type: 'delete'; id: string }
  | null

export function KnowledgeListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [activeFilters, setActiveFilters] = useState<DocumentFilters>(DEFAULT_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<DocumentFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmDialog>(null)

  const { data: collections = [] } = useCollections()
  const { data: documents = [], isLoading } = useDocuments({ ...activeFilters, skip: page * 20 })
  const { mutate: changeStatus } = useUpdateDocumentStatus()
  const { mutate: reindex } = useReindexDocument()

  const handleSearch = () => {
    setPage(0)
    setActiveFilters({ ...pendingFilters, limit: 20, skip: 0 })
  }

  const handleReset = () => {
    setPendingFilters(DEFAULT_FILTERS)
    setActiveFilters(DEFAULT_FILTERS)
    setPage(0)
  }

  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'activate') {
      changeStatus(
        { id: confirm.id, status: 'active' },
        { onSuccess: () => toast.show('success', 'Document activated'), onError: () => toast.show('error', 'Failed to activate document') }
      )
    }
    if (confirm.type === 'deactivate') {
      changeStatus(
        { id: confirm.id, status: 'archived' },
        { onSuccess: () => toast.show('success', 'Document deactivated'), onError: () => toast.show('error', 'Failed to deactivate document') }
      )
    }
    if (confirm.type === 'delete') {
      changeStatus(
        { id: confirm.id, status: 'deleted' },
        { onSuccess: () => toast.show('error', 'Document deleted'), onError: () => toast.show('error', 'Failed to delete document') }
      )
    }
    setConfirm(null)
  }

  const start = page * 20 + 1
  const end = page * 20 + documents.length

  const dialogText = confirm
    ? confirm.type === 'activate'
      ? { title: 'Activate document?', message: 'The document will be set to Active and included in search results.', confirmLabel: 'Activate', destructive: false }
      : confirm.type === 'deactivate'
      ? { title: 'Deactivate document?', message: 'Are you sure you want to deactivate this knowledge document?', confirmLabel: 'Deactivate', destructive: false }
      : { title: 'Delete document?', message: 'This will mark the document as deleted. This can be undone by reactivating.', confirmLabel: 'Delete', destructive: true }
    : null

  return (
    <div style={{ fontFamily: appTheme.font, color: appTheme.textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: appTheme.textPrimary, margin: 0 }}>
          Knowledge Hub
        </h1>
        <button
          type="button"
          onClick={() => navigate('/knowledge-hub/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: appTheme.accentBlue,
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer',
            padding: 0,
            fontFamily: appTheme.font,
          }}
        >
          Add New Document
          <PlusCircle />
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={pendingFilters}
        onChange={setPendingFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        collections={collections}
      />

      <div style={{ height: '16px' }} />

      {/* Table */}
      <DocumentTable
        documents={documents}
        collections={collections}
        isLoading={isLoading}
        onView={(id) => navigate(`/knowledge-hub/${id}`)}
        onEdit={(id) => navigate(`/knowledge-hub/${id}/edit`)}
        onActivate={(id) => setConfirm({ type: 'activate', id })}
        onDeactivate={(id) => setConfirm({ type: 'deactivate', id })}
        onReindex={(id) => reindex(id)}
        onDelete={(id) => setConfirm({ type: 'delete', id })}
      />

      {/* Pagination */}
      {documents.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px', color: appTheme.textSecondary, fontFamily: appTheme.font }}>
          <span>Showing {start}–{end} results</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                height: '28px',
                padding: '0 12px',
                border: `1px solid ${appTheme.border}`,
                borderRadius: appTheme.radiusInput,
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                color: appTheme.textSubtle,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
                fontFamily: appTheme.font,
              }}
            >
              Prev
            </button>
            <span
              style={{
                height: '28px',
                padding: '0 12px',
                border: `1px solid ${appTheme.accentBlue}`,
                borderRadius: appTheme.radiusInput,
                backgroundColor: '#EFF6FF',
                fontSize: '12px',
                fontWeight: 600,
                color: appTheme.accentBlue,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {page + 1}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={documents.length < 20}
              style={{
                height: '28px',
                padding: '0 12px',
                border: `1px solid ${appTheme.border}`,
                borderRadius: appTheme.radiusInput,
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                color: appTheme.textSubtle,
                cursor: documents.length < 20 ? 'not-allowed' : 'pointer',
                opacity: documents.length < 20 ? 0.4 : 1,
                fontFamily: appTheme.font,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirm && dialogText && (
        <ConfirmModal
          open
          title={dialogText.title}
          message={dialogText.message}
          confirmLabel={dialogText.confirmLabel}
          destructive={dialogText.destructive}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function PlusCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="10" fill={appTheme.cyan} />
      <path d="M10 5 L10 15 M5 10 L15 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
