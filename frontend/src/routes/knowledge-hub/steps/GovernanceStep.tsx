import { useState } from 'react'
import { appTheme, inputStyle, sectionLabelStyle } from '@/lib/theme'
import type { GovernanceData, WizardAction } from '../AddDocumentWizard'

interface GovernanceStepProps {
  data: GovernanceData
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
  onNext: () => void
}

const CLASSIFICATION_LEVELS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'><path d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2394A3B8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

export function GovernanceStep({ data, dispatch, onBack, onNext }: GovernanceStepProps) {
  const [errors, setErrors] = useState<{ classification_level?: string }>({})

  const set = (key: keyof GovernanceData) => (value: string) =>
    dispatch({ type: 'SET_GOVERNANCE', data: { [key]: value } })

  const validate = () => {
    const errs: { classification_level?: string } = {}
    if (!data.classification_level) errs.classification_level = 'Classification level is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={sectionLabelStyle}>Governance</div>

      {/* Classification Level */}
      <FieldWrap label="Data Classification Level" required error={errors.classification_level}>
        <select
          value={data.classification_level}
          onChange={(e) => set('classification_level')(e.target.value)}
          style={{
            ...selectStyle,
            color: data.classification_level ? appTheme.textPrimary : appTheme.textPlaceholder,
            borderColor: errors.classification_level ? appTheme.danger : appTheme.border,
          }}
        >
          <option value="">Select level…</option>
          {CLASSIFICATION_LEVELS.map((l) => <option key={l} value={l} style={{ color: appTheme.textPrimary }}>{l}</option>)}
        </select>
      </FieldWrap>

      {/* Owner */}
      <FieldWrap label="Document Owner">
        <input
          type="text"
          value={data.document_owner}
          onChange={(e) => set('document_owner')(e.target.value)}
          placeholder="e.g. Jane Smith"
          style={inputStyle}
        />
      </FieldWrap>

      {/* Version */}
      <FieldWrap label="Version Number">
        <input
          type="text"
          value={data.version_number}
          onChange={(e) => set('version_number')(e.target.value)}
          placeholder="e.g. 1.0"
          style={{ ...inputStyle, maxWidth: '200px' }}
        />
      </FieldWrap>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FieldWrap label="Effective Date">
          <input
            type="date"
            value={data.effective_date}
            onChange={(e) => set('effective_date')(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>

        <FieldWrap label="Review Date">
          <input
            type="date"
            value={data.review_date}
            onChange={(e) => set('review_date')(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

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

function FieldWrap({ label, required, error, children }: { label?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: appTheme.textSecondary, marginBottom: '4px', fontFamily: appTheme.font }}>
          {label}{required && <span style={{ color: appTheme.danger }}> *</span>}
        </label>
      )}
      {children}
      {error && <div style={{ fontSize: '12px', color: appTheme.danger, marginTop: '4px' }}>{error}</div>}
    </div>
  )
}
