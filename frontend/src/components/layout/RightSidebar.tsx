import { BookOpen, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const sectionHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1E40AF, #1E293B)',
  borderRadius: '0',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const knowledgeItems = [
  'PMBOK Guide v7',
  'Company Policies',
  'Project Templates',
  'Risk Framework',
  'Strategy Playbook',
]

export function RightSidebar() {
  return (
    <aside
      className="fixed right-0 z-40 overflow-y-auto"
      style={{
        top: '114px',
        width: '240px',
        height: 'calc(100vh - 114px)',
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #E5E7EB',
      }}
    >
      <div className="mb-4">
        {/* Section header */}
        <div style={sectionHeaderStyle}>
          <div className="flex items-center gap-2 text-white">
            <BookOpen size={14} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Knowledge Hub</span>
          </div>
          <NavLink to="/knowledge-hub">
            <Plus size={14} className="text-white/80 hover:text-white transition-colors" />
          </NavLink>
        </div>

        {/* Items */}
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {knowledgeItems.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 cursor-pointer transition-colors"
              style={{
                padding: '8px 16px',
                borderBottom: '1px solid #F3F4F6',
                fontSize: '13px',
                color: '#374151',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: '#9CA3AF' }}
              />
              {item}
            </li>
          ))}
        </ul>

        {/* View more link */}
        <NavLink
          to="/knowledge-hub"
          style={{
            display: 'block',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#3B82F6',
            textDecoration: 'none',
          }}
        >
          View all →
        </NavLink>
      </div>
    </aside>
  )
}
