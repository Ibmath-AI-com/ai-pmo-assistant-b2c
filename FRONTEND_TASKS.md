# Knowledge Hub — Frontend Implementation Tasks

## Stack Reference
- React 19 + TypeScript, Vite 8, Tailwind CSS v4
- TanStack Query v5, Axios (`@/lib/api/client`), Zustand v5
- React Router v7, shadcn/ui (Base UI primitives)
- Path alias: `@/` → `src/`

---

## Task 1 — API Module

**File:** `src/lib/api/knowledge.ts`

Create a typed API module that wraps all backend Knowledge Hub endpoints.

### Types to define:

```typescript
// Collections
interface KnowledgeCollection {
  knowledge_collection_id: string
  collection_name: string
  collection_code: string
  description: string | null
  status: 'active' | 'inactive'
  document_count: number
  created_at: string
}

// Documents
interface KnowledgeDocument {
  knowledge_document_id: string
  knowledge_collection_id: string
  title: string
  document_type: string | null
  summary_description: string | null
  version_number: string | null
  source_code: string | null
  status: 'draft' | 'active' | 'archived' | 'deleted'
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

interface DocumentListItem extends KnowledgeDocument {
  governance: {
    classification_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
    department: string | null
    document_owner: string | null
    effective_date: string | null
    review_date: string | null
    expiry_date: string | null
    review_status: string | null
  } | null
  tags: Array<{
    knowledge_document_tag_id: string
    tag_name: string
    tag_type: 'domain' | 'sdlc' | 'project_type' | 'keyword'
    status: 'active' | 'inactive'
  }>
}

// Governance
interface GovernanceUpsert {
  classification_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  department?: string
  document_owner?: string
  effective_date?: string      // ISO date YYYY-MM-DD
  review_date?: string
  expiry_date?: string
  review_status?: string
}

// Tags
interface TagUpsert {
  tag_name: string
  tag_type: 'domain' | 'sdlc' | 'project_type' | 'keyword'
}

// Access
interface AccessEntry {
  user_id: string
  access_type: 'read' | 'write' | 'admin'
}

// File upload
interface UploadedFile {
  file_id: string
  original_file_name: string
  mime_type: string
  file_size_bytes: number
  upload_status: string
  storage_path: string
  created_at: string
}

// Ingestion job
interface IngestionJob {
  document_ingestion_job_id: string
  knowledge_document_id: string
  job_type: 'initial' | 'reindex' | 'update'
  job_status: 'queued' | 'processing' | 'completed' | 'failed'
  total_chunks: number | null
  processed_chunks: number | null
  progress_pct: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

// List filters
interface DocumentFilters {
  search?: string
  document_type?: string
  knowledge_collection_id?: string
  classification_level?: string
  sdlc?: string
  domain?: string
  status?: string
  skip?: number
  limit?: number
}
```

### Functions to implement:

```typescript
// Collections
export const fetchCollections = () => apiClient.get<KnowledgeCollection[]>('/api/v1/knowledge/collections')

// Documents
export const fetchDocuments = (filters: DocumentFilters) => apiClient.get<DocumentListItem[]>('/api/v1/knowledge/documents', { params: filters })
export const fetchDocument = (id: string) => apiClient.get<DocumentListItem>(`/api/v1/knowledge/documents/${id}`)
export const createDocument = (data: {...}) => apiClient.post<KnowledgeDocument>('/api/v1/knowledge/documents', data)
export const updateDocument = (id: string, data: {...}) => apiClient.put<KnowledgeDocument>(`/api/v1/knowledge/documents/${id}`, data)
export const upsertGovernance = (id: string, data: GovernanceUpsert) => apiClient.put(...)
export const updateTags = (id: string, tags: TagUpsert[]) => apiClient.put(...)
export const updateAccess = (id: string, entries: AccessEntry[]) => apiClient.put(...)
export const updateDocumentStatus = (id: string, status: string) => apiClient.patch(...)
export const reindexDocument = (id: string) => apiClient.post(...)

// Files
export const uploadFile = (formData: FormData) => apiClient.post<UploadedFile>('/api/v1/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getFileDownloadUrl = (fileId: string) => apiClient.get<{ download_url: string }>(`/api/v1/files/${fileId}/download`)

// Jobs
export const fetchJob = (id: string) => apiClient.get<IngestionJob>(`/api/v1/knowledge/jobs/${id}`)
export const fetchJobs = () => apiClient.get<IngestionJob[]>('/api/v1/knowledge/jobs')
```

---

## Task 2 — Knowledge List Page

**File:** `src/routes/knowledge-hub/KnowledgeListPage.tsx`

### Layout

