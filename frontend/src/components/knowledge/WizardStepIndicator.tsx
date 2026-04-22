import { appTheme } from '@/lib/theme'

interface Step {
  label: string
}

interface WizardStepIndicatorProps {
  steps: Step[]
  currentStep: number // 1-based
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
      {steps.map((step, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        return (
          <div
            key={step.label}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: i < steps.length - 1 ? 1 : 0 }}
          >
            <button
              type="button"
              disabled
              style={{
                backgroundColor: isActive ? appTheme.accentBlue : appTheme.stepInactiveBg,
                color: isActive ? '#FFFFFF' : appTheme.stepInactiveText,
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'default',
                whiteSpace: 'nowrap',
                fontFamily: appTheme.font,
              }}
            >
              {stepNum}. {step.label}
            </button>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: '1px',
                  backgroundColor: appTheme.connectorLine,
                  flex: 1,
                  margin: '0 4px',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
