import { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatMessage } from '../api/chat'

type WsMessage =
  | { type: 'connected'; session_id: string }
  | { type: 'message_saved'; message_id: string; role: string; content: string }
  | { type: 'ai_response'; content: string; session_id: string; message_id?: string }
  | { type: 'streaming_chunk'; chunk: string }
  | { type: 'ai_done' }
  | { type: 'error'; message: string }
  | { type: 'pong' }

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  // Keep a ref to streamingContent for use inside the onmessage closure
  const streamingRef = useRef<string | null>(null)

  const connect = useCallback(() => {
    if (!sessionId) return
    const token = localStorage.getItem('access_token')
    const wsBase = (import.meta.env.VITE_WS_URL || 'ws://localhost:8003').replace(/^http/, 'ws')
    const url = `${wsBase}/api/v1/ws/chat/${sessionId}${token ? `?token=${token}` : ''}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => { setConnected(true); setError(null) }
    ws.onclose = () => { setConnected(false); wsRef.current = null }
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data)

        if (data.type === 'message_saved') {
          const msg: ChatMessage = {
            message_id: data.message_id,
            session_id: sessionId,
            role: data.role as 'user' | 'assistant',
            content: data.content,
            token_count: null,
            status: 'sent',
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, msg])

        } else if (data.type === 'ai_response') {
          setStreamingContent(null)
          streamingRef.current = null
          const msg: ChatMessage = {
            message_id: data.message_id ?? crypto.randomUUID(),
            session_id: sessionId,
            role: 'assistant',
            content: data.content,
            token_count: null,
            status: 'sent',
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, msg])

        } else if (data.type === 'streaming_chunk') {
          const next = (streamingRef.current ?? '') + data.chunk
          streamingRef.current = next
          setStreamingContent(next)

        } else if (data.type === 'ai_done') {
          const full = streamingRef.current
          if (full) {
            const msg: ChatMessage = {
              message_id: crypto.randomUUID(),
              session_id: sessionId,
              role: 'assistant',
              content: full,
              token_count: null,
              status: 'sent',
              created_at: new Date().toISOString(),
            }
            setMessages(prev => [...prev, msg])
            setStreamingContent(null)
            streamingRef.current = null
          }

        } else if (data.type === 'error') {
          setError(data.message)
          setStreamingContent(null)
          streamingRef.current = null
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [sessionId])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setError(null)
      wsRef.current.send(JSON.stringify({ type: 'message', content }))
    }
  }, [])

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs)
  }, [])

  return { messages, connected, streamingContent, error, sendMessage, loadMessages }
}
