interface InfoRowProps {
  label: string
  children: React.ReactNode
}

export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '14px 0',
        borderBottom: '1px solid #F0F0F0',
      }}
    >
      <span
        style={{
          minWidth: '160px',
          background: '#F3F4F6',
          borderRadius: '6px',
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: '13px',
          color: '#374151',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '14px', color: '#111827', flex: 1 }}>{children}</span>
    </div>
  )
}
