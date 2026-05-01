import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const { user } = useAuthStore()
  const [value, setValue] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [showDriveSub, setShowDriveSub] = useState(false)
  const [toast, setToast] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)

  const hasText = value.trim().length > 0

  const initials = user
    ? ((user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')).toUpperCase() || 'U'
    : 'U'

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`
  }

  const handleSend = () => {
    if (!hasText || disabled) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const showComingSoon = (name: string) => {
    setToast(`Coming soon — ${name}`)
    setShowAttach(false)
    setShowDriveSub(false)
    setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setShowAttach(false)
        setShowDriveSub(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #E5E7EB', padding: '10px 12px', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1F2937', color: '#fff', fontSize: 13,
          padding: '9px 18px', borderRadius: 20, zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast}
          <style>{`@keyframes fadeUp { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        </div>
      )}

      {/* Attachment dropdown — floats above input, anchored near pill */}
      <div ref={attachRef} style={{ position: 'absolute', bottom: 'calc(100% - 10px)', left: 60, zIndex: 100 }}>
        {showAttach && (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: 190, overflow: 'hidden',
            animation: 'fadeUp2 0.12s ease',
          }}>
            <style>{`@keyframes fadeUp2 { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
            <AttachItem
              label="Add Files / Photos"
              onClick={() => { fileInputRef.current?.click(); setShowAttach(false) }}
            />
            <div style={{ position: 'relative' }}>
              <AttachItem
                label="Select from Drive"
                suffix={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <polyline points="9 18 15 12 9 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                onClick={() => setShowDriveSub(v => !v)}
              />
              {showDriveSub && (
                <div style={{
                  position: 'absolute', left: '100%', top: -4,
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: 160, overflow: 'hidden',
                }}>
                  <DriveItem color="#0078D4" label="One Drive" onClick={() => showComingSoon('Phase 7')} />
                  <DriveItem color="#0061FF" label="Drop Box" onClick={() => showComingSoon('Phase 7')} />
                  <DriveItem color="#34A853" label="Google Drive" onClick={() => showComingSoon('Phase 7')} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* User avatar with initials */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: '#4F5BD5', color: '#fff',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {initials}
        </div>

        {/* Pill */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid #E5E7EB', borderRadius: 24,
          padding: '7px 12px', background: '#fff',
          transition: 'border-color 0.15s',
        }}
          onFocus={() => {}}
          onBlurCapture={() => {}}
        >
          {/* [+] attach */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAttach(v => !v) }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#F9FAFB', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F9FAFB')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); resize() }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'inherit', fontSize: 13, color: '#1F2937',
              background: 'transparent', minHeight: 20, maxHeight: 80,
              lineHeight: 1.5, padding: 0,
            }}
          />

          {/* Emoji */}
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="1.8"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="9" y1="9" x2="9.01" y2="9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              <line x1="15" y1="9" x2="15.01" y2="9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasText || disabled}
            style={{ background: 'none', border: 'none', cursor: hasText && !disabled ? 'pointer' : 'default', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="22" y1="2" x2="11" y2="13" stroke={hasText && !disabled ? '#4F5BD5' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke 0.15s' }}/>
              <polygon points="22 2 15 22 11 13 2 9 22 2" stroke={hasText && !disabled ? '#4F5BD5' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.15s' }}/>
            </svg>
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} />
    </div>
  )
}

function AttachItem({ label, suffix, onClick }: { label: string; suffix?: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px', fontSize: 13, color: '#374151',
        cursor: 'pointer', gap: 8, userSelect: 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span>{label}</span>
      {suffix}
    </div>
  )
}

function DriveItem({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 14px', fontSize: 13, color: '#374151',
        cursor: 'pointer', userSelect: 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </div>
  )
}
