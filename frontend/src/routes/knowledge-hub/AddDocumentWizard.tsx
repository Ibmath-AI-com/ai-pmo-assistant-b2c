import { useReducer, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { appTheme } from '@/lib/theme'
import { WizardStepIndicator } from '@/components/knowledge/WizardStepIndicator'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { GovernanceStep } from './steps/GovernanceStep'
import { KBOptimizationStep } from './steps/KBOptimizationStep'
import { ExtraSettingsStep } from './steps/ExtraSettingsStep'
import {
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useUploadFile,
  useUpdateGovernance,
  useUpdateTags,
  useUpdateAccess,
} from '@/lib/hooks/useKnowledge'
import type { TagUpsert } from '@/lib/api/knowledge'

// ─── State Types (exported so step files can import them) ─────────────────────

export interface BasicInfoData {
  title: string
  document_type: string
  knowledge_collection_id: string
  summary_description: string
  file: File | null
  fileId: string | null
}

export interface GovernanceData {
  classification_level: 'Public' | 'Internal' | 'Confidential' | 'Restricted' | ''
  document_owner: string
  version_number: string
  effective_date: string
  review_date: string
}

export interface OptimizationData {
  sdlc: string[]
  domain: string[]
  project_type: string[]
  keywords: string[]
  persona: string[]
  priority: string
}

export interface ExtrasData {
  allowLLM: boolean
  llmModelId: string
  specificAccess: boolean
  specificAccessUserId: string
  setExpiry: boolean
  expiryDate: string
}

export interface WizardState {
  step: 1 | 2 | 3 | 4
  documentId: string | null
  basic: BasicInfoData
  governance: GovernanceData
  optimization: OptimizationData
  extras: ExtrasData
}

export type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'SET_DOCUMENT_ID'; id: string }
  | { type: 'SET_BASIC'; data: Partial<BasicInfoData> }
  | { type: 'SET_GOVERNANCE'; data: Partial<GovernanceData> }
  | { type: 'SET_OPTIMIZATION'; data: Partial<OptimizationData> }
  | { type: 'SET_EXTRAS'; data: Partial<ExtrasData> }
  | { type: 'HYDRATE'; state: Partial<WizardState> }

const initialState: WizardState = {
  step: 1,
  documentId: null,
  basic: {
    title: '',
    document_type: '',
    knowledge_collection_id: '',
    summary_description: '',
    file: null,
    fileId: null,
  },
  governance: {
    classification_level: '',
    document_owner: '',
    version_number: '',
    effective_date: '',
    review_date: '',
  },
  optimization: {
    sdlc: [],
    domain: [],
    project_type: [],
    keywords: [],
    persona: [],
    priority: '',
  },
  extras: {
    allowLLM: false,
    llmModelId: '',
    specificAccess: false,
    specificAccessUserId: '',
    setExpiry: false,
    expiryDate: '',
  },
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_DOCUMENT_ID':
      return { ...state, documentId: action.id }
    case 'SET_BASIC':
      return { ...state, basic: { ...state.basic, ...action.data } }
    case 'SET_GOVERNANCE':
      return { ...state, governance: { ...state.governance, ...action.data } }
    case 'SET_OPTIMIZATION':
      return { ...state, optimization: { ...state.optimization, ...action.data } }
    case 'SET_EXTRAS':
      return { ...state, extras: { ...state.extras, ...action.data } }
    case 'HYDRATE':
      return { ...state, ...action.state }
    default:
      return state
  }
}

const STEPS = [
  { label: 'Basic Information' },
  { label: 'Governance' },
  { label: 'KB Optimization' },
  { label: 'Extra Settings' },
]

// ─── Wizard Shell ─────────────────────────────────────────────────────────────

