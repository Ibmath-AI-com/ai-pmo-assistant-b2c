import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdateGovernance, useUpdateDocument } from '@/lib/hooks/useKnowledge'
import type { GovernanceData, WizardAction } from '../AddDocumentWizard'

interface GovernanceStepProps {
  data: GovernanceData
  documentId: string
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
  onNext: () => void
}

const CLASSIFICATION_LEVELS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const
const DEPARTMENTS = ['HR', 'Finance', 'Legal', 'IT', 'Operations', 'Product', 'Sales', 'Marketing', 'Other']

export function GovernanceStep({ data, documentId, dispatch, onBack, onNext }: GovernanceStepProps) {
  const [errors, setErrors] = useState<{ classification_level?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const updateGovernance = useUpdateGovernance()
  const updateDocument = useUpdateDocument()

  const set = (key: keyof GovernanceData) => (value: string) =>
    dispatch({ type: 'SET_GOVERNANCE', data: { [key]: value } })

  const validate = () => {
    const errs: { classification_level?: string } = {}
    if (!data.classification_level) errs.classification_level = 'Classification level is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return
    setApiError(null)

    try {
      await Promise.all([
        updateGovernance.mutateAsync({
          id: documentId,
          data: {
            classification_level: data.classification_level as 'Public' | 'Internal' | 'Confidential' | 'Restricted',
            department: data.department || undefined,
            document_owner: data.document_owner || undefined,
            effective_date: data.effective_date || undefined,
            review_date: data.review_date || undefined,
          },
        }),
        data.version_number
          ? updateDocument.mutateAsync({ id: documentId, data: { version_number: data.version_number } })
          : Promise.resolve(),
      ])
      onNext()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
        : typeof detail === 'string'
          ? detail
          : 'Failed to save governance. Please try again.'
      setApiError(msg)
    }
  }

  const isLoading = updateGovernance.isPending || updateDocument.isPending

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Governance</h2>
        <p className="mt-0.5 text-sm text-gray-500">Set classification and ownership for this document.</p>
      </div>

      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Data Classification Level */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Data Classification Level <span className="text-red-500">*</span>
        </label>
        <select
          value={data.classification_level}
          onChange={(e) => set('classification_level')(e.target.value)}
          className={`rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
            errors.classification_level
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        >
          <option value="">Select level…</option>
          {CLASSIFICATION_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {errors.classification_level && (
          <p className="text-xs text-red-600">{errors.classification_level}</p>
        )}
      </div>

      {/* Department + Document Owner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Department</label>
          <select
            value={data.department}
            onChange={(e) => set('department')(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Document Owner</label>
          <input
            type="text"
            value={data.document_owner}
            onChange={(e) => set('document_owner')(e.target.value)}
            placeholder="e.g. Jane Smith"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Version Number */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Version Number</label>
        <input
          type="text"
          value={data.version_number}
          onChange={(e) => set('version_number')(e.target.value)}
          placeholder="e.g. 1.0"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-[200px]"
        />
      </div>

      {/* Effective Date + Review Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Effective Date</label>
          <input
            type="date"
            value={data.effective_date}
            onChange={(e) => set('effective_date')(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Review Date</label>
          <input
            type="date"
            value={data.review_date}
            onChange={(e) => set('review_date')(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Back
        </button>
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
