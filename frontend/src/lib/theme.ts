export const appTheme = {
  primaryBlue: '#1E3A8A',
  accentBlue: '#2563EB',
  cyan: '#06B6D4',
  cyanHover: '#0891B2',
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  rowAlt: '#F0F4FF',
  border: '#E2E8F0',
  borderSoft: '#BFDBFE',
  borderFocus: '#93C5FD',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textPlaceholder: '#94A3B8',
  textSubtle: '#374151',
  ragBg: '#EFF6FF',
  ragIcon: '#2563EB',
  xllmBg: '#FEF2F2',
  xllmIcon: '#DC2626',
  danger: '#EF4444',
  success: '#10B981',
  stepInactiveBg: '#E2E8F0',
  stepInactiveText: '#94A3B8',
  connectorLine: '#CBD5E1',
  radiusInput: '6px',
  radiusCard: '8px',
  radiusCardWizard: '10px',
  font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
} as const

export const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '40px',
  border: `1px solid ${appTheme.border}`,
  borderRadius: appTheme.radiusInput,
  padding: '0 12px',
  fontSize: '14px',
  color: appTheme.textPrimary,
  backgroundColor: appTheme.cardBg,
  outline: 'none',
  fontFamily: appTheme.font,
}

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 'auto',
  minHeight: '90px',
  padding: '10px 12px',
  resize: 'vertical',
}

export const sectionLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: appTheme.accentBlue,
  marginBottom: '20px',
  fontFamily: appTheme.font,
}

export const cardStyle: React.CSSProperties = {
  backgroundColor: appTheme.cardBg,
  border: `1.5px solid ${appTheme.borderSoft}`,
  borderRadius: appTheme.radiusCardWizard,
  padding: '32px',
}
