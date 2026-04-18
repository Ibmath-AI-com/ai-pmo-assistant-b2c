import { appTheme } from '@/lib/theme'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: appTheme.cardBg,
          borderRadius: '10px',
          padding: '24px',
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          fontFamily: appTheme.font,
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: appTheme.textPrimary, margin: '0 0 8px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: appTheme.textSecondary, margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: '40px',
              padding: '0 18px',
              border: `1px solid ${appTheme.border}`,
              borderRadius: appTheme.radiusInput,
              backgroundColor: appTheme.cardBg,
              color: appTheme.textSubtle,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: '40px',
              padding: '0 18px',
              border: 'none',
              borderRadius: appTheme.radiusInput,
              backgroundColor: destructive ? appTheme.danger : appTheme.primaryBlue,
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
