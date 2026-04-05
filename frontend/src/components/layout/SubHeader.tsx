import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const personas = [
  'PMO Advisor',
  'Risk Manager',
  'Strategy Analyst',
  'Portfolio Manager',
  'Custom Persona',
]

export function SubHeader() {
  const [selected, setSelected] = useState('PMO Advisor')
  const [open, setOpen] = useState(false)

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center px-6"
      style={{
        top: '56px',
        height: '48px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        gap: '12px',
      }}
    >
      {/* Logo + Brand */}
      <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <polygon points="14,7 21,11 21,19 14,23 7,19 7,11" fill="#06B6D4" opacity="0.7" />
      </svg>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
        AI PMO & Strategy Assistant
      </span>

      {/* Divider */}
      <span style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB', flexShrink: 0 }} />

      {/* Workspace label */}
      <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
        Workspace
      </span>

      {/* Divider */}
      <span style={{ width: '1px', height: '16px', backgroundColor: '#E5E7EB', flexShrink: 0 }} />

      {/* Personas dropdown — left side, next to Workspace */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5"
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
        >
          <span
            style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: '#22C55E', flexShrink: 0 }}
          />
          {selected}
          <ChevronDown size={11} style={{ color: '#9CA3AF' }} />
        </button>

        {open && (
          <div
            className="absolute left-0 z-50"
            style={{
              top: 'calc(100% + 4px)',
              minWidth: '150px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '5px 10px 3px',
                fontSize: '10px',
                color: '#9CA3AF',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              Personas
            </div>
            {personas.map((p) => (
              <button
                key={p}
                onClick={() => { setSelected(p); setOpen(false) }}
                className="w-full text-left"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: p === selected ? '#1D4ED8' : '#374151',
                  backgroundColor: p === selected ? '#EFF6FF' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  fontWeight: p === selected ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (p !== selected) e.currentTarget.style.backgroundColor = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = p === selected ? '#EFF6FF' : 'transparent'
                }}
              >
                <span
                  style={{
                    height: '5px',
                    width: '5px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: p === selected ? '#1D4ED8' : '#9CA3AF',
                  }}
                />
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
