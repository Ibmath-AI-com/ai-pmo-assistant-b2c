import { apiClient } from './client'

export interface ChatSession {
  chat_session_id: string
  user_id: string
  persona_id: string | null
  workspace_id: string | null
  title: string | null
  status: string
  created_at: string
  updated_at: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  message_id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  token_count: number | null
  status: string
  created_at: string
}

export interface SessionCreate {
  persona_id?: string
  workspace_id?: string
  title?: string
}

export async function createSession(data: SessionCreate): Promise<ChatSession> {
  const { data: res } = await apiClient.post('/api/v1/chat/sessions', data)
  return res
}

export async function listSessions(limit = 20, skip = 0): Promise<ChatSession[]> {
  const { data } = await apiClient.get('/api/v1/chat/sessions', { params: { limit, skip } })
  return data
}

export async function getSession(sessionId: string): Promise<ChatSession> {
  const { data } = await apiClient.get(`/api/v1/chat/sessions/${sessionId}`)
  return data
}

export async function updateSession(sessionId: string, data: Partial<SessionCreate & { status: string }>): Promise<ChatSession> {
  const { data: res } = await apiClient.put(`/api/v1/chat/sessions/${sessionId}`, data)
  return res
}

export async function archiveSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/chat/sessions/${sessionId}`)
}

export async function sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
  const { data } = await apiClient.post(`/api/v1/chat/sessions/${sessionId}/messages`, { content })
  return data
}

export async function listMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
  const { data } = await apiClient.get(`/api/v1/chat/sessions/${sessionId}/messages`, { params: { limit } })
  return data
}

export interface Prompt {
  prompt_id: string
  prompt_name: string
  prompt_text: string
  prompt_category: string | null
  is_ready_prompt: boolean
  is_system: boolean
  status: string
}

export async function listReadyPrompts(): Promise<Prompt[]> {
  const { data } = await apiClient.get('/api/v1/prompts/ready')
  return data
}
