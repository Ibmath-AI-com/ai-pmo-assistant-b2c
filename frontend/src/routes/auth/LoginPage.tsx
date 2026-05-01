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
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '7px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#E5E7EB',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D0B2E 0%, #1E1B4B 45%, #16133A 100%)',
      }}
    >
      {/* ── Static background decoration ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>

        {/* Large radial glow — top left */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          top: '-180px', left: '-120px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />

        {/* Large radial glow — bottom right */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          bottom: '-150px', right: '20%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />

        {/* Accent glow — mid right */}
        <div style={{
          position: 'absolute', width: '350px', height: '350px',
          top: '35%', right: '-60px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />

        {/* Subtle dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#6366F1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Hexagon — large, top-left */}
        <svg style={{ position: 'absolute', top: '6%', left: '3%', width: '200px', height: '200px', opacity: 0.18 }} viewBox="0 0 100 100">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#6366F1" strokeWidth="1.5" />
        </svg>

        {/* Hexagon — small, below first */}
        <svg style={{ position: 'absolute', top: '28%', left: '10%', width: '90px', height: '90px', opacity: 0.12 }} viewBox="0 0 100 100">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>

        {/* Hexagon — bottom left */}
        <svg style={{ position: 'absolute', bottom: '10%', left: '6%', width: '130px', height: '130px', opacity: 0.14 }} viewBox="0 0 100 100">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
        </svg>

        {/* Hexagon — large, right side */}
        <svg style={{ position: 'absolute', top: '15%', right: '5%', width: '240px', height: '240px', opacity: 0.1 }} viewBox="0 0 100 100">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="rgba(99,102,241,0.06)" stroke="#6366F1" strokeWidth="1" />
        </svg>

        {/* Hexagon — small, bottom right */}
        <svg style={{ position: 'absolute', bottom: '18%', right: '8%', width: '100px', height: '100px', opacity: 0.13 }} viewBox="0 0 100 100">
          <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>

        {/* Thin diagonal lines — decorative */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
          <line x1="0" y1="100%" x2="42%" y2="0" stroke="#6366F1" strokeWidth="1" />
          <line x1="100%" y1="0" x2="58%" y2="100%" stroke="#8B5CF6" strokeWidth="1" />
        </svg>
      </div>

      {/* ── Left Panel ── */}
      <div
        className="left-panel"
        style={{
          width: '42%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
          <div style={{ filter: 'drop-shadow(0 0 32px rgba(99,102,241,0.55))' }}>
            <AppLogo size={260} />
          </div>

          <h1 style={{
            color: '#FFFFFF',
            fontSize: '22px',
            fontWeight: 700,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.35,
            textShadow: '0 2px 16px rgba(99,102,241,0.4)',
          }}>
            AI PMO &amp; Strategy Assistant
          </h1>

          <p style={{
            color: 'rgba(165,180,252,0.8)',
            fontSize: '13px',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.7,
            maxWidth: '260px',
          }}>
            AI-Powered Intelligence for Project<br />and Strategy Success
          </p>
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{
        width: '1px',
        alignSelf: 'stretch',
        background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.35) 25%, rgba(139,92,246,0.35) 75%, transparent)',
        zIndex: 1,
        flexShrink: 0,
      }} />

      {/* ── Right Panel ── */}
      <div style={{
        flex: 1,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'rgba(45,42,110,0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
          border: '1px solid rgba(99,102,241,0.25)',
        }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                backgroundColor: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#FCA5A5',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Username</label>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Password</label>
                <a
                  href="#"
                  style={{ color: '#A5B4FC', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
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

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#D1D5DB', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#7B6FE8' }}
              />
              Remember me
            </label>

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
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.45)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#9CA3AF', fontSize: '13px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#A5B4FC', fontWeight: 700, textDecoration: 'underline' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .left-panel { width: 100% !important; padding: 40px 24px 60px !important; }
        }
      `}</style>
    </div>
  )
}
