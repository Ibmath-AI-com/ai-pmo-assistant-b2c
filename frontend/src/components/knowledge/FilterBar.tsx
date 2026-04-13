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
const STATUS_OPTIONS = ['draft', 'active', 'archived', 'deleted']

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterBar({ filters, onChange, onSearch, onReset, collections }: FilterBarProps) {
  const set = (key: keyof DocumentFilters) => (value: string) =>
    onChange({ ...filters, [key]: value || undefined })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Document Title</label>
          <input
            type="text"
            value={filters.search ?? ''}
            onChange={(e) => set('search')(e.target.value)}
            placeholder="Search title..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <Select
          label="Document Type"
          value={filters.document_type ?? ''}
          onChange={set('document_type')}
          options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
          placeholder="All types"
        />

        <Select
          label="Document Collection"
          value={filters.knowledge_collection_id ?? ''}
          onChange={set('knowledge_collection_id')}
          options={collections.map((c) => ({
            value: c.knowledge_collection_id,
            label: c.collection_name,
          }))}
          placeholder="All collections"
        />

        <Select
          label="Classification Level"
          value={filters.classification_level ?? ''}
          onChange={set('classification_level')}
          options={CLASSIFICATION_LEVELS.map((l) => ({ value: l, label: l }))}
          placeholder="All levels"
        />
      </div>

      {/* Row 2 */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="SDLC"
          value={filters.sdlc ?? ''}
          onChange={set('sdlc')}
          options={SDLC_OPTIONS.map((s) => ({ value: s, label: s }))}
          placeholder="All phases"
        />

        <Select
          label="Domain"
          value={filters.domain ?? ''}
          onChange={set('domain')}
          options={DOMAIN_OPTIONS.map((d) => ({ value: d, label: d }))}
          placeholder="All domains"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Persona Relevance</label>
          <input
            type="text"
            placeholder="Any persona..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <Select
          label="Status"
          value={filters.status ?? ''}
          onChange={set('status')}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          placeholder="All statuses"
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSearch}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
        >
          Search
        </button>
      </div>
    </div>
  )
}
