import { useEffect, useRef, useState } from 'react'
import type { Project } from '@/lib/api/projects'
import {
  useCreateProject,
  useDeleteProjectFile,
  useProjectFiles,
  useUpdateProject,
  useUploadProjectFile,
} from '@/lib/hooks/useProjects'

interface Props {
  editProject?: Project | null
  onClose: () => void
}

const font = 'Inter, Segoe UI, sans-serif'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#111827',
  outline: 'none',
  fontFamily: font,
  boxSizing: 'border-box',
  backgroundColor: '#FFFFFF',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
  fontFamily: font,
}

export function ProjectModal({ editProject, onClose }: Props) {
  const isEdit = !!editProject
  const [name, setName] = useState(editProject?.project_name ?? '')
  const [objective, setObjective] = useState(editProject?.objective ?? '')
  const [instructions, setInstructions] = useState(editProject?.instructions ?? '')
  const [nameError, setNameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [showDriveMenu, setShowDriveMenu] = useState(false)
  const [driveToast, setDriveToast] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const projectId = editProject?.project_id ?? ''
  const { data: existingFiles = [] } = useProjectFiles(isEdit ? projectId : '')

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const uploadFile = useUploadProjectFile(projectId)
  const deleteFile = useDeleteProjectFile(projectId)

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const isLoading =
    createProject.isPending || updateProject.isPending || uploadFile.isPending

  useEffect(() => {
    const handler = () => {
      if (showDriveMenu) setShowDriveMenu(false)
    }
    if (showDriveMenu) window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [showDriveMenu])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    setPendingFiles((prev) => [...prev, ...files])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setPendingFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const showComingSoon = (drive: string) => {
    setDriveToast(`${drive} — Coming soon`)
    setTimeout(() => setDriveToast(''), 3000)
    setShowDriveMenu(false)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError('Project name is required'); return }
    setNameError('')
    setApiError('')

    try {
      let savedProjectId = projectId

      if (!isEdit) {
        const created = await createProject.mutateAsync({
          project_name: name.trim(),
          objective: objective.trim() || undefined,
          instructions: instructions.trim() || undefined,
        })
        savedProjectId = created.project_id
      } else {
        await updateProject.mutateAsync({
          id: projectId,
          data: {
            project_name: name.trim(),
            objective: objective.trim() || undefined,
            instructions: instructions.trim() || undefined,
          },
        })
      }

      // Upload any pending files
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        await uploadProjectFile_direct(savedProjectId, fd)
      }

      onClose()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      setApiError(
        typeof detail === 'string' ? detail : 'Something went wrong. Please try again.'
      )
    }
  }

  // Direct upload helper for newly-created project (before hook has projectId)
  const uploadProjectFile_direct = async (pid: string, fd: FormData) => {
    const { uploadProjectFile: upload } = await import('@/lib/api/projects')
    await upload(pid, fd)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '420px',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: font,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            {isEdit ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '20px', lineHeight: 1, padding: '2px 6px' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {apiError && (
            <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>
              {apiError}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label style={labelStyle}>Project Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError('') }}
              placeholder="e.g. Q3 Digital Transformation"
              style={{ ...inputStyle, borderColor: nameError ? '#DC2626' : '#D1D5DB' }}
            />
            {nameError && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{nameError}</p>}
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
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '10px 12px',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
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

            {/* Pending (not yet uploaded) */}
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
                border: `2px dashed ${isDragOver ? '#6366F1' : '#D1D5DB'}`,
                borderRadius: '10px',
                padding: '20px 16px',
                textAlign: 'center',
                backgroundColor: isDragOver ? '#F5F3FF' : '#FAFAFA',
                transition: 'all 150ms',
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6B7280' }}>
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
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    fontFamily: font,
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
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <MenuItem onClick={() => { fileInputRef.current?.click(); setShowDriveMenu(false) }}>
                      Add Files / Photos
                    </MenuItem>
                    <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '2px 0' }} />
                    <MenuItem sub onClick={() => showComingSoon('OneDrive')}>OneDrive</MenuItem>
                    <MenuItem sub onClick={() => showComingSoon('Dropbox')}>Dropbox</MenuItem>
                    <MenuItem sub onClick={() => showComingSoon('Google Drive')}>Google Drive</MenuItem>
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

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '38px',
              padding: '0 20px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: font,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              height: '38px',
              padding: '0 24px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              fontFamily: font,
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
            right: '440px',
            backgroundColor: '#1F2937',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 1100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {driveToast}
        </div>
      )}
    </>
  )
}

function MenuItem({ onClick, sub, children }: { onClick: () => void; sub?: boolean; children: React.ReactNode }) {
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
        color: '#374151',
        cursor: 'pointer',
        fontFamily: font,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {sub && <span style={{ marginRight: '6px', color: '#9CA3AF' }}>↪</span>}
      {children}
    </button>
  )
}

function FileRow({ name, size, pending, onRemove }: { name: string; size?: number | null; pending?: boolean; onRemove: () => void }) {
  const sizeStr = size != null ? (size < 1024 ? `${size}B` : size < 1048576 ? `${(size / 1024).toFixed(1)}KB` : `${(size / 1048576).toFixed(1)}MB`) : ''
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: pending ? '#F5F3FF' : '#F9FAFB',
        border: `1px solid ${pending ? '#C4B5FD' : '#E5E7EB'}`,
        borderRadius: '6px',
        fontSize: '12px',
        color: '#374151',
        fontFamily: font,
      }}
    >
      <span style={{ fontSize: '14px' }}>📄</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {sizeStr && <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{sizeStr}</span>}
      {pending && <span style={{ color: '#8B5CF6', fontSize: '11px', flexShrink: 0 }}>pending</span>}
      <button
        type="button"
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
      >
        ×
      </button>
    </div>
  )
}
