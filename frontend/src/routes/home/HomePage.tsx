import { ChatWindow } from '@/components/chat/ChatWindow'

export function HomePage() {
  return (
    <div style={{ height: 'calc(100vh - 114px)', minHeight: 400 }}>
      <ChatWindow />
    </div>
  )
}
