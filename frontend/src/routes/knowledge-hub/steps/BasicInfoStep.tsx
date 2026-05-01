import { useState } from 'react'
import { appTheme, inputStyle, textareaStyle, sectionLabelStyle } from '@/lib/theme'
import { FileUploadZone } from '@/components/knowledge/FileUploadZone'
import { useCollections, useCreateCollection } from '@/lib/hooks/useKnowledge'
import type { BasicInfoData, WizardAction } from '../AddDocumentWizard'

interface BasicInfoStepProps {
  data: BasicInfoData
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  isEditMode?: boolean
}

const DOCUMENT_TYPES = ['Policy', 'Procedure', 'Template', 'Guide', 'Reference', 'Report', 'Other']

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

interface FieldError {
  title?: string
  knowledge_collection_id?: string
}

function NewCollectionForm({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createCollection = useCreateCollection()

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Collection name is required'); return }
    setError(null)
    try {
      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50) ||
        `col_${Date.now().toString(36)}`
      const created = await createCollection.mutateAsync({
        collection_code: slugify(trimmed),
        collection_name: trimmed,
      })
      onCreated(created.knowledge_collection_id)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
          : err instanceof Error
            ? err.message
            : 'Failed to create collection.'
      setError(msg)
    }
  }

  return (
    <div
      style={{
        marginTop: '6px',
        padding: '12px',
        border: `1px solid ${appTheme.borderSoft}`,
        borderRadius: appTheme.radiusCard,
        backgroundColor: '#F0F4FF',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: appTheme.font,
      }}
    >
      <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: appTheme.accentBlue }}>
        New Collection
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
        placeholder="Collection name"
        autoFocus
        style={inputStyle}
      />
      {error && <p style={{ margin: 0, fontSize: '12px', color: appTheme.danger }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleCreate}
          disabled={createCollection.isPending}
          style={{
            height: '32px',
            padding: '0 16px',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            backgroundColor: appTheme.accentBlue,
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 500,
            cursor: createCollection.isPending ? 'not-allowed' : 'pointer',
            opacity: createCollection.isPending ? 0.7 : 1,
            fontFamily: appTheme.font,
          }}
        >
          {createCollection.isPending ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: '32px',
            padding: '0 14px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: appTheme.textSubtle,
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: appTheme.font,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function BasicInfoStep({ data, dispatch, onNext, isEditMode }: BasicInfoStepProps) {
  const [errors, setErrors] = useState<FieldError>({})
  const [showNewCollection, setShowNewCollection] = useState(false)

  const { data: collections = [] } = useCollections()

  const set = (key: keyof BasicInfoData) => (value: string | File | null) =>
    dispatch({ type: 'SET_BASIC', data: { [key]: value } })

  const validate = (): boolean => {
    const errs: FieldError = {}
    if (!data.title.trim()) errs.title = 'Document title is required'
    if (!data.knowledge_collection_id) errs.knowledge_collection_id = 'Please select a collection'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={sectionLabelStyle}>Basic Information</div>

      {/* Document Title */}
      <FieldWrap error={errors.title}>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set('title')(e.target.value)}
          maxLength={500}
          placeholder="Document Title"
          style={{
            ...inputStyle,
            borderColor: errors.title ? appTheme.danger : appTheme.border,
          }}
        />
      </FieldWrap>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <select
          value={data.document_type}
          onChange={(e) => set('document_type')(e.target.value)}
          style={{ ...selectStyle, color: data.document_type ? appTheme.textPrimary : appTheme.textPlaceholder }}
        >
          <option value="">Document Type</option>
          {DOCUMENT_TYPES.map((t) => <option key={t} value={t} style={{ color: appTheme.textPrimary }}>{t}</option>)}
        </select>

        <div>
          <FieldWrap error={errors.knowledge_collection_id}>
            <select
              value={data.knowledge_collection_id}
              onChange={(e) => {
                set('knowledge_collection_id')(e.target.value)
                setShowNewCollection(false)
              }}
              style={{
                ...selectStyle,
                color: data.knowledge_collection_id ? appTheme.textPrimary : appTheme.textPlaceholder,
                borderColor: errors.knowledge_collection_id ? appTheme.danger : appTheme.border,
              }}
            >
              <option value="">Knowledge Collection</option>
              {collections.map((c) => (
                <option key={c.knowledge_collection_id} value={c.knowledge_collection_id} style={{ color: appTheme.textPrimary }}>
                  {c.collection_name}
                </option>
              ))}
            </select>
          </FieldWrap>

          {!showNewCollection ? (
            <button
              type="button"
              onClick={() => setShowNewCollection(true)}
              style={{
                marginTop: '5px',
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12px',
                color: appTheme.accentBlue,
                cursor: 'pointer',
                fontFamily: appTheme.font,
              }}
            >
              + New collection
            </button>
          ) : (
            <NewCollectionForm
              onCreated={(id) => {
                set('knowledge_collection_id')(id)
                setShowNewCollection(false)
              }}
              onCancel={() => setShowNewCollection(false)}
            />
          )}
        </div>
      </div>

      {/* Summary */}
      <textarea
        value={data.summary_description}
        onChange={(e) => set('summary_description')(e.target.value)}
        rows={4}
        placeholder="Summary Description"
        style={textareaStyle}
      />

      {/* File Upload — create mode only */}
      {!isEditMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: appTheme.textSecondary }}>
            Attach File
          </label>
          <FileUploadZone
            onFileSelect={(file) => dispatch({ type: 'SET_BASIC', data: { file, fileId: null } })}
            selectedFile={data.file}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={handleNext}
          style={{
            height: '40px',
            padding: '0 28px',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            backgroundColor: appTheme.primaryBlue,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: appTheme.font,
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function FieldWrap({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <div style={{ fontSize: '12px', color: appTheme.danger, marginTop: '4px' }}>{error}</div>}
    </div>
  )
}
