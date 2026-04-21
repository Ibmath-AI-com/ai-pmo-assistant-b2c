import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUpdateGovernance, useUpdateAccess, useLLMModels, useKnowledgeUsers } from '@/lib/hooks/useKnowledge'
import type { ExtrasData, WizardAction } from '../AddDocumentWizard'

interface ExtraSettingsStepProps {
  data: ExtrasData
  documentId: string
  classificationLevel: string
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
  onSubmit: () => void
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  children?: React.ReactNode
}

function ToggleRow({ label, description, checked, onChange, children }: ToggleRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            checked ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {checked && children && <div className="pt-1">{children}</div>}
    </div>
  )
}

// ─── Step component ───────────────────────────────────────────────────────────

export function ExtraSettingsStep({ data, documentId, classificationLevel, dispatch, onBack, onSubmit }: ExtraSettingsStepProps) {
  const [apiError, setApiError] = useState<string | null>(null)

  const updateGovernance = useUpdateGovernance()
  const updateAccess = useUpdateAccess()
  const { data: llmModels = [] } = useLLMModels()
  const { data: users = [] } = useKnowledgeUsers()

  const set = (key: keyof ExtrasData) => (value: string | boolean) =>
    dispatch({ type: 'SET_EXTRAS', data: { [key]: value } })

  const isLoading = updateGovernance.isPending || updateAccess.isPending

  const handleSubmit = async () => {
    setApiError(null)

    try {
      // Save governance: classification + LLM model ID in review_status
      await updateGovernance.mutateAsync({
        id: documentId,
        data: {
          classification_level: classificationLevel as 'Public' | 'Internal' | 'Confidential' | 'Restricted',
          review_status: data.allowLLM && data.llmModelId ? data.llmModelId : undefined,
          expiry_date: data.setExpiry && data.expiryDate ? data.expiryDate : undefined,
        },
      })

      // Save user access if specific access is toggled on with a user selected
      if (data.specificAccess && data.specificAccessUserId) {
        await updateAccess.mutateAsync({
          id: documentId,
          entries: [{ user_id: data.specificAccessUserId, access_type: 'read' }],
        })
      }

      onSubmit()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
        : typeof detail === 'string'
          ? detail
          : 'Failed to save settings. Please try again.'
      setApiError(msg)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Extra Settings</h2>
        <p className="mt-0.5 text-sm text-gray-500">Configure access control and additional options.</p>
      </div>

      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Allow External LLM Usage */}
      <ToggleRow
        label="Allow External LLM Usage"
        description="Permit this document to be used by an external AI model."
        checked={data.allowLLM}
        onChange={(v) => {
          set('allowLLM')(v)
          if (!v) set('llmModelId')('')
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Select LLM Model</label>
          <select
            value={data.llmModelId}
            onChange={(e) => set('llmModelId')(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-[320px]"
          >
            <option value="">Select model…</option>
            {llmModels.map((m) => (
              <option key={m.llm_model_id} value={m.llm_model_id}>
                {m.provider_name} — {m.model_name}
              </option>
            ))}
          </select>
        </div>
      </ToggleRow>

      {/* Specific Access */}
      <ToggleRow
        label="Specific Access"
        description="Grant read access to a specific user."
        checked={data.specificAccess}
        onChange={(v) => {
          set('specificAccess')(v)
          if (!v) set('specificAccessUserId')('')
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Select User</label>
          <select
            value={data.specificAccessUserId}
            onChange={(e) => set('specificAccessUserId')(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-[320px]"
          >
            <option value="">Select user…</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.username} ({u.email})
              </option>
            ))}
          </select>
        </div>
      </ToggleRow>

      {/* Set Expiry Date */}
      <ToggleRow
        label="Set Expiry Date"
        description="Automatically exclude this document from retrieval after a date."
        checked={data.setExpiry}
        onChange={(v) => set('setExpiry')(v)}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Expiry Date</label>
          <input
            type="date"
            value={data.expiryDate}
            onChange={(e) => set('expiryDate')(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-[220px]"
          />
        </div>
      </ToggleRow>

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
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit
        </button>
      </div>
    </div>
  )
}
