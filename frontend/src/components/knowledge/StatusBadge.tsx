type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted'

interface StatusBadgeProps {
  status: DocumentStatus | null | undefined
}

const config: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
  deleted: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${config[status]}`}>
      {status}
    </span>
  )
}
