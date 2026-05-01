import { useNavigate } from 'react-router-dom'

interface Props {
  email: string
}

export function RegistrationSuccess({ email }: Props) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        flex: 1,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E1B4B',
        padding: '20px',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#2D2A6E',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Gradient progress bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #10B981, #8B5CF6)',
            width: '100%',
          }}
        />

        <div style={{ padding: '36px 32px' }}>
          {/* Checkmark circle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16,185,129,0.15)',
                border: '2px solid rgba(16,185,129,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 700,
              textAlign: 'center',
              margin: '0 0 10px 0',
              lineHeight: 1.3,
            }}
          >
            Account Created Successfully!
          </h2>

          {/* Subtitle */}
          <p
            style={{
              color: '#9CA3AF',
              fontSize: '13px',
              textAlign: 'center',
              lineHeight: 1.6,
              margin: '0 0 20px 0',
            }}
          >
            Welcome aboard! Your AI PMO &amp; Strategy Assistant account has been registered.
            A confirmation email has been sent to your email address.
          </p>

          {/* Email badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: '999px',
                padding: '6px 14px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span style={{ color: '#E5E7EB', fontSize: '12px', fontWeight: 500 }}>{email}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />

          {/* What's next */}
          <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, margin: '0 0 14px 0' }}>
            What's next?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {[
              'Log in with your credentials and set up your PMO workspace.',
              'Explore AI Personas, Knowledge Hub, and start managing your projects.',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  <span style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* Go to Login button */}
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '11px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.3px',
            }}
          >
            Go to Login
            <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
