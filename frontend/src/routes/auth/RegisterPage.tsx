import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '@/lib/hooks/useAuth'

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
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

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#3B82F6'
    e.target.style.boxShadow = '0 0 0 2px #3B82F620'
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E5E7EB'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: '#F1F5F9' }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#3B82F6" strokeWidth="2" />
            <polygon points="14,7 21,11 21,19 14,23 7,19 7,11" fill="#06B6D4" opacity="0.7" />
          </svg>
          <h1
            className="font-bold text-center"
            style={{ fontSize: '20px', color: '#111827', margin: 0 }}
          >
            AI PMO & Strategy Assistant
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#DC2626',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>First name</label>
              <input type="text" placeholder="Jane" value={form.first_name} onChange={set('first_name')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Last name</label>
              <input type="text" placeholder="Doe" value={form.last_name} onChange={set('last_name')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Username</label>
            <input type="text" placeholder="janedoe" value={form.username} onChange={set('username')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#93C5FD' : '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#2563EB' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#3B82F6' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-6" style={{ fontSize: '13px', color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3B82F6', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
