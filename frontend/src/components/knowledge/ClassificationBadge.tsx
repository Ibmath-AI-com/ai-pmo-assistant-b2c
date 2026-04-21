interface ClassificationBadgeProps {
  level: 'Public' | 'Internal' | 'Confidential' | 'Restricted' | null | undefined
}

const config = {
  Public: 'bg-green-100 text-green-800',
  Internal: 'bg-blue-100 text-blue-800',
  Confidential: 'bg-orange-100 text-orange-800',
  Restricted: 'bg-red-100 text-red-800',
}

export function ClassificationBadge({ level }: ClassificationBadgeProps) {
  if (!level) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config[level]}`}>
      {level}
    </span>
  )
}
