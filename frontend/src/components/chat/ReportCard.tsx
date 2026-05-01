import { DonutChart } from './DonutChart'
import type { ReportData } from './reportUtils'

export type { ReportData }

interface Props {
  report: ReportData
}

const SEVERITY_COLOR: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
}

const panel: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #F0F0F0',
  borderRadius: 8,
  padding: 12,
  flex: 1,
  minWidth: 0,
}

const panelTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#374151',
  letterSpacing: '0.05em',
  marginBottom: 8,
}

export function ReportCard({ report }: Props) {
  const handleDownload = () => {
    if (!report.output_id) return
    window.open(`/api/v1/ai/outputs/${report.output_id}/download`, '_blank')
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      maxWidth: 520,
    }}>
      {/* Title */}
      <div style={{ padding: '14px 16px 10px' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{report.title}</p>
        {report.generated_on && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{report.generated_on}</p>
        )}
      </div>

      {/* 2×2 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: '0 16px 14px',
      }}>
        {/* Overall Progress */}
        <div style={panel}>
          <p style={panelTitle}>Overall Progress</p>
          <DonutChart percentage={report.progress_percentage} />
        </div>

        {/* Key Risks */}
        <div style={panel}>
          <p style={panelTitle}>Key Risks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {report.risks.slice(0, 5).map((risk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: SEVERITY_COLOR[risk.severity] ?? '#9CA3AF',
                }} />
                <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{risk.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Summary */}
        <div style={panel}>
          <p style={panelTitle}>Project Summary</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {report.summary_points.slice(0, 4).map((pt, i) => (
              <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>• {pt}</li>
            ))}
          </ul>
        </div>

        {/* Next Milestones */}
        <div style={panel}>
          <p style={panelTitle}>Next Milestones</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {report.next_milestones.slice(0, 4).map((ms, i) => (
              <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>• {ms}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Download */}
      {report.output_id && (
        <div style={{
          borderTop: '1px solid #F0F0F0',
          padding: '10px 16px',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#3B82F6', fontSize: 12, fontWeight: 500, padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="10 9 9 9 8 9" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Download the Full Report
          </button>
        </div>
      )}
    </div>
  )
}

