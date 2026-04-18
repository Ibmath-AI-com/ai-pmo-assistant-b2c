import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'error'

export interface ToastCtx {
  show: (kind: ToastKind, message: string) => void
}

export const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
