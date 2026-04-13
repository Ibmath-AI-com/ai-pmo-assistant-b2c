import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { FilterBar } from '@/components/knowledge/FilterBar'
import { DocumentTable } from '@/components/knowledge/DocumentTable'
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
    if (confirm.type === 'activate') changeStatus({ id: confirm.id, status: 'active' })
    if (confirm.type === 'deactivate') changeStatus({ id: confirm.id, status: 'archived' })
    if (confirm.type === 'delete') changeStatus({ id: confirm.id, status: 'deleted' })
    setConfirm(null)
  }

  const start = page * 20 + 1
  const end = page * 20 + documents.length

  const dialogText = confirm
    ? confirm.type === 'activate'
      ? { title: 'Activate document?', body: 'The document will be set to Active and included in search results.', action: 'Activate', danger: false }
      : confirm.type === 'deactivate'
      ? { title: 'Deactivate document?', body: 'Are you sure you want to deactivate the knowledge Document?', action: 'Deactivate', danger: false }
      : { title: 'Delete document?', body: 'This will mark the document as deleted. This can be undone by reactivating the document.', action: 'Delete', danger: true }
    : null

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Knowledge Hub</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your organization's knowledge documents
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/knowledge-hub/new')}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          Add New Document
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
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {start}–{end} results</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="rounded border border-indigo-500 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {page + 1}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={documents.length < 20}
              className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirm && dialogText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">{dialogText.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{dialogText.body}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-md px-4 py-1.5 text-sm font-medium text-white ${
                  dialogText.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {dialogText.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
