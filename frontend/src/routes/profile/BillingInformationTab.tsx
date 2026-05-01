import { useEffect, useState } from 'react'
import { OrderHistoryTable } from './components/OrderHistoryTable'
import { profileApi, type BillingOrder } from '@/lib/api/profile'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function BillingInformationTab() {
  const [orders, setOrders] = useState<BillingOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [nextBilling, setNextBilling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const limit = 10

  useEffect(() => {
    profileApi.getSubscription().then((s) => setNextBilling(s.next_billing_date))
  }, [])

  useEffect(() => {
    setLoading(true)
    profileApi
      .getBillingOrders(page, limit)
      .then((r) => {
        setOrders(r.items)
        setTotal(r.total)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      {nextBilling && (
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          Your next billing date is <strong>{formatDate(nextBilling)}</strong> !!
        </p>
      )}

      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #1D4ED8', paddingBottom: '2px' }}>
          Order History
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
      ) : (
        <OrderHistoryTable
          orders={orders}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
