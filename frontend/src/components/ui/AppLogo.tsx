import pmoLogo from '@/assets/pmo-logo.png'

interface AppLogoProps {
  size?: number
}

export function AppLogo({ size = 28 }: AppLogoProps) {
  return (
    <img
      src={pmoLogo}
      alt="AI PMO Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  )
}
