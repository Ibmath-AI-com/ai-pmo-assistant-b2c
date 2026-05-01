interface Caps {
  rag: boolean
  illm: boolean
  xllm: boolean
}

export function CapabilityBadges({ caps }: { caps: Caps }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Badge label="RAG" active={caps.rag} />
      <Badge label="ILLM" active={caps.illm} />
      <Badge label="XLLM" active={caps.xllm} />
    </div>
  )
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        width: '72px',
        height: '62px',
        borderRadius: '10px',
        border: '1.5px solid #BFDBFE',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
      }}
    >
      {active ? <CheckIcon /> : <XIcon />}
      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" fill="#2563EB" />
      <path d="M6.5 11.5 L9.5 14.5 L15.5 8.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" fill="#DC2626" />
      <path d="M7.5 7.5 L14.5 14.5 M14.5 7.5 L7.5 14.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
