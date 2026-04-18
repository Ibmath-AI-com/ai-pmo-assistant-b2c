import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useCreatePersona, usePersona } from '@/lib/hooks/usePersonas'
import { personasApi } from '@/lib/api/personas'
import { appTheme } from '@/lib/theme'
import { StepIndicator } from '@/components/persona/StepIndicator'
import { BasicInfoStep, type BasicInfoValues } from '@/components/persona/BasicInfoStep'
import { AIBehaviorStep, type AIBehaviorValues, RAG_LLM_MODES } from '@/components/persona/AIBehaviorStep'
import { KnowledgeBaseStep, type KnowledgeBaseValues } from '@/components/persona/KnowledgeBaseStep'
import { ExtraSettingsStep, type ExtraSettingsValues } from '@/components/persona/ExtraSettingsStep'
import { useToast } from '@/components/persona/Toast'

const STEPS = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'AI Behavior' },
  { id: 3, label: 'Knowledge Base' },
  { id: 4, label: 'Extra Settings' },
]

const initialBasic: BasicInfoValues = {
  persona_name: '',
  role_title: '',
  persona_category: '',
  short_description: '',
  avatar_file_name: '',
}
const initialBehavior: AIBehaviorValues = {
  system_instruction: '',
  tone_of_voice: '',
  response_format_preference: '',
  rag_llm_usage: '',
  rag_llm_selection: '',
}
const initialKb: KnowledgeBaseValues = {
  allowed_knowledge_bases: [],
  allowed_llms: [],
  sdlc_applicability: '',
  domain_tags: [],
  retrieval_depth: '',
}
const initialExtras: ExtraSettingsValues = {
  data_classification_limit: '',
  access_level: [],
  hallucination_guard_mode: true,
}

