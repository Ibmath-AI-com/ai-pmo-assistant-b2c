import { useState } from 'react'
import type { PaymentMethod } from '@/lib/api/profile'

interface PaymentCardProps {
  card: PaymentMethod
  onSetDefault: (id: string) => void
  onRemove: (id: string) => void
}

export function PaymentCard({ card, onSetDefault, onRemove }: PaymentCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false)

  const isExpired =
    card.status === 'expired' ||
    new Date(card.expiry_year, card.expiry_month - 1) < new Date()

  const bg = card.is_default ? '#E6FAF5' : isExpired ? '#FFF0F0' : '#F9FAFB'
  const statusLabel = isExpired ? 'Expired' : 'Active'
  const statusColor = isExpired ? '#EF4444' : '#10B981'

  const expiryStr = `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          background: bg,
          borderRadius: '12px',
          padding: '16px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {card.is_default ? (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D9488' }}>Default</span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>{statusLabel}</span>
        </div>

        {/* Card number */}
        <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '2px', color: '#1F2937' }}>
          **** **** **** {card.last_four}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{expiryStr}</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E3A5F', letterSpacing: '1px' }}>
            {(card.card_brand || 'VISA').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', paddingLeft: '4px' }}>
        {!card.is_default && !isExpired && (
          <button
            onClick={() => onSetDefault(card.payment_method_id)}
            style={{ fontSize: '13px', color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Mark as default
          </button>
        )}
        {confirmRemove ? (
          <span style={{ fontSize: '13px', color: '#374151' }}>
            Remove?{' '}
            <button
              onClick={() => onRemove(card.payment_method_id)}
              style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: 0 }}
            >
              Yes
            </button>
            {' / '}
            <button
              onClick={() => setConfirmRemove(false)}
              style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: 0 }}
            >
              No
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmRemove(true)}
            style={{ fontSize: '13px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
