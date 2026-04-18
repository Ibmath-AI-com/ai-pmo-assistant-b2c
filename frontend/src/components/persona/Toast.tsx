import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  show: (kind: ToastKind, message: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 200,
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10)
    return () => window.clearTimeout(t)
  }, [])
  const bg = toast.kind === 'success' ? '#10B981' : '#EF4444'
  return (
    <div
      style={{
        backgroundColor: bg,
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        minWidth: '260px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(12px)',
        transition: 'opacity 150ms ease, transform 150ms ease',
      }}
    >
      {toast.message}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
