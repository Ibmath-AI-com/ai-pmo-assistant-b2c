export function HomePage() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3"
      style={{ minHeight: 'calc(100vh - 56px - 48px)' }}
    >
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <polygon points="14,7 21,11 21,19 14,23 7,19 7,11" fill="#06B6D4" opacity="0.7" />
      </svg>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
        AI PMO & Strategy Assistant
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
        Select a persona from the sidebar and start a conversation.
      </p>
      <button
        style={{
          marginTop: '8px',
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
      >
        New Chat
      </button>
    </div>
  )
}
