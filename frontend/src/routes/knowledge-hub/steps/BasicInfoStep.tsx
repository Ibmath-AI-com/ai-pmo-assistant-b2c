import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FileUploadZone } from '@/components/knowledge/FileUploadZone'
import { IngestionJobStatus } from '@/components/knowledge/IngestionJobStatus'
import { useCollections, useCreateDocument, useUpdateDocument, useUploadFile, useJobs } from '@/lib/hooks/useKnowledge'
import type { BasicInfoData, WizardAction } from '../AddDocumentWizard'

interface BasicInfoStepProps {
  data: BasicInfoData
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  /** Present in edit mode — skips document creation and updates instead */
  editDocumentId?: string
}

const DOCUMENT_TYPES = ['Policy', 'Procedure', 'Template', 'Guide', 'Reference', 'Report', 'Other']

interface FieldError {
  title?: string
  knowledge_collection_id?: string
}

export function BasicInfoStep({ data, dispatch, onNext, editDocumentId }: BasicInfoStepProps) {
  const isEditMode = !!editDocumentId

  const [errors, setErrors] = useState<FieldError>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [createdDocId, setCreatedDocId] = useState<string | null>(null)

  const { data: collections = [] } = useCollections()
  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()
  const uploadFile = useUploadFile()

  // Poll jobs only after a document has been created with a file
  const { data: jobs = [] } = useJobs()
  const trackId = createdDocId ?? (isEditMode ? editDocumentId : null)
  const ingestionJob = trackId
    ? jobs.find((j) => j.knowledge_document_id === trackId) ?? null
    : null

  const set = (key: keyof BasicInfoData) => (value: string | File | null) =>
    dispatch({ type: 'SET_BASIC', data: { [key]: value } })

  const validate = (): boolean => {
    const errs: FieldError = {}
    if (!data.title.trim()) errs.title = 'Document title is required'
    if (!data.knowledge_collection_id) errs.knowledge_collection_id = 'Please select a collection'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    setApiError(null)

    try {
      if (isEditMode) {
        // Edit mode: update existing document (no file re-upload per use case spec)
        await updateDocument.mutateAsync({
          id: editDocumentId,
          data: {
            title: data.title.trim(),
            document_type: data.document_type || undefined,
            knowledge_collection_id: data.knowledge_collection_id,
            summary_description: data.summary_description || undefined,
          },
        })
        onNext()
        return
      }

      // Create mode: upload file then create document
      let fileId: string | null = data.fileId
      if (data.file && !fileId) {
        const formData = new FormData()
        formData.append('file', data.file)
        const uploaded = await uploadFile.mutateAsync(formData)
        fileId = uploaded.file_id
        dispatch({ type: 'SET_BASIC', data: { fileId } })
      }

      const doc = await createDocument.mutateAsync({
        title: data.title.trim(),
        document_type: data.document_type || undefined,
        knowledge_collection_id: data.knowledge_collection_id,
        summary_description: data.summary_description || undefined,
        source_code: fileId ?? undefined,
      })

      dispatch({ type: 'SET_DOCUMENT_ID', id: doc.knowledge_document_id })
      if (fileId) setCreatedDocId(doc.knowledge_document_id)
      onNext()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
        : typeof detail === 'string'
          ? detail
          : `Failed to ${isEditMode ? 'update' : 'create'} document. Please try again.`
      setApiError(msg)
    }
  }

  const isLoading = createDocument.isPending || updateDocument.isPending || uploadFile.isPending

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-0.5 text-sm text-gray-500">Enter the core details about this document.</p>
      </div>

      {apiError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {apiError}
        </div>
      )}

      {/* Document Title */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Document Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set('title')(e.target.value)}
          maxLength={500}
          placeholder="e.g. API Security Policy v2"
          className={`rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
            errors.title
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Document Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Document Type</label>
          <select
            value={data.document_type}
            onChange={(e) => set('document_type')(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select type…</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Knowledge Collection */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Knowledge Collection <span className="text-red-500">*</span>
          </label>
          <select
            value={data.knowledge_collection_id}
            onChange={(e) => set('knowledge_collection_id')(e.target.value)}
            className={`rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
              errors.knowledge_collection_id
                ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          >
            <option value="">Select collection…</option>
            {collections.map((c) => (
              <option key={c.knowledge_collection_id} value={c.knowledge_collection_id}>
                {c.collection_name}
              </option>
            ))}
          </select>
          {errors.knowledge_collection_id && (
            <p className="text-xs text-red-600">{errors.knowledge_collection_id}</p>
          )}
        </div>
      </div>

      {/* Summary Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Summary Description</label>
        <textarea
          value={data.summary_description}
          onChange={(e) => set('summary_description')(e.target.value)}
          rows={4}
          placeholder="Briefly describe what this document covers…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* File Upload — hidden in edit mode per use case spec */}
      {!isEditMode && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Attach File</label>
          <FileUploadZone
            onFileSelect={(file) => {
              dispatch({ type: 'SET_BASIC', data: { file, fileId: null } })
            }}
            selectedFile={data.file}
          />
          {uploadFile.isPending && (
            <p className="flex items-center gap-1.5 text-xs text-indigo-600">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading file…
            </p>
          )}
          {ingestionJob && (
            <div className="mt-1">
              <IngestionJobStatus
                jobId={ingestionJob.document_ingestion_job_id}
                documentId={ingestionJob.knowledge_document_id}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Next
        </button>
      </div>
    </div>
  )
}
