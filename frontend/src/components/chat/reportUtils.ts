export interface ReportData {
  title: string
  generated_on?: string
  progress_percentage: number
  risks: Array<{ label: string; severity: 'High' | 'Medium' | 'Low' }>
  summary_points: string[]
  next_milestones: string[]
  output_id?: string
}

export function tryParseReport(content: string): ReportData | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed.__type === 'report' && parsed.title) return parsed as ReportData
    return null
  } catch {
    return null
  }
}
