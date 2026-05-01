import type { BillingOrder } from '@/lib/api/profile'

interface OrderHistoryTableProps {
  orders: BillingOrder[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OrderHistoryTable({ orders, total, page, limit, onPageChange }: OrderHistoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#1E2050' }}>
              {['Order Date', 'Amount', 'Order Status', 'Invoice'].map((h) => (
                <th
                  key={h}
                  style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.invoice_number} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{formatDate(o.order_date)}</td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>
                    {o.amount.toFixed(2)} {o.currency}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: o.order_status === 'failed' ? '#EF4444' : '#10B981',
                        fontWeight: 600,
                      }}
                    >
                      {o.order_status.charAt(0).toUpperCase() + o.order_status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {o.order_status === 'failed' ? (
                      <button
                        style={{
                          background: '#1D4ED8', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Pay Now
                      </button>
                    ) : o.invoice_url ? (
                      <a
                        href={o.invoice_url}
                        style={{ color: '#1D4ED8', textDecoration: 'underline', fontSize: '13px' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {o.invoice_number}
                      </a>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{o.invoice_number}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{
              padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
              background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? '#D1D5DB' : '#374151', fontSize: '13px',
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  width: '32px', height: '32px', border: 'none', borderRadius: '50%',
                  background: p === page ? '#1E2050' : 'transparent',
                  color: p === page ? '#fff' : '#374151',
                  fontWeight: p === page ? 700 : 400,
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                {p}
              </button>
            )
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
              background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: '13px',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