```
[Page Header]
  Title: "Knowledge Hub"
  Subtitle: "Manage your organization's knowledge documents"
  Button: "Add New Document" (primary, top-right)

[Filter Bar]  ← collapsible panel or always-visible row
  Row 1: Document Title (text input), Document Type (select), Document Collection (select), Classification Level (select)
  Row 2: SDLC (select), Domain (select), Persona Relevance (select), Status (select)
  Buttons: Search, Reset

[Data Table]
  Columns:
    - ID (truncated UUID, monospace)
    - Document Title
    - KB Collection
    - Classification Level (badge: color-coded)
    - SDLC (tag)
    - Domain (tag)
    - Persona(s) (tag list)
    - Status (badge)
    - Actions (kebab menu: View, Edit, Archive, Reindex, Delete)

[Pagination]
  "Showing X–Y of Z results"
  Prev / page numbers / Next
```

### Behavior
- On mount: fetch documents with default filters (limit=20, skip=0)
- Filter form is controlled state; hitting "Search" re-runs the query
- "Reset" clears all filter fields and re-fetches
- "Add New Document" navigates to `/knowledge-hub/new` (opens wizard)
- Actions menu:
  - **View**: navigate to `/knowledge-hub/{id}`
  - **Edit**: navigate to `/knowledge-hub/{id}/edit`
  - **Archive**: call `PATCH /status` with `status: 'archived'`, refetch list
  - **Reindex**: call `POST /{id}/reindex`, show toast
  - **Delete**: confirm dialog → call `PATCH /status` with `status: 'deleted'`, refetch

### Classification level badge colors
| Level | Color |
|---|---|
| Public | green |
| Internal | blue |
| Confidential | orange |
| Restricted | red |

### Status badge colors
| Status | Color |
|---|---|
| draft | gray |
| active | green |
| archived | yellow |
| deleted | red |

---

## Task 3 — Add Document Wizard Shell

**File:** `src/routes/knowledge-hub/AddDocumentWizard.tsx`

### Wizard layout

```
[Wizard Header]
  Title: "Add New Document"
  Step indicator: 4 steps with labels
    Step 1: Basic Information
    Step 2: Governance
    Step 3: KB Optimization
    Step 4: Extra Settings

[Step Content Area]
  ← renders the current step component

[Footer Buttons]
  Back (disabled on step 1) | Next / Submit (on step 4)
```

### Step indicator design
- Numbered circles (1–4), connected by a horizontal line
- Active: filled primary color + bold label
- Completed: check icon + muted label
- Future: outlined circle + muted label

### State management
Hold wizard state in a single `useReducer` or Zustand slice:

```typescript
interface WizardState {
  step: 1 | 2 | 3 | 4
  documentId: string | null     // set after step 1 creates the document
  fileId: string | null         // set after file upload
  basic: BasicInfoData
  governance: GovernanceData
  optimization: KBOptimizationData
  extras: ExtraSettingsData
}
```

### Navigation logic
- **Step 1 → 2**: POST `/api/v1/knowledge/documents` → save returned `knowledge_document_id` in state → advance step
- **Step 2 → 3**: PUT `/api/v1/knowledge/documents/{id}/governance` → advance step
- **Step 3 → 4**: PUT `/api/v1/knowledge/documents/{id}/tags` → advance step
- **Step 4 Submit**: PUT `/api/v1/knowledge/documents/{id}/access` (if access entries exist) → navigate to list page
- Each step shows a spinner while the API call is in flight
- On API error: show inline error message, do not advance

### Routes to add in `src/routes/index.tsx`

```typescript
{ path: 'knowledge-hub', element: <KnowledgeListPage /> },
{ path: 'knowledge-hub/new', element: <AddDocumentWizard /> },
{ path: 'knowledge-hub/:id/edit', element: <AddDocumentWizard /> },  // pre-fill mode
```

---

## Task 4 — Step 1: Basic Information

**File:** `src/routes/knowledge-hub/steps/BasicInfoStep.tsx`

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Document Title | text input | ✅ | max 500 chars |
| Document Type | select | ❌ | options: Policy, Procedure, Template, Guide, Reference, Report, Other |
| Knowledge Collection | select | ✅ | fetched from `/api/v1/knowledge/collections` |
| Summary Description | textarea | ❌ | 4 rows |
| File Upload | file input | ❌ | drag-and-drop zone + Browse button |

### File upload behavior
- Accept: `.pdf, .docx, .pptx, .xlsx, .html, .jpg, .png`
- Show selected filename + size after selection
- On "Next": if a file is selected, POST to `/api/v1/files/upload` first, store returned `file_id`
- Display upload progress (indeterminate spinner is fine)
- If no file selected: proceed without file

