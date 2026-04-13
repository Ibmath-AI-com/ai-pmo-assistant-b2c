import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useJob, useReindexDocument } from '@/lib/hooks/useKnowledge'

interface IngestionJobStatusProps {
  jobId: string
  documentId: string
}

export function IngestionJobStatus({ jobId, documentId }: IngestionJobStatusProps) {
  const { data: job } = useJob(jobId)
  const reindex = useReindexDocument()

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading job status…</span>
      </div>
    )
  }

  if (job.job_status === 'completed') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span>Document indexed successfully</span>
      </div>
    )
  }

  if (job.job_status === 'failed') {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-red-50 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Indexing failed{job.error_message ? `: ${job.error_message}` : ''}</span>
        </div>
        <button
          type="button"
          onClick={() => reindex.mutate(documentId)}
          disabled={reindex.isPending}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {reindex.isPending
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />}
          Retry
        </button>
      </div>
    )
  }

  // queued or processing
  const pct = job.progress_pct ?? 0
  const label = job.job_status === 'queued' ? 'Queued for indexing…' : `Indexing document… ${pct}%`

  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-indigo-50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-indigo-700">
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.max(pct, job.job_status === 'processing' ? 5 : 0)}%` }}
        />
      </div>
    </div>
  )
}
