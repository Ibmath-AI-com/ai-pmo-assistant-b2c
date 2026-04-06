import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '@/lib/hooks/useAuth'
import { AppLogo } from '@/components/ui/AppLogo'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const { login, loading, error } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#D1D5DB',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#000000',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}
    >
      {/* ── Left Panel ── */}
      <div
        style={{
          width: '40%',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative',
          minWidth: 0,
        }}
        className="left-panel"
      >
        {/* Logo + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <AppLogo size={80} />

          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: 700,
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            AI PMO &amp; Strategy Assistant
          </h1>
        </div>

        {/* Tagline pinned to bottom-left */}
        <p
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            color: '#4A9EFF',
            fontSize: '14px',
            fontWeight: 500,
            margin: 0,
            maxWidth: '240px',
            lineHeight: 1.5,
          }}
        >
          AI-Powered Intelligence for Project and Strategy Success
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#1E1B4B',
            borderRadius: '12px',
            padding: '44px 40px',
          }}
        >
          {/* Heading */}
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            Welcome Back
          </h2>
          <p
            style={{
              color: '#9CA3AF',
              fontSize: '13px',
              margin: '0 0 28px 0',
              lineHeight: 1.5,
            }}
          >
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(220,38,38,0.15)',
                  border: '1px solid rgba(220,38,38,0.4)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>
                Username
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.outline = '2px solid #7B6FE8')}
                onBlur={(e) => (e.target.style.outline = 'none')}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>
                  Password
                </label>
                <a
                  href="#"
                  style={{
                    color: '#FFFFFF',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => e.preventDefault()}
                >
                  Forget Password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.outline = '2px solid #7B6FE8')}
                onBlur={(e) => (e.target.style.outline = 'none')}
              />
            </div>

            {/* Remember me */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: '#D1D5DB',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#7B6FE8' }}
              />
              Remember me
            </label>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#4B4890' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Sign up link */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              color: '#9CA3AF',
              fontSize: '13px',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .left-panel {
            width: 100% !important;
            min-height: 220px;
            padding: 40px 24px 60px !important;
          }
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
