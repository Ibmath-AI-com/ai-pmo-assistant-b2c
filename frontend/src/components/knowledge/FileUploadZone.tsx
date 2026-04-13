import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'

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
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-1">
          <Upload className="h-6 w-6 text-indigo-500" />
          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 text-xs text-indigo-600 underline hover:text-indigo-800"
          >
            Change file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop a file here, or{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-indigo-600 underline hover:text-indigo-800"
            >
              Browse
            </button>
          </p>
          <p className="text-xs text-gray-400">PDF, DOCX, PPTX, XLSX, HTML, JPG, PNG</p>
        </div>
      )}
    </div>
  )
}
