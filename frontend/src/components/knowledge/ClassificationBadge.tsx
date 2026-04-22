import { appTheme } from '@/lib/theme'

interface ClassificationBadgeProps {
  level: 'Public' | 'Internal' | 'Confidential' | 'Restricted' | null | undefined
}

const config = {
  Public:       { bg: '#DCFCE7', color: '#166534' },
  Internal:     { bg: '#DBEAFE', color: '#1E40AF' },
  Confidential: { bg: '#FFEDD5', color: '#9A3412' },
  Restricted:   { bg: '#FEE2E2', color: '#991B1B' },
}

export function ClassificationBadge({ level }: ClassificationBadgeProps) {
  if (!level) return <span style={{ fontSize: '12px', color: appTheme.textPlaceholder }}>—</span>
  const c = config[level]
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
      {level}
    </span>
  )
}
