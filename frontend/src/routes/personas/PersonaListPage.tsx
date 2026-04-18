import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonas, useSetPersonaStatus } from '@/lib/hooks/usePersonas'
import type { Persona } from '@/lib/api/personas'
import { appTheme, inputStyle } from '@/lib/theme'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { CapabilityBadges } from '@/components/persona/CapabilityBadges'
import { ConfirmModal } from '@/components/persona/ConfirmModal'
import { useToast } from '@/components/persona/useToast'

interface Filters {
  documentTitle: string
  documentType: string
  documentCollection: string
  classificationLevel: string
  sdlc: string
  domain: string
  personaRelevance: string
  status: string
}

const initialFilters: Filters = {
  documentTitle: '',
  documentType: '',
  documentCollection: '',
  classificationLevel: '',
  sdlc: '',
  domain: '',
  personaRelevance: '',
  status: '',
}

const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted']
const SDLC_PHASES = ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure', 'All Phases']
const DOMAINS = ['Risk', 'Governance', 'KPI', 'Benefits', 'Portfolio', 'Change Management', 'Strategy Execution', 'Strategy Planning']
const STATUS_OPTIONS = ['active', 'inactive']

export function PersonaListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [applied, setApplied] = useState<Filters>(initialFilters)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const serverFilters = useMemo(
    () => ({ status: applied.status || undefined }),
    [applied.status]
  )
  const { data: personas, isLoading, error } = usePersonas(serverFilters)
  const setStatus = useSetPersonaStatus()

  const filtered = useMemo(() => {
    if (!personas) return []
    const q = applied.documentTitle.trim().toLowerCase()
    return personas.filter((p) => {
      if (q) {
        const hit =
          p.persona_name.toLowerCase().includes(q) ||
          p.persona_code.toLowerCase().includes(q) ||
          (p.short_description ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [personas, applied])

  function onSearch() {
    setApplied(filters)
  }

  function onDownload(p: Persona) {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${p.persona_code || p.persona_id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpenMenuId(null)
  }

  function confirmDelete() {
    if (!confirmDeleteId) return
    setStatus.mutate(
      { id: confirmDeleteId, status: 'deleted' },
      {
        onSuccess: () => toast.show('error', 'Persona deleted'),
        onError: () => toast.show('error', 'Failed to delete persona'),
      }
    )
    setConfirmDeleteId(null)
  }

  return (
    <div style={{ fontFamily: appTheme.font, color: appTheme.textPrimary }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: appTheme.textPrimary, margin: '0 0 20px' }}>
        Personas Management
      </h1>

      <FilterBar filters={filters} onChange={setFilters} onSearch={onSearch} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '16px 0 8px',
        }}
      >
        <span />
        <button
          onClick={() => navigate('/personas/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: appTheme.accentBlue,
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Add New Persona
          <PlusCircle />
        </button>
      </div>

      {isLoading && <EmptyRow>Loading personas…</EmptyRow>}
      {error && <EmptyRow tone="error">Failed to load personas.</EmptyRow>}
      {!isLoading && !error && filtered.length === 0 && <EmptyRow>No results found.</EmptyRow>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((p) => (
          <PersonaCard
            key={p.persona_id}
            persona={p}
            menuOpen={openMenuId === p.persona_id}
            onToggleMenu={() => setOpenMenuId(openMenuId === p.persona_id ? null : p.persona_id)}
            onView={() => {
              setOpenMenuId(null)
              navigate(`/personas/${p.persona_id}/view`)
            }}
            onEdit={() => {
              setOpenMenuId(null)
              navigate(`/personas/${p.persona_id}/edit`)
            }}
            onDownload={() => onDownload(p)}
            onDelete={() => {
              setOpenMenuId(null)
              setConfirmDeleteId(p.persona_id)
            }}
          />
        ))}
      </div>

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete persona"
        message="Are you sure you want to delete this persona? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function FilterBar({
  filters,
  onChange,
  onSearch,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onSearch: () => void
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v })
  const colStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }

  return (
    <div
      style={{
        backgroundColor: appTheme.cardBg,
        border: `1px solid ${appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={colStyle}>
        <input
          type="text"
          value={filters.documentTitle}
          onChange={(e) => set('documentTitle', e.target.value)}
          placeholder="Document Title"
          style={inputStyle}
        />
        <Select value={filters.documentType} onChange={(v) => set('documentType', v)} placeholder="Document Type" options={['Policy', 'Process', 'Guideline']} />
        <Select value={filters.documentCollection} onChange={(v) => set('documentCollection', v)} placeholder="Document Collection" options={['Core', 'Operations', 'Strategy']} />
        <Select value={filters.classificationLevel} onChange={(v) => set('classificationLevel', v)} placeholder="Classification Level" options={CLASSIFICATIONS} />
      </div>
      <div style={colStyle}>
        <Select value={filters.sdlc} onChange={(v) => set('sdlc', v)} placeholder="SDLC" options={SDLC_PHASES} />
        <Select value={filters.domain} onChange={(v) => set('domain', v)} placeholder="Domain" options={DOMAINS} />
        <Select value={filters.personaRelevance} onChange={(v) => set('personaRelevance', v)} placeholder="Persona Relevance" options={['High', 'Medium', 'Low']} />
        <Select value={filters.status} onChange={(v) => set('status', v)} placeholder="Status" options={STATUS_OPTIONS} />
      </div>
      <div>
        <button
          type="button"
          onClick={onSearch}
          style={{
            backgroundColor: appTheme.cyan,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            padding: '0 24px',
            height: '40px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>
    </div>
  )
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle,
        color: value ? appTheme.textPrimary : appTheme.textPlaceholder,
        appearance: 'none',
        backgroundImage:
          'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '32px',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o} style={{ color: appTheme.textPrimary }}>
          {o}
        </option>
      ))}
    </select>
  )
}

interface CardProps {
  persona: Persona
  menuOpen: boolean
  onToggleMenu: () => void
  onView: () => void
  onEdit: () => void
  onDownload: () => void
  onDelete: () => void
}

function PersonaCard({ persona, menuOpen, onToggleMenu, onView, onEdit, onDownload, onDelete }: CardProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggleMenu()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen, onToggleMenu])

  const isInactive = persona.status !== 'active'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: appTheme.cardBg,
        border: `1px solid ${appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 120ms ease',
        opacity: isInactive ? 0.7 : 1,
        position: 'relative',
      }}
    >
      <PersonaAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: appTheme.textPrimary, marginBottom: '4px' }}>
          {persona.persona_name}
        </div>
        <div style={{ fontSize: '13px', color: appTheme.textSecondary }}>
          {[persona.persona_name, persona.persona_code, persona.persona_category].filter(Boolean).join(' | ')}
        </div>
      </div>
      <CapabilityBadges caps={{ rag: true, illm: true, xllm: false }} />
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label="Actions"
          onClick={onToggleMenu}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: menuOpen ? '#F1F5F9' : 'transparent',
            cursor: 'pointer',
            color: appTheme.textSecondary,
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = menuOpen ? '#F1F5F9' : 'transparent')}
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '36px',
              right: 0,
              backgroundColor: appTheme.cardBg,
              border: `1px solid ${appTheme.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              padding: '4px 0',
              minWidth: '140px',
              zIndex: 20,
            }}
          >
            <MenuItem label="View" onClick={onView} />
            <MenuItem label="Edit" onClick={onEdit} />
            <MenuItem label="Download" onClick={onDownload} />
            <MenuItem label="Delete" onClick={onDelete} danger />
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '7px 16px',
        fontSize: '13px',
        border: 'none',
        cursor: 'pointer',
        color: danger ? appTheme.danger : '#374151',
        backgroundColor: hover ? '#F1F5F9' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EmptyRow({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <div
      style={{
        backgroundColor: appTheme.cardBg,
        border: `1px solid ${appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        padding: '24px',
        textAlign: 'center',
        fontSize: '13px',
        color: tone === 'error' ? appTheme.danger : appTheme.textSecondary,
      }}
    >
      {children}
    </div>
  )
}

function PlusCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="10" fill="#06B6D4" />
      <path d="M10 5 L10 15 M5 10 L15 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