### Validation
- Document Title: required, non-empty
- Knowledge Collection: required (must select one)
- Show field-level error messages below each input

---

## Task 5 — Step 2: Governance

**File:** `src/routes/knowledge-hub/steps/GovernanceStep.tsx`

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Data Classification Level | select | ✅ | Public / Internal / Confidential / Restricted |
| Department | select or text input | ❌ | free-text or predefined list |
| Document Owner | text input | ❌ | person's name or email |
| Version Number | text input | ❌ | e.g. "1.0", "2.3" |
| Effective Date | date picker | ❌ | ISO date |
| Review Date | date picker | ❌ | ISO date |

### Validation
- Data Classification Level: required

### Layout
Two-column grid for date fields (Effective Date, Review Date side by side).

---

## Task 6 — Step 3: KB Optimization

**File:** `src/routes/knowledge-hub/steps/KBOptimizationStep.tsx`

### Fields

| Field | Tag Type | Notes |
|---|---|---|
| SDLC Applicability | `sdlc` | multi-select dropdown |
| Domain Tags | `domain` | multi-select dropdown |
| Project Type | `project_type` | multi-select dropdown |
| Keywords | `keyword` | free-text tag input (type + Enter to add) |
| Persona Relevance | `keyword` | multi-select or free-text |
| Priority Weight | — | select: Low / Medium / High (store as keyword tag `priority:high`) |

### SDLC options
`Planning, Requirements, Design, Development, Testing, Deployment, Maintenance, All`

### Domain options
`HR, Finance, Legal, IT, Operations, Product, Sales, Marketing, Other`

### Project Type options
`Agile, Waterfall, Hybrid, DevOps, Other`

### Behavior
- Each tag group uses its own `tag_type` value in the API payload
- Tags payload sent to `PUT /api/v1/knowledge/documents/{id}/tags` as array of `{ tag_name, tag_type }` objects
- Multi-select: show selected values as removable chips/badges inside the input

---

## Task 7 — Step 4: Extra Settings

**File:** `src/routes/knowledge-hub/steps/ExtraSettingsStep.tsx`

### Fields

| Field | Type | Notes |
|---|---|---|
| Allow External LLM Usage | toggle (boolean) | when ON, show "Select LLM" dropdown below |
| Select LLM | select | options: GPT-4o, Claude 3.5, Gemini 1.5, Other — only visible when toggle ON |
| Specific Access | toggle | when ON, show user selector below |
| Select User | text/select | user email/id input — only visible when toggle ON |
| Set Expiry Date | toggle | when ON, show date picker below |
| Expiry Date | date picker | maps to `expiry_date` in governance; only visible when toggle ON |

### Behavior
- LLM selection: stored as a keyword tag `llm:{value}` (e.g. `llm:gpt-4o`)
- Specific access: if a user is selected, POST to `PUT /api/v1/knowledge/documents/{id}/access` with `[{ user_id, access_type: 'read' }]`
- Expiry date: PATCH governance record to add `expiry_date`
- Submit button triggers all three API calls (if data present), then navigates to `/knowledge-hub` on success

### Toggle component
Use a styled toggle (switch): off = gray, on = primary color. Label sits to the right of the toggle.

---

## Task 8 — Shared UI Components

### 8a. `src/components/knowledge/FilterBar.tsx`
Reusable filter panel for the list page. Props:
```typescript
interface FilterBarProps {
  filters: DocumentFilters
  onChange: (filters: DocumentFilters) => void
  onSearch: () => void
  onReset: () => void
  collections: KnowledgeCollection[]
}
```

### 8b. `src/components/knowledge/DocumentTable.tsx`
Reusable table component. Props:
```typescript
interface DocumentTableProps {
  documents: DocumentListItem[]
  isLoading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onReindex: (id: string) => void
  onDelete: (id: string) => void
}
```

### 8c. `src/components/knowledge/ClassificationBadge.tsx`
Color-coded badge for classification levels.

### 8d. `src/components/knowledge/StatusBadge.tsx`
Color-coded badge for document status.

### 8e. `src/components/knowledge/TagChip.tsx`
Small removable chip for tag display in step 3.

### 8f. `src/components/knowledge/FileUploadZone.tsx`
Drag-and-drop file upload area with Browse button fallback.

### 8g. `src/components/knowledge/WizardStepIndicator.tsx`
Horizontal step progress indicator with labels.

---

## Task 9 — TanStack Query Hooks

**File:** `src/lib/hooks/useKnowledge.ts`

