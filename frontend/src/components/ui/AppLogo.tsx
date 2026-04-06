interface AppLogoProps {
  size?: number
}

export function AppLogo({ size = 28 }: AppLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon
        points="14,2 26,8 26,20 14,26 2,20 2,8"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      <polygon
        points="14,7 21,11 21,19 14,23 7,19 7,11"
        fill="#06B6D4"
        opacity="0.7"
      />
    </svg>
  )
}
