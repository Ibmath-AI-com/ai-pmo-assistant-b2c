import { useState } from 'react'
import type { PaymentMethodCreate } from '@/lib/api/profile'

interface AddCardModalProps {
  onClose: () => void
  onSave: (data: PaymentMethodCreate) => Promise<void>
}

export function AddCardModal({ onClose, onSave }: AddCardModalProps) {
  const [brand, setBrand] = useState('visa')
  const [lastFour, setLastFour] = useState('')
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (lastFour.length !== 4 || !/^\d{4}$/.test(lastFour)) {
      setError('Enter the last 4 digits of your card')
      return
    }
    const [mm, yy] = expiry.split('/')
    const month = parseInt(mm, 10)
    const year = parseInt('20' + yy, 10)
    if (!mm || !yy || month < 1 || month > 12 || isNaN(year)) {
      setError('Enter expiry as MM/YY')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ card_brand: brand, last_four: lastFour, expiry_month: month, expiry_year: year })
      onClose()
    } catch {
      setError('Failed to save card')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '12px', padding: '28px 32px',
          minWidth: '340px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '20px', color: '#111827' }}>
          Add New Card
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Card Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
            >
              <option value="visa">VISA</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">Amex</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Last 4 Digits</label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 4321"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Expiry (MM/YY)</label>
            <input
              type="text"
              maxLength={5}
              placeholder="10/27"
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d/]/g, '')
                if (v.length === 2 && !v.includes('/')) v = v + '/'
                setExpiry(v)
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '11px', background: '#5C4BB7', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Card'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', background: 'transparent', color: '#374151',
              border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
