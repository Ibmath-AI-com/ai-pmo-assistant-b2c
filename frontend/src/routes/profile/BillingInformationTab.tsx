import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { OrderHistoryTable } from './components/OrderHistoryTable'
import { profileApi } from '@/lib/api/profile'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function BillingInformationTab() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: profileApi.getSubscription,
  })

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['billing-orders', page],
    queryFn: () => profileApi.getBillingOrders(page, limit),
  })

  const orders = ordersData?.items ?? []
  const total = ordersData?.total ?? 0
  const nextBilling = subscription?.next_billing_date ?? null

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

      {isLoading ? (
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
