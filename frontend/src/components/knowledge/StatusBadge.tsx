import { appTheme } from '@/lib/theme'

type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted'

interface StatusBadgeProps {
  status: DocumentStatus | null | undefined
}

const config: Record<DocumentStatus, { bg: string; color: string }> = {
  draft:    { bg: '#F1F5F9', color: '#475569' },
  active:   { bg: '#D1FAE5', color: '#065F46' },
  archived: { bg: '#FEF3C7', color: '#92400E' },
  deleted:  { bg: '#FEE2E2', color: '#991B1B' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span style={{ fontSize: '12px', color: appTheme.textPlaceholder }}>—</span>
  const c = config[status]
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '20px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: c.bg,
        color: c.color,
        fontFamily: appTheme.font,
      }}
    >
      {label}
    </span>
  )
}
