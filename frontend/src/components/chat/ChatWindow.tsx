import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@/lib/hooks/useChat'
import { createSession, getSession } from '@/lib/api/chat'
import { MessageBubble } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'
import { TypingIndicator } from './TypingIndicator'
import { ChatInput } from './ChatInput'

interface ChatWindowProps {
  chatSessionId?: string | null
  className?: string
}

export function ChatWindow({ chatSessionId: externalSessionId, className }: ChatWindowProps) {
  // localSessionId tracks sessions created within this component (new chat flow)
  const [localSessionId, setLocalSessionId] = useState<string | null>(null)
  const sessionId = externalSessionId ?? localSessionId

  const [sessionTitle, setSessionTitle] = useState('Chat')
  // When there's no active session the title is always 'Chat'
  const displayTitle = sessionId ? sessionTitle : 'Chat'

  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, connected, streamingContent, error: wsError, sendMessage, loadMessages } = useChat(sessionId)

  // Load history when session changes
  useEffect(() => {
    if (!sessionId) {
      loadMessages([])
      return
    }
    getSession(sessionId).then(s => {
      setSessionTitle(s.title ?? 'Chat')
      loadMessages(s.messages ?? [])
    }).catch(() => {})
  }, [sessionId, loadMessages])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isTyping])

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const showTyping = isTyping && !streamingContent && !wsError && lastMessage?.role !== 'assistant'

  const handleSend = useCallback(async (text: string) => {
    let sid = sessionId
    if (!sid) {
      const s = await createSession({ title: text.slice(0, 60) })
      sid = s.chat_session_id
      setLocalSessionId(sid)
      setSessionTitle(s.title ?? 'Chat')
      // Small delay for WebSocket to connect
      setTimeout(() => { sendMessage(text); setIsTyping(true) }, 400)
      return
    }
    sendMessage(text)
    setIsTyping(true)
  }, [sessionId, sendMessage])

  const hasMessages = messages.length > 0 || !!streamingContent || showTyping

  return (
    <div
      className={className}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* ── Title bar — gradient matching sidebar section headers ── */}
      <div style={{
        flexShrink: 0, height: 44,
        background: 'linear-gradient(135deg, #4F46E5, #1E293B)',
        display: 'flex', alignItems: 'center',
        gap: 10, padding: '0 16px',
      }}>
        <div style={{
          width: 22, height: 22, background: '#1E2060',
          borderRadius: 5, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: '0.1px' }}>
          {displayTitle}
        </span>
      </div>

      {/* ── Message history ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 16,
        background: '#fff',
      }}>
        {/* Empty state */}
        {!hasMessages && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, color: '#9CA3AF', fontSize: 13, textAlign: 'center',
            userSelect: 'none', minHeight: 200,
          }}>
            <div style={{
              width: 40, height: 40, background: '#EEF0FF',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="#4F5BD5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>Start a conversation</span>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.message_id} message={msg} />
        ))}

        {streamingContent && <StreamingMessage content={streamingContent} />}
        {showTyping && <TypingIndicator />}

        {wsError && (
          <div style={{
            padding: '10px 14px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8,
            fontSize: 12, color: '#DC2626',
          }}>
            {wsError}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <ChatInput onSend={handleSend} disabled={sessionId !== null && !connected} />
    </div>
  )
}
