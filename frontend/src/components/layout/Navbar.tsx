import { NavLink } from 'react-router-dom'
import { Bell, MessageSquare, ChevronDown } from 'lucide-react'
import { AppLogo } from '@/components/ui/AppLogo'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Personas', to: '/personas' },
  { label: 'Knowledge Hub', to: '/knowledge-hub' },
  { label: 'Admin', to: '/admin' },
]

export function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{ backgroundColor: '#0F172A', height: '56px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <AppLogo size={28} />
        <span className="text-white font-bold text-[16px] tracking-tight">
          AI PMO & Strategy Assistant
        </span>
      </div>

      {/* Center nav links */}
      <nav className="flex items-center gap-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              [
                'px-4 py-1 text-[14px] font-medium text-white transition-colors',
                isActive
                  ? 'border-b-2 border-white pb-[2px]'
                  : 'opacity-70 hover:opacity-100',
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Bell with red badge */}
        <button className="relative p-1.5 text-white/70 hover:text-white transition-colors">
          <Bell size={18} />
          <span
            className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#EF4444' }}
          />
        </button>

        {/* Message with green badge */}
        <button className="relative p-1.5 text-white/70 hover:text-white transition-colors">
          <MessageSquare size={18} />
          <span
            className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#22C55E' }}
          />
        </button>

        {/* Avatar + name */}
        <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            U
          </div>
          <span className="text-[14px] font-medium">Welcome, User</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  )
}
