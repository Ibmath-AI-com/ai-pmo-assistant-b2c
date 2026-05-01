import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCreateProject,
  useDeleteProjectFile,
  useProjectFiles,
  useUpdateProject,
  useUploadProjectFile,
} from '@/lib/hooks/useProjects'
import { fetchProject } from '@/lib/api/projects'
import { appTheme, inputStyle, textareaStyle } from '@/lib/theme'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: appTheme.textSubtle,
  marginBottom: '6px',
  fontFamily: appTheme.font,
}

export function ProjectPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id?: string }>()
  const isEdit = !!editId

  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [instructions, setInstructions] = useState('')
  const [nameError, setNameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showDriveMenu, setShowDriveMenu] = useState(false)
  const [driveToast, setDriveToast] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: existingFiles = [] } = useProjectFiles(isEdit ? (editId ?? '') : '')
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const uploadFile = useUploadProjectFile(editId ?? '')
  const deleteFile = useDeleteProjectFile(editId ?? '')

  const isLoading = createProject.isPending || updateProject.isPending || uploadFile.isPending

  // Hydrate form when editing
  useEffect(() => {
    if (!isEdit || hydrated) return
    fetchProject(editId!).then((p) => {
      setName(p.project_name)
      setObjective(p.objective ?? '')
      setInstructions(p.instructions ?? '')
      setHydrated(true)
    }).catch(() => navigate('/'))
  }, [isEdit, editId, hydrated, navigate])

  // Close drive menu on outside click
  useEffect(() => {
    if (!showDriveMenu) return
    const handler = () => setShowDriveMenu(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [showDriveMenu])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setPendingFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const showComingSoon = (drive: string) => {
    setDriveToast(`${drive} — Coming soon`)
    setTimeout(() => setDriveToast(''), 3000)
    setShowDriveMenu(false)
  }

  const uploadProjectFile_direct = async (pid: string, fd: FormData) => {
    const { uploadProjectFile: upload } = await import('@/lib/api/projects')
    await upload(pid, fd)
  }

  const handleSave = async () => {
    if (!name.trim()) { setNameError('Project name is required'); return }
    setNameError('')
    setApiError('')

    try {
      let savedId = editId ?? ''

      if (!isEdit) {
        const created = await createProject.mutateAsync({
          project_name: name.trim(),
          objective: objective.trim() || undefined,
          instructions: instructions.trim() || undefined,
        })
        savedId = created.project_id
      } else {
        await updateProject.mutateAsync({
          id: editId!,
          data: {
            project_name: name.trim(),
            objective: objective.trim() || undefined,
            instructions: instructions.trim() || undefined,
          },
        })
      }

      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        await uploadProjectFile_direct(savedId, fd)
      }

      navigate('/')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      setApiError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ fontFamily: appTheme.font, color: appTheme.textPrimary }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: appTheme.textPrimary, margin: 0 }}>
          {isEdit ? 'Edit Project' : 'New Project'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/')}
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

      {/* Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: `1.5px solid ${appTheme.borderSoft}`,
          borderRadius: appTheme.radiusCardWizard,
          padding: '32px',
        }}
      >
        {apiError && (
          <div
            style={{
              marginBottom: '20px',
              padding: '10px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: appTheme.radiusInput,
              color: appTheme.danger,
              fontSize: '13px',
            }}
          >
            {apiError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Project Name */}
          <div>
            <label style={labelStyle}>
              Project Name <span style={{ color: appTheme.danger }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError('') }}
              placeholder="e.g. Q3 Digital Transformation"
              style={{ ...inputStyle, borderColor: nameError ? appTheme.danger : appTheme.border }}
            />
            {nameError && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: appTheme.danger }}>{nameError}</p>
            )}
          </div>

          {/* Objective */}
          <div>
            <label style={labelStyle}>What are you trying to achieve?</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Improve delivery speed by 30%"
              style={inputStyle}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={labelStyle}>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="Additional context, methodology, constraints…"
              style={{ ...textareaStyle, minHeight: '120px' }}
            />
          </div>

          {/* Files */}
          <div>
            <label style={labelStyle}>Files</label>

            {/* Existing files (edit mode) */}
            {isEdit && existingFiles.length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {existingFiles.map((f) => (
                  <FileRow
                    key={f.project_file_id}
                    name={f.original_file_name}
                    size={f.file_size_bytes}
                    onRemove={() => deleteFile.mutate(f.project_file_id)}
                  />
                ))}
              </div>
            )}

            {/* Pending files */}
            {pendingFiles.length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {pendingFiles.map((f, i) => (
                  <FileRow
                    key={i}
                    name={f.name}
                    size={f.size}
                    pending
                    onRemove={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              style={{
                border: `2px dashed ${isDragOver ? '#6366F1' : appTheme.border}`,
                borderRadius: appTheme.radiusCard,
                padding: '20px 16px',
                textAlign: 'center',
                backgroundColor: isDragOver ? '#F5F3FF' : appTheme.pageBg,
                transition: 'all 150ms',
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: appTheme.textSecondary }}>
                Drag files here or
              </p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowDriveMenu((v) => !v) }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    border: `1px solid ${appTheme.border}`,
                    borderRadius: appTheme.radiusInput,
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: appTheme.textSubtle,
                    cursor: 'pointer',
                    fontFamily: appTheme.font,
                  }}
                >
                  + Add files
                  <span style={{ fontSize: '10px' }}>▾</span>
                </button>

                {showDriveMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '200px',
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${appTheme.border}`,
                      borderRadius: appTheme.radiusCard,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <DriveMenuItem onClick={() => { fileInputRef.current?.click(); setShowDriveMenu(false) }}>
                      Add Files / Photos
                    </DriveMenuItem>
                    <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '2px 0' }} />
                    <DriveMenuItem sub onClick={() => showComingSoon('OneDrive')}>OneDrive</DriveMenuItem>
                    <DriveMenuItem sub onClick={() => showComingSoon('Dropbox')}>Dropbox</DriveMenuItem>
                    <DriveMenuItem sub onClick={() => showComingSoon('Google Drive')}>Google Drive</DriveMenuItem>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            style={{
              height: '40px',
              padding: '0 28px',
              border: 'none',
              borderRadius: appTheme.radiusInput,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Saving…' : isEdit ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>

      {/* Coming soon toast */}
      {driveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1F2937',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: appTheme.radiusCard,
            fontSize: '13px',
            zIndex: 1100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {driveToast}
        </div>
      )}
    </div>
  )
}

function DriveMenuItem({
  onClick,
  sub,
  children,
}: {
  onClick: () => void
  sub?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: `8px ${sub ? '20px' : '14px'}`,
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontSize: '13px',
        color: appTheme.textSubtle,
        cursor: 'pointer',
        fontFamily: appTheme.font,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {sub && <span style={{ marginRight: '6px', color: '#9CA3AF' }}>↪</span>}
      {children}
    </button>
  )
}

function FileRow({
  name,
  size,
  pending,
  onRemove,
}: {
  name: string
  size?: number | null
  pending?: boolean
  onRemove: () => void
}) {
  const sizeStr =
    size != null
      ? size < 1024
        ? `${size}B`
        : size < 1048576
        ? `${(size / 1024).toFixed(1)}KB`
        : `${(size / 1048576).toFixed(1)}MB`
      : ''
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: pending ? '#F5F3FF' : appTheme.pageBg,
        border: `1px solid ${pending ? '#C4B5FD' : appTheme.border}`,
        borderRadius: appTheme.radiusInput,
        fontSize: '12px',
        color: appTheme.textSubtle,
        fontFamily: appTheme.font,
      }}
    >
      <span style={{ fontSize: '14px' }}>📄</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {sizeStr && <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{sizeStr}</span>}
      {pending && <span style={{ color: '#8B5CF6', fontSize: '11px', flexShrink: 0 }}>pending</span>}
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9CA3AF',
          fontSize: '14px',
          lineHeight: 1,
          padding: '0 2px',
        }}
      >
        ×
      </button>
    </div>
  )
}
