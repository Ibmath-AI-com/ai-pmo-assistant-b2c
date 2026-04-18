import { appTheme } from '@/lib/theme'

interface Props {
  steps: { id: number; label: string }[]
  current: number
  onJump?: (step: number) => void
}

export function StepIndicator({ steps, current, onJump }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
      {steps.map((s, i) => {
        const isActive = s.id === current
        const canJump = onJump && s.id < current
        const bg = isActive ? appTheme.accentBlue : appTheme.stepInactiveBg
        const color = isActive ? '#FFFFFF' : appTheme.stepInactiveText
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: i < steps.length - 1 ? 1 : 0 }}>
            <button
              type="button"
              onClick={() => canJump && onJump(s.id)}
              disabled={!canJump}
              style={{
                backgroundColor: bg,
                color,
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                cursor: canJump ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                fontFamily: appTheme.font,
              }}
            >
              {s.id}. {s.label}
            </button>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: '1px',
                  backgroundColor: appTheme.connectorLine,
                  flex: 1,
                  margin: '0 4px',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
