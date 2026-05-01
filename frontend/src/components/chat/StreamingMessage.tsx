import { BlueAvatar } from './BlueAvatar'

interface Props {
  content: string
}

export function StreamingMessage({ content }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <BlueAvatar variant="ai" />
      <div style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '14px 16px',
        fontSize: 13,
        color: '#374151',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxWidth: '92%',
      }}>
        {content}
        <span style={{
          display: 'inline-block', width: 2, height: 12,
          background: '#4F5BD5', marginLeft: 2, verticalAlign: 'text-bottom',
          animation: 'blink 1s step-end infinite',
        }} />
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    </div>
  )
}
