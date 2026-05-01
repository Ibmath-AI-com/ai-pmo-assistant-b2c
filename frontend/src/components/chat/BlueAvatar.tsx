import pmoLogo from '@/assets/pmo-logo.png'

interface Props {
  variant?: 'user' | 'ai'
  size?: number
}

export function BlueAvatar({ variant = 'ai', size = 28 }: Props) {
  if (variant === 'ai') {
    return (
      <img src={pmoLogo} alt="AI" style={{ width: size, height: size, flexShrink: 0, marginTop: 2, objectFit: 'contain' }} />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#EEF0FF',
      border: '2px solid #4F5BD5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#4F5BD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="#4F5BD5" strokeWidth="2"/>
      </svg>
    </div>
  )
}
