// ─── Primitive value held by any single field ─────────────────────────────────

export type FieldValue = string | boolean | number

// Generic list-item whose keys come from FieldDef.key
export type ListItem = Record<string, FieldValue>

// Full renderer state: scalar FieldValues + typed arrays
export type FormState = Record<string, unknown>

// ─── Domain item types ────────────────────────────────────────────────────────

export interface SignatoryItem {
  name: string
  role: string
  date: string
  approved: boolean
}

export interface SwotItem {
  description: string
  importance?: string
}

export interface KeyResult {
  id: string
  result: string
  target: string
  current: string
  unit: string
  weight: string
}

export interface OkrObjective {
  id: string
  objective: string
  perspective: string
  owner: string
  status: string
  keyResults: KeyResult[]
}

export interface BscObjective {
  id: string
  perspective: string
  objective: string
  description: string
  cause: string
}

export interface WbsItem {
  id: string
  wbsCode: string
  level: number
  name: string
  deliverable: string
  owner: string
  effort: string
  status: string
}

export interface PhaseItem {
  id: string
  phase: string
  start: string
  end: string
  status: string
  keyActivities: string
  milestones: string
  benefits: string
}

// ─── Schema / template-definition types ──────────────────────────────────────

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'date' | 'textarea' | 'select' | 'toggle' | 'range' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: string[]
  rows?: number
  default?: string | boolean
  small?: boolean
  span?: number
}

export interface RowDef {
  columns: number
  fields: FieldDef[]
}

export interface TableColumn {
  key: string
  label: string
  type: 'text' | 'date' | 'select' | 'static' | 'range'
  options?: string[]
  width?: number
  static?: boolean
}

export interface ClosureItem {
  key: string
  label: string
  color: 'green' | 'red' | 'yellow' | 'blue'
  rows?: number
  placeholder?: string
}

export interface ListConfig {
  idPrefix: string
  addLabel: string
  defaultItem: ListItem
  itemLayout: RowDef[]
}

export interface TabConfig {
  id: string
  label: string
  type?: string
  listConfig?: ListConfig
  addLabel?: string
  itemId?: string
  columns?: number
  fields?: FieldDef[]
}

export interface Section {
  id: string
  title?: string
  type: 'form' | 'list' | 'table' | 'scope' | 'closure' | 'signatory' | 'tabs' | 'swot' | 'status' | 'bsc_map' | 'phase_list' | 'okr' | 'wbs'
  // form
  columns?: number
  fields?: FieldDef[]
  rows?: RowDef[]
  // list
  listConfig?: ListConfig
  itemId?: string
  // tabs
  tabs?: TabConfig[]
  // table
  tableColumns?: TableColumn[]
  defaultRow?: ListItem
  addLabel?: string
  // scope
  scopeFields?: { key: string; label: string; rows?: number; placeholder?: string }[]
  // closure
  closureItems?: ClosureItem[]
  closureColumns?: number
  // bsc_map
  perspectives?: { id: string; label: string; color: string; bg: string }[]
  // status
  progressKey?: string
  statusKey?: string
  healthKeys?: { label: string; key: string }[]
  budgetKeys?: { spent: string; total: string }
  // phase_list
  phaseFields?: RowDef[]
  phaseAddLabel?: string
}

export interface TemplateUI {
  title?: string
  subtitle?: string
  submitLabel?: string
  saveLabel?: string
  sections: Section[]
}

export interface TemplateBody {
  ui: TemplateUI
}
