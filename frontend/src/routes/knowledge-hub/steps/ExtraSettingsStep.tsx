import { useState } from 'react'
import { appTheme, inputStyle, sectionLabelStyle } from '@/lib/theme'
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: '44px',
        height: '24px',
        flexShrink: 0,
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: checked ? appTheme.accentBlue : appTheme.stepInactiveBg,
        transition: 'background-color 200ms',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 200ms',
        }}
      />
    </button>
  )
}

function ToggleRow({ label, description, checked, onChange, children }: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        border: `1px solid ${appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        backgroundColor: '#F8FAFC',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: appTheme.font,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: appTheme.textPrimary }}>{label}</p>
          {description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: appTheme.textSecondary }}>{description}</p>}
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {checked && children && <div>{children}</div>}
    </div>
  )
}

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
      await updateGovernance.mutateAsync({
        id: documentId,
        data: {
          classification_level: classificationLevel as 'Public' | 'Internal' | 'Confidential' | 'Restricted',
          allow_external_llm_usage: data.allowLLM,
          llm_model_id: data.allowLLM && data.llmModelId ? data.llmModelId : undefined,
          expiry_date: data.setExpiry && data.expiryDate ? data.expiryDate : undefined,
        },
      })

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={sectionLabelStyle}>Extra Settings</div>

      {apiError && (
        <div style={{ padding: '10px 12px', borderRadius: appTheme.radiusInput, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: appTheme.danger, fontSize: '13px' }}>
          {apiError}
        </div>
      )}

      <ToggleRow
        label="Allow External LLM Usage"
        description="Permit this document to be used by an external AI model."
        checked={data.allowLLM}
        onChange={(v) => { set('allowLLM')(v); if (!v) set('llmModelId')('') }}
      >
        <select
          value={data.llmModelId}
          onChange={(e) => set('llmModelId')(e.target.value)}
          style={{ ...selectStyle, color: data.llmModelId ? appTheme.textPrimary : appTheme.textPlaceholder, maxWidth: '320px' }}
        >
          <option value="">Select LLM model…</option>
          {llmModels.map((m) => (
            <option key={m.llm_model_id} value={m.llm_model_id} style={{ color: appTheme.textPrimary }}>
              {m.provider_name} — {m.model_name}
            </option>
          ))}
        </select>
      </ToggleRow>

      <ToggleRow
        label="Specific Access"
        description="Grant read access to a specific user."
        checked={data.specificAccess}
        onChange={(v) => { set('specificAccess')(v); if (!v) set('specificAccessUserId')('') }}
      >
        <select
          value={data.specificAccessUserId}
          onChange={(e) => set('specificAccessUserId')(e.target.value)}
          style={{ ...selectStyle, color: data.specificAccessUserId ? appTheme.textPrimary : appTheme.textPlaceholder, maxWidth: '320px' }}
        >
          <option value="">Select user…</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id} style={{ color: appTheme.textPrimary }}>
              {u.username} ({u.email})
            </option>
          ))}
        </select>
      </ToggleRow>

      <ToggleRow
        label="Set Expiry Date"
        description="Automatically exclude this document from retrieval after a date."
        checked={data.setExpiry}
        onChange={(v) => set('setExpiry')(v)}
      >
        <input
          type="date"
          value={data.expiryDate}
          onChange={(e) => set('expiryDate')(e.target.value)}
          style={{ ...inputStyle, maxWidth: '220px' }}
        />
      </ToggleRow>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            height: '40px',
            padding: '0 22px',
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
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            height: '40px',
            padding: '0 28px',
            border: 'none',
            borderRadius: appTheme.radiusInput,
            backgroundColor: appTheme.primaryBlue,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontFamily: appTheme.font,
          }}
        >
          {isLoading ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
