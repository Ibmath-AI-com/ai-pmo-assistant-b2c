import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '@/lib/hooks/useAuth'
import { AppLogo } from '@/components/ui/AppLogo'

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

export function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  })
  const { register, loading, error } = useRegister()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register(form)
  }

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.outline = '2px solid #7B6FE8')
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.outline = 'none')

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
          <h2 style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Create Account
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

            {/* First / Last name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>First name</label>
                <input type="text" placeholder="Jane" value={form.first_name} onChange={set('first_name')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Last name</label>
                <input type="text" placeholder="Doe" value={form.last_name} onChange={set('last_name')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Username</label>
              <input type="text" placeholder="janedoe" value={form.username} onChange={set('username')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500 }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>

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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#9CA3AF', fontSize: '13px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#FFFFFF', fontWeight: 700, textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .left-panel { width: 100% !important; min-height: 200px; padding: 40px 24px 60px !important; }
        }
      `}</style>
    </div>
  )
}
