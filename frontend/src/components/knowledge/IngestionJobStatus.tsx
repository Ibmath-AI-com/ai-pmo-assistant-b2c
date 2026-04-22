import { appTheme } from '@/lib/theme'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: appTheme.textSecondary, fontFamily: appTheme.font }}>
        <span>⏳</span>
        <span>Loading job status…</span>
      </div>
    )
  }

  if (job.job_status === 'completed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: appTheme.radiusInput, backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '13px', fontFamily: appTheme.font }}>
        <span>✓</span>
        <span>Document indexed successfully</span>
      </div>
    )
  }

  if (job.job_status === 'failed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 12px', borderRadius: appTheme.radiusInput, backgroundColor: '#FEE2E2', fontFamily: appTheme.font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#991B1B' }}>
          <span>⚠</span>
          <span>Indexing failed{job.error_message ? `: ${job.error_message}` : ''}</span>
        </div>
        <button
          type="button"
          onClick={() => reindex.mutate(documentId)}
          disabled={reindex.isPending}
          style={{
            alignSelf: 'flex-start',
            height: '28px',
            padding: '0 12px',
            border: `1px solid #F87171`,
            borderRadius: appTheme.radiusInput,
            backgroundColor: '#FFFFFF',
            color: '#DC2626',
            fontSize: '12px',
            fontWeight: 500,
            cursor: reindex.isPending ? 'not-allowed' : 'pointer',
            opacity: reindex.isPending ? 0.6 : 1,
            fontFamily: appTheme.font,
          }}
        >
          {reindex.isPending ? 'Retrying…' : '↺ Retry'}
        </button>
      </div>
    )
  }

  const pct = job.progress_pct ?? 0
  const label = job.job_status === 'queued' ? 'Queued for indexing…' : `Indexing document… ${pct}%`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 12px', borderRadius: appTheme.radiusInput, backgroundColor: '#EFF6FF', fontFamily: appTheme.font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: appTheme.accentBlue }}>
        <span>⏳</span>
        <span>{label}</span>
      </div>
      <div style={{ height: '4px', width: '100%', backgroundColor: '#BFDBFE', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            backgroundColor: appTheme.accentBlue,
            width: `${Math.max(pct, job.job_status === 'processing' ? 5 : 0)}%`,
            transition: 'width 500ms ease',
          }}
        />
      </div>
    </div>
  )
}
