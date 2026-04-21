import { X } from 'lucide-react'

interface TagChipProps {
  label: string
  onRemove?: () => void
}

export function TagChip({ label, onRemove }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 focus:outline-none"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