export function PersonaWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: editingId } = useParams<{ id?: string }>()
  const isViewMode = location.pathname.endsWith('/view')
  const isEdit = !!editingId && !isViewMode
  const isExistingPersona = !!editingId

  const toast = useToast()
  const { data: existing } = usePersona(editingId)

  const [step, setStep] = useState(1)
  const [basic, setBasic] = useState<BasicInfoValues>(initialBasic)
  const [behavior, setBehavior] = useState<AIBehaviorValues>(initialBehavior)
  const [kb, setKb] = useState<KnowledgeBaseValues>(initialKb)
  const [extras, setExtras] = useState<ExtraSettingsValues>(initialExtras)
  const [basicErrors, setBasicErrors] = useState<Partial<Record<keyof BasicInfoValues, string>>>({})
  const [behaviorErrors, setBehaviorErrors] = useState<Partial<Record<keyof AIBehaviorValues, string>>>({})
  const [extrasErrors, setExtrasErrors] = useState<Partial<Record<keyof ExtraSettingsValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!isExistingPersona || !existing || hydrated) return
    setBasic({
      persona_name: existing.persona_name,
      role_title: '',
      persona_category: existing.persona_category,
      short_description: existing.short_description ?? '',
      avatar_file_name: '',
    })
    if (existing.behavior_setting) {
      setBehavior((b) => ({
        ...b,
        system_instruction: existing.behavior_setting?.system_instruction ?? '',
        tone_of_voice: existing.behavior_setting?.tone_of_voice ?? '',
        response_format_preference: existing.behavior_setting?.response_format_preference ?? '',
      }))
    }
    if (existing.model_policy) {
      setBehavior((b) => ({ ...b, rag_llm_usage: existing.model_policy?.chat_mode ?? '' }))
      setExtras((e) => ({ ...e, data_classification_limit: existing.model_policy?.classification_limit ?? '' }))
    }
    setHydrated(true)
  }, [isExistingPersona, existing, hydrated])

  const createPersona = useCreatePersona()

  function validateBasic(): boolean {
    const next: Partial<Record<keyof BasicInfoValues, string>> = {}
    if (!basic.persona_name.trim()) next.persona_name = 'Required'
    if (!basic.role_title.trim()) next.role_title = 'Required'
    if (!basic.persona_category) next.persona_category = 'Required'
    setBasicErrors(next)
    return Object.keys(next).length === 0
  }
  function validateBehavior(): boolean {
    const next: Partial<Record<keyof AIBehaviorValues, string>> = {}
    if (!behavior.system_instruction.trim()) next.system_instruction = 'Required'
    if (!behavior.rag_llm_usage) next.rag_llm_usage = 'Required'
    setBehaviorErrors(next)
    return Object.keys(next).length === 0
  }
  function validateExtras(): boolean {
    const next: Partial<Record<keyof ExtraSettingsValues, string>> = {}
    if (!extras.data_classification_limit) next.data_classification_limit = 'Required'
    setExtrasErrors(next)
    return Object.keys(next).length === 0
  }

  function onNext() {
    if (step === 1 && !validateBasic()) return
    if (step === 2 && !validateBehavior()) return
    setStep((s) => Math.min(STEPS.length, s + 1))
  }

  async function onSubmit() {
    if (!validateBasic()) return setStep(1)
    if (!validateBehavior()) return setStep(2)
    if (!validateExtras()) return setStep(4)

    setSubmitting(true)
    setSubmitError(null)
    try {
      let personaId = editingId
      if (!isExistingPersona) {
        const created = await createPersona.mutateAsync({
          persona_code: slugify(basic.persona_name),
          persona_name: basic.persona_name,
          persona_category: basic.persona_category,
          short_description: basic.short_description || undefined,
        })
        personaId = created.persona_id
      }
      if (!personaId) throw new Error('Missing persona id after create')

      await personasApi.updateBehavior(personaId, {
        system_instruction: behavior.system_instruction || undefined,
        tone_of_voice: behavior.tone_of_voice || undefined,
        response_format_preference: behavior.response_format_preference || undefined,
      })

      const caps = RAG_LLM_MODES.find((m) => m.value === behavior.rag_llm_usage)?.caps
      await personasApi.updateModelPolicy(personaId, {
        chat_mode: behavior.rag_llm_usage || undefined,
        use_rag: caps?.rag ?? false,
        use_internal_llm: caps?.illm ?? false,
        use_external_llm: caps?.xllm ?? false,
        classification_limit: extras.data_classification_limit || undefined,
      })

      if (kb.domain_tags.length > 0) {
        await personasApi.updateDomainTags(
          personaId,
          kb.domain_tags.map((t) => ({ tag_name: t, tag_type: 'domain' as const }))
        )
      }

      toast.show('success', isEdit ? 'Persona updated successfully' : 'Persona created successfully')
      navigate('/personas')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save persona'
      setSubmitError(msg)
      toast.show('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = isViewMode

  return (
    <div style={{ fontFamily: appTheme.font, color: appTheme.textPrimary }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: appTheme.textPrimary, margin: 0 }}>
          {isViewMode ? 'View Persona' : isEdit ? 'Edit Persona' : 'Create New Persona'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/personas')}
          style={{
            height: '36px',
            padding: '0 16px',
            border: `1px solid ${appTheme.border}`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: appTheme.textSubtle,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <StepIndicator steps={STEPS} current={step} onJump={(s) => s < step && setStep(s)} />

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: `1.5px solid ${appTheme.borderSoft}`,
          borderRadius: appTheme.radiusCardWizard,
          padding: '32px',
          marginTop: '20px',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1 }}>
          {step === 1 && <BasicInfoStep values={basic} onChange={setBasic} errors={basicErrors} disabled={disabled} />}
          {step === 2 && (
            <AIBehaviorStep values={behavior} onChange={setBehavior} errors={behaviorErrors} disabled={disabled} />
          )}
          {step === 3 && <KnowledgeBaseStep values={kb} onChange={setKb} disabled={disabled} />}
          {step === 4 && (
            <ExtraSettingsStep values={extras} onChange={setExtras} errors={extrasErrors} disabled={disabled} />
          )}
        </div>

        {submitError && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              borderRadius: appTheme.radiusInput,
              backgroundColor: '#FEF2F2',
              color: appTheme.danger,
              fontSize: '13px',
              border: '1px solid #FCA5A5',
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={submitting}
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
              }}
            >
              Back
            </button>
          )}
          {!disabled && step < STEPS.length && (
            <button
              type="button"
              onClick={onNext}
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
              }}
            >
              Next
            </button>
          )}
          {!disabled && step === STEPS.length && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
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
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || `persona_${Date.now().toString(36)}`
}
