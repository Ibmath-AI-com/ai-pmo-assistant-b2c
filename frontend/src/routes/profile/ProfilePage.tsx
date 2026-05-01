import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { MyInformationTab } from './MyInformationTab'
import { BillingInformationTab } from './BillingInformationTab'
import { PaymentOptionsTab } from './PaymentOptionsTab'

type Tab = 'info' | 'billing' | 'payment'

const tabs: { id: Tab; label: string }[] = [
  { id: 'info', label: 'My Information' },
  { id: 'billing', label: 'Billing Information' },
  { id: 'payment', label: 'Payment Options' },
]

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = rawTab && ['info', 'billing', 'payment'].includes(rawTab) ? rawTab : 'info'

  const [editMode, setEditMode] = useState(false)

  const setTab = (t: Tab) => {
    setSearchParams({ tab: t })
    setEditMode(false)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: '900px' }}>
      {/* Page title */}
      <h1 style={{ fontWeight: 700, fontSize: '22px', color: '#111827', marginBottom: '24px' }}>
        My Profile
      </h1>

      {/* Tab bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EEF0FF 0%, #E8EAFF 100%)',
          borderRadius: '10px',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
          position: 'relative',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#1D4ED8' : '#6B7280',
              borderBottom: activeTab === t.id ? '2px solid #1D4ED8' : '2px solid transparent',
              transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}

        {/* Edit icon — only on My Information tab */}
        {activeTab === 'info' && (
          <button
            onClick={() => setEditMode((v) => !v)}
            title={editMode ? 'Exit edit mode' : 'Edit'}
            style={{
              marginLeft: 'auto',
              background: editMode ? '#EFF6FF' : 'transparent',
              border: editMode ? '1px solid #BFDBFE' : 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: editMode ? '#1D4ED8' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Pencil size={14} />
            {editMode ? 'Editing' : 'Edit'}
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <MyInformationTab
          editMode={editMode}
          onEditDone={() => setEditMode(false)}
        />
      )}
      {activeTab === 'billing' && <BillingInformationTab />}
      {activeTab === 'payment' && <PaymentOptionsTab />}
    </div>
  )
}
