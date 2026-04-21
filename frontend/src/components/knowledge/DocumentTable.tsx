import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
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

function ActionsMenu({
  status,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onReindex,
  onDelete,
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
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {items.map(({ label, action, danger }) => (
              <button
                key={label}
                type="button"
                onClick={() => { action(); setOpen(false) }}
                className={`block w-full px-4 py-1.5 text-left text-sm hover:bg-gray-50 ${
                  danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                }`}
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
      <div className="flex items-center justify-center py-16 text-gray-400">
        <span className="text-sm">Loading documents…</span>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <span className="text-sm">No records found.</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['ID', 'Document Title', 'KB Collection', 'Classification', 'SDLC', 'Domain', 'Persona(s)', 'Status', ''].map(
              (col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => {
            const sdlcTags = getTagsByType(doc.tags, 'sdlc')
            const domainTags = getTagsByType(doc.tags, 'domain')
            const personaTags = (doc.tags ?? []).filter((t) => t.tag_name.startsWith('persona:') && t.status === 'active')
            const collectionName = collectionMap.get(doc.knowledge_collection_id) ?? truncateId(doc.knowledge_collection_id)

            return (
              <tr key={doc.knowledge_document_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {truncateId(doc.knowledge_document_id)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                  <button
                    type="button"
                    onClick={() => onView(doc.knowledge_document_id)}
                    className="hover:text-indigo-600 hover:underline text-left"
                  >
                    {doc.title}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate text-xs">
                  {collectionName}
                </td>
                <td className="px-4 py-3">
                  <ClassificationBadge level={doc.governance?.classification_level} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {sdlcTags.length > 0
                      ? sdlcTags.map((t) => (
                          <span key={t.knowledge_document_tag_id} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                            {t.tag_name}
                          </span>
                        ))
                      : <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {domainTags.length > 0
                      ? domainTags.map((t) => (
                          <span key={t.knowledge_document_tag_id} className="rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700">
                            {t.tag_name}
                          </span>
                        ))
                      : <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {personaTags.length > 0
                      ? personaTags.map((t) => (
                          <span key={t.knowledge_document_tag_id} className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                            {t.tag_name.replace('persona:', '')}
                          </span>
                        ))
                      : <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3 text-right">
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
