import { useEffect, useState } from 'react'
import { InfoRow } from './components/InfoRow'
import { profileApi, type UserDetail, type UserProfileDetail, type SubscriptionInfo } from '@/lib/api/profile'

interface MyInformationTabProps {
  editMode: boolean
  onEditDone: () => void
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function MyInformationTab({ editMode, onEditDone }: MyInformationTabProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [profile, setProfile] = useState<UserProfileDetail | null>(null)
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit form state
  const [mobile, setMobile] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')

  useEffect(() => {
    Promise.all([
      profileApi.getMe(),
      profileApi.getProfile(),
      profileApi.getSubscription(),
    ])
      .then(([u, p, s]) => {
        setUser(u)
        setProfile(p)
        setSub(s)
        setMobile(u.mobile_number || '')
        setFirstName(p.first_name || '')
        setLastName(p.last_name || '')
        setDob(p.date_of_birth ? p.date_of_birth.substring(0, 10) : '')
        setGender(p.gender || '')
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const [updatedUser, updatedProfile] = await Promise.all([
        profileApi.patchMe({ mobile_number: mobile, first_name: firstName, last_name: lastName }),
        profileApi.patchProfile({ first_name: firstName, last_name: lastName, date_of_birth: dob || undefined, gender: gender || undefined }),
      ])
      setUser(updatedUser)
      setProfile(updatedProfile)
      onEditDone()
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
    )
  }

  if (error && !user) {
    return <div style={{ padding: '24px', color: '#EF4444' }}>{error}</div>
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.username || '—'

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #1D4ED8', paddingBottom: '2px' }}>
          My Information
        </span>
      </div>

      {editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
          <FieldRow label="Full Name">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </FieldRow>

          <FieldRow label="Email Address">
            <input type="email" value={user?.email || ''} readOnly style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280', cursor: 'not-allowed' }} />
          </FieldRow>

          <FieldRow label="Mobile No">
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              style={inputStyle}
              placeholder="+966 5x xxx xxxx"
            />
          </FieldRow>

          <FieldRow label="Date of Birth">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Gender">
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </FieldRow>

          <FieldRow label="Status">
            <span style={{ fontSize: '14px', color: '#374151' }}>{user?.status || '—'}</span>
          </FieldRow>

          <FieldRow label="Package">
            <span style={{ fontSize: '14px', color: '#374151' }}>
              {sub?.package_name || '—'}{' '}
              <button style={{ color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: 0 }}>
                Cancel Subscription
              </button>
            </span>
          </FieldRow>

          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px', background: '#5C4BB7', color: '#fff',
                border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={onEditDone}
              style={{
                padding: '10px 24px', background: 'transparent', color: '#374151',
                border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <InfoRow label="Full Name">{fullName}</InfoRow>
          <InfoRow label="Email Address">{user?.email || '—'}</InfoRow>
          <InfoRow label="Mobile No">{user?.mobile_number || '—'}</InfoRow>
          <InfoRow label="Date of Birth">{formatDate(profile?.date_of_birth || null)}</InfoRow>
          <InfoRow label="Gender">{profile?.gender || '—'}</InfoRow>
          <InfoRow label="Status">{user?.status || '—'}</InfoRow>
          <InfoRow label="Package">
            <span>
              {sub?.package_name || '—'}{' '}
              <button style={{ color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: 0 }}>
                Cancel Subscription
              </button>
            </span>
          </InfoRow>
        </div>
      )}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <span style={{
        minWidth: '160px', background: '#F3F4F6', borderRadius: '6px',
        padding: '10px 16px', fontWeight: 600, fontSize: '13px', color: '#374151',
        whiteSpace: 'nowrap', marginTop: '2px',
      }}>
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
}
