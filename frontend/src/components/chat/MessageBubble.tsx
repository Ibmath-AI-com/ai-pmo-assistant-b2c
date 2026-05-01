import type { ChatMessage } from '@/lib/api/chat'
import { ReportCard, tryParseReport } from './ReportCard'
import { BlueAvatar } from './BlueAvatar'

interface Props {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (!isUser) {
    const report = tryParseReport(message.content)
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <BlueAvatar variant="ai" />
        <div style={{ maxWidth: '92%', minWidth: 0 }}>
          {report
            ? <ReportCard report={report} />
            : (
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
              }}>
                {message.content}
              </div>
            )
          }
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <BlueAvatar variant="user" />
      <div style={{
        background: '#F5F5F5',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#374151',
        lineHeight: 1.6,
        maxWidth: '90%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </div>
  )
}
