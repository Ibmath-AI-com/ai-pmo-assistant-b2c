import { appTheme } from '@/lib/theme'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}

export function ToggleSwitch({ checked, onChange, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: checked ? appTheme.cyan : '#CBD5E1',
        transition: 'background-color 150ms ease',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transform: `translateX(${checked ? '20px' : '0'})`,
          transition: 'transform 150ms ease',
        }}
      />
    </button>
  )
}
