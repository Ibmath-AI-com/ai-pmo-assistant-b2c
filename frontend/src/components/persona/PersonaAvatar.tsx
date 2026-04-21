interface Props {
  size?: number
  seed?: string
}

export function PersonaAvatar({ size = 56 }: Props) {
  const s = size
  const iconSize = Math.round(s * 0.55)
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: '2px solid #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="7" r="3" fill="#2563EB" />
        <circle cx="7" cy="17" r="2.5" fill="#60A5FA" />
        <circle cx="25" cy="17" r="2.5" fill="#60A5FA" />
        <circle cx="11" cy="26" r="2" fill="#93C5FD" />
        <circle cx="21" cy="26" r="2" fill="#93C5FD" />
        <path
          d="M16 10 L7 17 M16 10 L25 17 M7 17 L11 26 M25 17 L21 26 M11 26 L21 26 M7 17 L25 17"
          stroke="#2563EB"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}
