import { appTheme, inputStyle } from '@/lib/theme'
import type { DocumentFilters, KnowledgeCollection } from '@/lib/api/knowledge'

interface FilterBarProps {
  filters: DocumentFilters
  onChange: (filters: DocumentFilters) => void
  onSearch: () => void
  onReset: () => void
  collections: KnowledgeCollection[]
}

const DOCUMENT_TYPES = ['Policy', 'Procedure', 'Template', 'Guide', 'Reference', 'Report', 'Other']
const CLASSIFICATION_LEVELS = ['Public', 'Internal', 'Confidential', 'Restricted']
const SDLC_OPTIONS = ['Planning', 'Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Maintenance', 'All']
const DOMAIN_OPTIONS = ['HR', 'Finance', 'Legal', 'IT', 'Operations', 'Product', 'Sales', 'Marketing', 'Other']
const STATUS_OPTIONS = ['draft', 'active', 'archived']

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
}

export function FilterBar({ filters, onChange, onSearch, onReset, collections }: FilterBarProps) {
  const set = (key: keyof DocumentFilters) => (value: string) =>
    onChange({ ...filters, [key]: value || undefined })

  return (
    <div
      style={{
        backgroundColor: appTheme.cardBg,
        border: `1px solid ${appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: appTheme.font,
      }}
    >
      {/* Row 1 */}
      <div style={gridStyle}>
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={(e) => set('search')(e.target.value)}
          placeholder="Document Title"
          style={inputStyle}
        />

        <select
          value={filters.document_type ?? ''}
          onChange={(e) => set('document_type')(e.target.value)}
          style={{ ...selectStyle, color: filters.document_type ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Document Type</option>
          {DOCUMENT_TYPES.map((t) => <option key={t} value={t} style={{ color: appTheme.textPrimary }}>{t}</option>)}
        </select>

        <select
          value={filters.knowledge_collection_id ?? ''}
          onChange={(e) => set('knowledge_collection_id')(e.target.value)}
          style={{ ...selectStyle, color: filters.knowledge_collection_id ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Document Collection</option>
          {collections.map((c) => (
            <option key={c.knowledge_collection_id} value={c.knowledge_collection_id} style={{ color: appTheme.textPrimary }}>
              {c.collection_name}
            </option>
          ))}
        </select>

        <select
          value={filters.classification_level ?? ''}
          onChange={(e) => set('classification_level')(e.target.value)}
          style={{ ...selectStyle, color: filters.classification_level ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Classification Level</option>
          {CLASSIFICATION_LEVELS.map((l) => <option key={l} value={l} style={{ color: appTheme.textPrimary }}>{l}</option>)}
        </select>
      </div>

      {/* Row 2 */}
      <div style={gridStyle}>
        <select
          value={filters.sdlc ?? ''}
          onChange={(e) => set('sdlc')(e.target.value)}
          style={{ ...selectStyle, color: filters.sdlc ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">SDLC</option>
          {SDLC_OPTIONS.map((s) => <option key={s} value={s} style={{ color: appTheme.textPrimary }}>{s}</option>)}
        </select>

        <select
          value={filters.domain ?? ''}
          onChange={(e) => set('domain')(e.target.value)}
          style={{ ...selectStyle, color: filters.domain ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Domain</option>
          {DOMAIN_OPTIONS.map((d) => <option key={d} value={d} style={{ color: appTheme.textPrimary }}>{d}</option>)}
        </select>

        <input
          type="text"
          value={filters.persona ?? ''}
          onChange={(e) => set('persona')(e.target.value)}
          placeholder="Persona Relevance"
          style={inputStyle}
        />

        <select
          value={filters.status ?? ''}
          onChange={(e) => set('status')(e.target.value)}
          style={{ ...selectStyle, color: filters.status ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} style={{ color: appTheme.textPrimary }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onSearch}
          style={{
            height: '40px',
            padding: '0 24px',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            backgroundColor: appTheme.cyan,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: appTheme.font,
          }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={onReset}
          style={{
            height: '40px',
            padding: '0 18px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: appTheme.textSubtle,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: appTheme.font,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