```typescript
// List hooks
export const useCollections = () => useQuery({ queryKey: ['collections'], queryFn: fetchCollections })
export const useDocuments = (filters: DocumentFilters) => useQuery({ queryKey: ['documents', filters], queryFn: () => fetchDocuments(filters) })
export const useDocument = (id: string) => useQuery({ queryKey: ['document', id], queryFn: () => fetchDocument(id), enabled: !!id })
export const useJob = (id: string) => useQuery({ queryKey: ['job', id], queryFn: () => fetchJob(id), refetchInterval: 3000 }) // poll every 3s

// Mutation hooks
export const useCreateDocument = () => useMutation({ mutationFn: createDocument, ... })
export const useUpdateGovernance = () => useMutation({ mutationFn: ({ id, data }) => upsertGovernance(id, data), ... })
export const useUpdateTags = () => useMutation({ mutationFn: ({ id, tags }) => updateTags(id, tags), ... })
export const useUpdateAccess = () => useMutation({ mutationFn: ({ id, entries }) => updateAccess(id, entries), ... })
export const useUpdateDocumentStatus = () => useMutation({ mutationFn: ({ id, status }) => updateDocumentStatus(id, status), onSuccess: () => queryClient.invalidateQueries(['documents']) })
export const useUploadFile = () => useMutation({ mutationFn: uploadFile })
export const useReindexDocument = () => useMutation({ mutationFn: reindexDocument })
```

---

## Task 10 — Ingestion Job Status Polling

**File:** `src/components/knowledge/IngestionJobStatus.tsx`

After a document is created and a file is attached, show an inline status indicator that polls `GET /api/v1/knowledge/jobs/{id}` every 3 seconds until `job_status` is `completed` or `failed`.

```
[Processing indicator]
  Spinner | "Indexing document... 42%"
  Progress bar (0–100%)
  
[On complete]
  Check icon | "Document indexed successfully"
  
[On failure]
  Warning icon | "Indexing failed: {error_message}"
  Retry button → POST /reindex
```

Use `useJob` hook with `refetchInterval: 3000`, stop polling when status is terminal.

---

## Implementation Order

1. **Task 1** — API module (`src/lib/api/knowledge.ts`)
2. **Task 9** — Query hooks (`src/lib/hooks/useKnowledge.ts`)
3. **Task 8** — Shared UI components
4. **Task 2** — Knowledge List Page (uses hooks + table + filter bar)
5. **Task 3** — Wizard shell + routing
6. **Tasks 4–7** — Wizard step components in order
7. **Task 10** — Ingestion job status component (can be added to step 1 after submit)

---

## File Checklist

```
src/
├── lib/
│   ├── api/
│   │   └── knowledge.ts                          ← Task 1
│   └── hooks/
│       └── useKnowledge.ts                       ← Task 9
├── components/
│   └── knowledge/
│       ├── FilterBar.tsx                         ← Task 8a
│       ├── DocumentTable.tsx                     ← Task 8b
│       ├── ClassificationBadge.tsx               ← Task 8c
│       ├── StatusBadge.tsx                       ← Task 8d
│       ├── TagChip.tsx                           ← Task 8e
│       ├── FileUploadZone.tsx                    ← Task 8f
│       ├── WizardStepIndicator.tsx               ← Task 8g
│       └── IngestionJobStatus.tsx                ← Task 10
└── routes/
    └── knowledge-hub/
        ├── KnowledgeListPage.tsx                 ← Task 2
        ├── AddDocumentWizard.tsx                 ← Task 3
        └── steps/
            ├── BasicInfoStep.tsx                 ← Task 4
            ├── GovernanceStep.tsx                ← Task 5
            ├── KBOptimizationStep.tsx            ← Task 6
            └── ExtraSettingsStep.tsx             ← Task 7
```

---

## Backend Endpoints Consumed

| Task | Endpoint |
|---|---|
| Collections dropdown | `GET /api/v1/knowledge/collections` |
| List documents | `GET /api/v1/knowledge/documents?{filters}` |
| Create document | `POST /api/v1/knowledge/documents` |
| Update basic info | `PUT /api/v1/knowledge/documents/{id}` |
| Save governance | `PUT /api/v1/knowledge/documents/{id}/governance` |
| Save tags | `PUT /api/v1/knowledge/documents/{id}/tags` |
| Save access | `PUT /api/v1/knowledge/documents/{id}/access` |
| Update status | `PATCH /api/v1/knowledge/documents/{id}/status` |
| Reindex | `POST /api/v1/knowledge/documents/{id}/reindex` |
| Upload file | `POST /api/v1/files/upload` |
| Download file | `GET /api/v1/files/{id}/download` |
| Poll job status | `GET /api/v1/knowledge/jobs/{id}` |
