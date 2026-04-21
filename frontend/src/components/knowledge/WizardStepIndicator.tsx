import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface WizardStepIndicatorProps {
  steps: Step[]
  currentStep: number // 1-based
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isActive = stepNum === currentStep
          const isLast = idx === steps.length - 1

          return (
            <li key={step.label} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    isCompleted
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : isActive
                        ? 'border-indigo-600 bg-white text-indigo-600'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`mt-1 whitespace-nowrap text-xs font-medium ${
                    isActive ? 'text-indigo-600' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
