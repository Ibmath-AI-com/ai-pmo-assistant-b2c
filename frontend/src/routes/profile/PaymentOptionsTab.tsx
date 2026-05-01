import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PaymentCard } from './components/PaymentCard'
import { AddCardModal } from './components/AddCardModal'
import { profileApi, type PaymentMethodCreate } from '@/lib/api/profile'

export function PaymentOptionsTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: profileApi.listPaymentMethods,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['payment-methods'] })

  const handleSetDefault = async (id: string) => {
    await profileApi.setDefaultPaymentMethod(id)
    invalidate()
  }

  const handleRemove = async (id: string) => {
    await profileApi.removePaymentMethod(id)
    invalidate()
  }

  const handleAddCard = async (data: PaymentMethodCreate) => {
    await profileApi.addPaymentMethod(data)
    invalidate()
    setShowAdd(false)
  }

  if (isLoading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {cards.map((card) => (
          <PaymentCard
            key={card.payment_method_id}
            card={card}
            onSetDefault={handleSetDefault}
            onRemove={handleRemove}
          />
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: '#F9FAFB',
              border: '2px dashed #D1D5DB',
              borderRadius: '12px',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1D4ED8',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            + Add New Card
          </button>
        </div>
      </div>

      {showAdd && (
        <AddCardModal
          onClose={() => setShowAdd(false)}
          onSave={handleAddCard}
        />
      )}
    </div>
  )
}
