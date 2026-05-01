import { NavLink } from 'react-router-dom'
import { Bot, Zap, Clock, Plus } from 'lucide-react'
import { ProjectsSidebarWidget } from '@/components/projects/ProjectsSidebarWidget'

const sectionHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1E40AF, #1E293B)',
  borderRadius: '0',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const sections = [
  {
    id: 'personas',
    label: 'Personas',
    icon: <Bot size={14} />,
    to: '/personas',
    items: ['PMO Advisor', 'Risk Manager', 'Strategy Analyst'],
  },
  {
    id: 'prompts',
    label: 'Ready Prompts',
    icon: <Zap size={14} />,
    to: '/',
    items: ['Create Project Charter', 'Risk Assessment', 'Status Report'],
  },
  {
    id: 'chats',
    label: 'Recent Chats',
    icon: <Clock size={14} />,
    to: '/',
    items: ['Project Alpha Review', 'Q2 Strategy Plan', 'Risk RAID Log'],
  },
]

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 z-40 overflow-y-auto"
      style={{
        top: '114px',
        width: '240px',
        height: 'calc(100vh - 114px)',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
      }}
    >
      <ProjectsSidebarWidget />

      {sections.map((section) => (
        <div key={section.id} className="mb-4">
          {/* Section header */}
          <div style={sectionHeaderStyle}>
            <div className="flex items-center gap-2 text-white">
              {section.icon}
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{section.label}</span>
            </div>
            <NavLink to={section.to}>
              <Plus size={14} className="text-white/80 hover:text-white transition-colors" />
            </NavLink>
          </div>

          {/* List items */}
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {section.items.map((item) => (
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
        </div>
      ))}
    </aside>
  )
}
