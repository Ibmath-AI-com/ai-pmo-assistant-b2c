import { BlueAvatar } from './BlueAvatar'

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 0 4px' }}>
      <BlueAvatar variant="ai" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: '#F5F5F5', borderRadius: 8,
        padding: '10px 14px',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', animation: 'tdot 1.2s ease-in-out infinite' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', animation: 'tdot 1.2s ease-in-out 0.2s infinite' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', animation: 'tdot 1.2s ease-in-out 0.4s infinite' }} />
      </div>
      <style>{`
        @keyframes tdot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
