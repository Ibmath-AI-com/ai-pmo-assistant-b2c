import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, ChevronDown } from 'lucide-react'
import { AppLogo } from '@/components/ui/AppLogo'
import { useAuthStore } from '@/lib/stores/authStore'

function getFirstName(firstName: string | null, username: string): string {
  return firstName || username
}

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Personas', to: '/personas' },
  { label: 'Knowledge Hub', to: '/knowledge-hub' },
  { label: 'Projects', to: '/projects' },
]

function getInitials(firstName: string | null, lastName: string | null, username: string): string {
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || username[0].toUpperCase()
  }
  return username[0].toUpperCase()
}

function getDisplayName(firstName: string | null, lastName: string | null, username: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ')
  }
  return username
}

export function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user ? getInitials(user.first_name, user.last_name, user.username) : 'U'
  const displayName = user ? getDisplayName(user.first_name, user.last_name, user.username) : 'User'
  const firstName = user ? getFirstName(user.first_name, user.username) : 'User'

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
        {/* Bell */}
        <button className="relative p-1.5 text-white/70 hover:text-white transition-colors">
          <Bell size={18} />
          <span
            className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#EF4444' }}
          />
        </button>

        {/* Message */}
        <button className="relative p-1.5 text-white/70 hover:text-white transition-colors">
          <MessageSquare size={18} />
          <span
            className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#22C55E' }}
          />
        </button>

        {/* Avatar dropdown trigger */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: '#1D4ED8' }}
            >
              {initials}
            </div>
            <span className="text-[14px] font-medium">Welcome, {firstName}</span>
            <ChevronDown
              size={14}
              style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '200px',
                backgroundColor: '#F4F4F4',
                border: '1px solid #D9D9D9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                padding: '10px 0',
                fontFamily: 'Arial, sans-serif',
                zIndex: 100,
              }}
            >
              {/* User info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0 14px 10px 14px',
                  borderBottom: '1px solid #E2E2E2',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  {initials}
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#222222',
                    textDecoration: 'underline',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: '#5C4BB7',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Basic
                </span>
              </div>

              {/* Menu items */}
              <DropdownItem
                label="My Profile"
                icon="👤"
                onClick={() => { setOpen(false); navigate('/profile') }}
              />
              <DropdownItem label="Upgrade Plan" icon="✦" disabled />
              <DropdownItem label="Settings" icon="⚙" disabled />
              <DropdownItem
                label="Logout"
                icon="↪"
                onClick={() => { setOpen(false); handleLogout() }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropdownItem({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: string
  disabled?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '11px 14px',
        border: 'none',
        backgroundColor: hovered && !disabled ? '#EAEAEA' : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'Arial, sans-serif',
        transition: 'background 0.2s ease',
      }}
    >
      {/* Circle icon */}
      <span
        style={{
          width: '28px',
          height: '28px',
          minWidth: '28px',
          borderRadius: '50%',
          backgroundColor: disabled ? '#CBD5E1' : '#1E88E5',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: '14px',
          color: disabled ? '#AAAAAA' : '#222222',
          textDecoration: disabled ? 'none' : 'underline',
        }}
      >
        {label}
      </span>
    </button>
  )
}
