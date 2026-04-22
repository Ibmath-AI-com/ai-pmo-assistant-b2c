import { appTheme } from '@/lib/theme'

interface TagChipProps {
  label: string
  onRemove?: () => void
}

export function TagChip({ label, onRemove }: TagChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '20px',
        padding: '2px 10px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: '#EFF6FF',
        color: appTheme.accentBlue,
        fontFamily: appTheme.font,
      }}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 0 0 2px',
            color: appTheme.textSecondary,
            fontSize: '15px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}
