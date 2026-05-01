import { useEffect, useState } from 'react'
import { PaymentCard } from './components/PaymentCard'
import { AddCardModal } from './components/AddCardModal'
import { profileApi, type PaymentMethod, type PaymentMethodCreate } from '@/lib/api/profile'

export function PaymentOptionsTab() {
  const [cards, setCards] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    setLoading(true)
    profileApi.listPaymentMethods().then(setCards).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSetDefault = async (id: string) => {
    await profileApi.setDefaultPaymentMethod(id)
    load()
  }

  const handleRemove = async (id: string) => {
    await profileApi.removePaymentMethod(id)
    load()
  }

  const handleAddCard = async (data: PaymentMethodCreate) => {
    await profileApi.addPaymentMethod(data)
    load()
  }

  if (loading) {
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

        {/* Add New Card tile */}
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
