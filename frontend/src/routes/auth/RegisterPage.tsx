import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '@/lib/hooks/useAuth'
import { AppLogo } from '@/components/ui/AppLogo'
import { RegistrationSuccess } from './RegistrationSuccess'

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: '7px',
  padding: '7px 11px',
  fontSize: '13px',
  color: '#E5E7EB',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 11px center',
  paddingRight: '30px',
}

const labelStyle: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
}

const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    label: 'AI-Powered Project Insights',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    label: 'Smart Risk Analysis',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Multiple AI Personas',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    label: 'Automated Status Reports',
  },
]

const COUNTRIES = [
  'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'India', 'Pakistan', 'Egypt', 'Jordan', 'Lebanon', 'Turkey', 'Other',
]

export function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    date_of_birth: '',
    country: '',
    mobile_number: '',
    gender: '',
    confirm_password: '',
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const { register, loading, error, isSuccess } = useRegister()

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) return
    register(form)
  }

  const focusInput = () => {}
  const blurInput = () => {}

  if (isSuccess) return <RegistrationSuccess email={form.email} />

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
        className="left-panel"
        style={{
          width: '40%',
          backgroundColor: '#2D2A6E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '56px 48px',
          position: 'relative',
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {/* Logo + brand name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <AppLogo size={44} />
          <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, letterSpacing: '0.2px' }}>
            AI PMO Assistant
          </span>
        </div>

        <h1
          style={{
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: 800,
            lineHeight: 1.3,
            margin: '0 0 16px 0',
            maxWidth: '340px',
          }}
        >
          Empower Your Projects with AI-Driven PMO
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '14px',
            lineHeight: 1.7,
            margin: '0 0 40px 0',
            maxWidth: '340px',
          }}
        >
          Join thousands of project managers using intelligent automation and strategic insights to deliver projects on time and on budget.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '20px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 40px',
          backgroundColor: '#1E1B4B',
        }}
      >
        <div style={{ width: '100%', maxWidth: '660px' }}>
          {/* Header */}
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, margin: '0 0 3px 0' }}>
              Create Account
            </h2>
            <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
              Get started with your AI PMO workspace
            </p>
          </div>

          {/* Social sign-up buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {/* Google */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: '8px',
                padding: '7px 6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            {/* Facebook */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: '8px',
                padding: '7px 6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>

            {/* iCloud / Apple */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: '8px',
                padding: '7px 6px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              iCloud
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap' }}>
              or sign up with email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </div>

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

            {/* Row 1: First name · Last name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>First name</label>
                <input type="text" placeholder="Jane" value={form.first_name} onChange={set('first_name')} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Last name</label>
                <input type="text" placeholder="Doe" value={form.last_name} onChange={set('last_name')} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
            </div>

            {/* Row 2: Date of Birth · Gender · Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={set('gender')} style={selectStyle} onFocus={focusInput} onBlur={blurInput}>
                  <option value="" disabled>Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Country</label>
                <select value={form.country} onChange={set('country')} style={selectStyle} onFocus={focusInput} onBlur={blurInput}>
                  <option value="" disabled>Select</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Username · Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Username</label>
                <input type="text" placeholder="janedoe" value={form.username} onChange={set('username')} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Mobile</label>
                <input type="tel" placeholder="+966 8XX XXX XXXX" value={form.mobile_number} onChange={set('mobile_number')} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
            </div>


            {/* Row 5: Email, Password · Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={form.confirm_password} onChange={set('confirm_password')} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
            </div>

            {/* Terms checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                cursor: 'pointer',
                marginTop: '0px',
              }}
            >
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#7B6FE8', width: '15px', height: '15px', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: 1.5 }}>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#A78BFA', textDecoration: 'underline' }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" style={{ color: '#A78BFA', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreeTerms}
              style={{
                width: '100%',
                background: loading || !agreeTerms
                  ? '#4B4890'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading || !agreeTerms ? 'not-allowed' : 'pointer',
                marginTop: '2px',
                letterSpacing: '0.3px',
                opacity: !agreeTerms ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '12px', color: '#9CA3AF', fontSize: '12px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#FFFFFF', fontWeight: 700, textDecoration: 'underline' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
        }
        input::placeholder { color: rgba(156,163,175,0.5); }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.6); }
        select option { background: #2E2A6E; color: #E5E7EB; }
        input:focus, select:focus { border-color: rgba(123,111,232,0.8) !important; background-color: rgba(255,255,255,0.1) !important; }
      `}</style>
    </div>
  )
}
