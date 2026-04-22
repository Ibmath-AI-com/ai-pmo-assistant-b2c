import { useRef, useState } from 'react'
import { appTheme } from '@/lib/theme'

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  accept?: string
}

const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.xlsx,.html,.jpg,.png'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUploadZone({ onFileSelect, selectedFile, accept = ACCEPTED_TYPES }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? appTheme.accentBlue : appTheme.border}`,
        borderRadius: appTheme.radiusCard,
        backgroundColor: isDragging ? '#EFF6FF' : '#F8FAFC',
        padding: '24px',
        textAlign: 'center',
        transition: 'border-color 150ms ease, background-color 150ms ease',
        fontFamily: appTheme.font,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '22px' }}>📄</span>
          <p style={{ fontSize: '13px', fontWeight: 600, color: appTheme.textPrimary, margin: 0 }}>
            {selectedFile.name}
          </p>
          <p style={{ fontSize: '12px', color: appTheme.textSecondary, margin: 0 }}>
            {formatBytes(selectedFile.size)}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: appTheme.accentBlue,
              textDecoration: 'underline',
              fontFamily: appTheme.font,
            }}
          >
            Change file
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '28px' }}>☁️</span>
          <p style={{ fontSize: '13px', color: appTheme.textSecondary, margin: 0 }}>
            Drag and drop a file here, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: appTheme.accentBlue,
                textDecoration: 'underline',
                padding: 0,
                fontFamily: appTheme.font,
              }}
            >
              Browse
            </button>
          </p>
          <p style={{ fontSize: '12px', color: appTheme.textPlaceholder, margin: 0 }}>
            PDF, DOCX, PPTX, XLSX, HTML, JPG, PNG
          </p>
        </div>
      )}
    </div>
  )
}