export function AddDocumentWizard() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id?: string }>()
  const isEditMode = !!editId

  const [state, dispatch] = useReducer(reducer, initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: existingDoc, isLoading: loadingDoc } = useDocument(editId ?? '')

  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()
  const uploadFile = useUploadFile()
  const updateGovernance = useUpdateGovernance()
  const updateTags = useUpdateTags()
  const updateAccess = useUpdateAccess()

  useEffect(() => {
    if (!existingDoc) return

    const tagsOf = (type: string) =>
      (existingDoc.tags ?? []).filter((t) => t.tag_type === type && t.status === 'active').map((t) => t.tag_name)
    const personaTags = (existingDoc.tags ?? [])
      .filter((t) => t.tag_name.startsWith('persona:') && t.status === 'active')
      .map((t) => t.tag_name.replace('persona:', ''))
    const priorityTag = (existingDoc.tags ?? []).find((t) => t.tag_name.startsWith('priority:'))
    const priority = priorityTag ? priorityTag.tag_name.replace('priority:', '') : ''

    const gov = existingDoc.governance
    dispatch({
      type: 'HYDRATE',
      state: {
        documentId: existingDoc.knowledge_document_id,
        basic: {
          title: existingDoc.title,
          document_type: existingDoc.document_type ?? '',
          knowledge_collection_id: existingDoc.knowledge_collection_id,
          summary_description: existingDoc.summary_description ?? '',
          file: null,
          fileId: existingDoc.source_code ?? null,
        },
        governance: {
          classification_level: (gov?.classification_level as GovernanceData['classification_level']) ?? '',
          document_owner: gov?.document_owner ?? '',
          version_number: existingDoc.version_number ?? '',
          effective_date: gov?.effective_date ?? '',
          review_date: gov?.review_date ?? '',
        },
        optimization: {
          sdlc: tagsOf('sdlc'),
          domain: tagsOf('domain'),
          project_type: tagsOf('project_type'),
          keywords: tagsOf('keyword').filter((k) => !k.startsWith('persona:') && !k.startsWith('priority:')),
          persona: personaTags,
          priority,
        },
        extras: {
          allowLLM: gov?.allow_external_llm_usage ?? false,
          llmModelId: gov?.llm_model_id ?? '',
          specificAccess: (existingDoc.access_entries?.length ?? 0) > 0,
          specificAccessUserId: existingDoc.access_entries?.[0]?.user_id ?? '',
          setExpiry: !!gov?.expiry_date,
          expiryDate: gov?.expiry_date ?? '',
        },
      },
    })
  }, [existingDoc])

  const goNext = () => {
    if (state.step < 4) dispatch({ type: 'SET_STEP', step: (state.step + 1) as 1 | 2 | 3 | 4 })
  }

  const goBack = () => {
    if (state.step > 1) dispatch({ type: 'SET_STEP', step: (state.step - 1) as 1 | 2 | 3 | 4 })
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Upload file (create mode only)
      let fileId = state.basic.fileId
      if (!isEditMode && state.basic.file && !fileId) {
        const formData = new FormData()
        formData.append('file', state.basic.file)
        const uploaded = await uploadFile.mutateAsync(formData)
        fileId = uploaded.file_id
      }

      // 2. Create or update document
      let documentId = state.documentId
      if (!isEditMode) {
        const doc = await createDocument.mutateAsync({
          title: state.basic.title.trim(),
          document_type: state.basic.document_type || undefined,
          knowledge_collection_id: state.basic.knowledge_collection_id,
          summary_description: state.basic.summary_description || undefined,
          version_number: state.governance.version_number || undefined,
          source_code: fileId ?? undefined,
        })
        documentId = doc.knowledge_document_id
      } else {
        await updateDocument.mutateAsync({
          id: documentId!,
          data: {
            title: state.basic.title.trim(),
            document_type: state.basic.document_type || undefined,
            knowledge_collection_id: state.basic.knowledge_collection_id,
            summary_description: state.basic.summary_description || undefined,
            version_number: state.governance.version_number || undefined,
          },
        })
      }

      // 3. Update governance (merges step-2 and step-4 data)
      await updateGovernance.mutateAsync({
        id: documentId!,
        data: {
          classification_level: state.governance.classification_level as 'Public' | 'Internal' | 'Confidential' | 'Restricted',
          document_owner: state.governance.document_owner || undefined,
          effective_date: state.governance.effective_date || undefined,
          review_date: state.governance.review_date || undefined,
          allow_external_llm_usage: state.extras.allowLLM,
          llm_model_id: state.extras.allowLLM && state.extras.llmModelId ? state.extras.llmModelId : undefined,
          expiry_date: state.extras.setExpiry && state.extras.expiryDate ? state.extras.expiryDate : undefined,
        },
      })

      // 4. Update tags (step-3 data)
      const tags: TagUpsert[] = [
        ...state.optimization.sdlc.map((v) => ({ tag_name: v, tag_type: 'sdlc' as const })),
        ...state.optimization.domain.map((v) => ({ tag_name: v, tag_type: 'domain' as const })),
        ...state.optimization.project_type.map((v) => ({ tag_name: v, tag_type: 'project_type' as const })),
        ...state.optimization.keywords.map((v) => ({ tag_name: v, tag_type: 'keyword' as const })),
        ...state.optimization.persona.map((v) => ({ tag_name: `persona:${v}`, tag_type: 'keyword' as const })),
        ...(state.optimization.priority
          ? [{ tag_name: `priority:${state.optimization.priority}`, tag_type: 'keyword' as const }]
          : []),
      ]
      if (tags.length > 0) {
        await updateTags.mutateAsync({ id: documentId!, tags })
      }

      // 5. Update specific access (step-4 data)
      if (state.extras.specificAccess && state.extras.specificAccessUserId) {
        await updateAccess.mutateAsync({
          id: documentId!,
          entries: [{ user_id: state.extras.specificAccessUserId, access_type: 'read' }],
        })
      }

      navigate('/knowledge-hub')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
        : typeof detail === 'string'
          ? detail
          : 'Failed to save document. Please try again.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && loadingDoc) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: appTheme.textSecondary, fontFamily: appTheme.font }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ fontFamily: appTheme.font, color: appTheme.textPrimary }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: appTheme.textPrimary, margin: 0 }}>
          {isEditMode ? 'Update Document Settings' : 'Add New Document'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/knowledge-hub')}
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
            fontFamily: appTheme.font,
          }}
        >
          Close
        </button>
      </div>

      {/* Step indicator */}
      <WizardStepIndicator steps={STEPS} currentStep={state.step} />

      {/* Card */}
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
          {state.step === 1 && (
            <BasicInfoStep
              data={state.basic}
              dispatch={dispatch}
              onNext={goNext}
              isEditMode={isEditMode}
            />
          )}
          {state.step === 2 && (
            <GovernanceStep
              data={state.governance}
              dispatch={dispatch}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {state.step === 3 && (
            <KBOptimizationStep
              data={state.optimization}
              dispatch={dispatch}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {state.step === 4 && (
            <ExtraSettingsStep
              data={state.extras}
              dispatch={dispatch}
              onBack={goBack}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
