import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../contexts/AuthContext'

const NAV_GROUPS = [
  {
    label: 'VAULT',
    items: [
      { icon: ' ', label: 'Dashboard', path: '/dashboard' },
      { icon: ' ', label: 'Vault', path: '/vault' },
      { icon: ' ', label: 'Beneficiaries', 
        path: '/beneficiaries' },
    ],
  },
  {
    label: 'LEGACY',
    items: [
      { icon: ' ', label: 'Time Capsules', path: '/capsules' },
      { icon: ' ', label: 'Voice Messages', 
        path: '/voice-messages' },
      { icon: ' ', label: 'Life Timeline', 
        path: '/life-timeline' },
      { icon: ' ', label: 'Memoir AI', path: '/memoir-ai' },
      { icon: ' ', label: 'Final Message', 
        path: '/final-message' },
    ],
  },
  {
    label: 'VERIFY',
    items: [
      { icon: ' ', label: 'Legal Documents', 
        path: '/legal-documents' },
      { icon: ' ', label: 'Activity Logs', 
        path: '/activity-logs' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { icon: ' ', label: 'AI Assistant', path: '/ai' },
    ],
  },
]

export default function Sidebar({ 
  isOpen = true, 
  onClose 
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const name = user?.name || user?.email || 'User'
  const email = user?.email || ''
  const initials = name
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile overlay - only render when sidebar is open */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/60 z-40 
            lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-[240px]
          bg-[var(--bg-surface)] border-r border-[var(--border)]
          flex flex-col z-50
          transition-transform duration-300
          ${isOpen 
            ? 'translate-x-0' 
            : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 
          border-b border-[var(--border)] flex-shrink-0">
          <Logo size="sm" darkMode={true} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-4 pt-4 pb-1.5 text-[10px] 
                font-semibold text-slate-600 
                uppercase tracking-[0.15em]">
                {group.label}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    if (onClose) onClose()
                  }}
                  className={`
                    flex items-center gap-3 w-full
                    mx-auto px-3 py-2.5 mb-0.5
                    rounded-xl text-sm font-medium
                    transition-all duration-150
                    text-[var(--text-muted)]
                    ${isActive(item.path)
                      ? `text-[var(--text-primary)] mx-3 w-[calc(100%-24px)]
                         bg-gradient-to-r 
                         from-[var(--blue-dim)] to-[var(--purple-dim)]
                         border border-[var(--blue-border)]`
                      : `text-[var(--text-secondary)] mx-3 w-[calc(100%-24px)]
                         hover:text-[var(--text-primary)] hover:bg-[var(--border-hover)]`
                    }
                  `}
                >
                  <span className="text-base flex-shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--border)] p-3 
          flex-shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 w-full p-2.5
              hover:bg-[var(--border-hover)] 
              transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full flex-shrink-0
              bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center
              text-[var(--text-primary)] text-xs font-bold">
              {initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white 
                truncate">
                {name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {email}
              </p>
            </div>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 
              py-2 mt-1 rounded-lg text-xs text-slate-600
              hover:text-red-400 hover:bg-red-500/[0.05]
              transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" 
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" 
                strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 
                   4v1a3 3 0 01-3 3H6a3 3 
                   0 01-3-3V7a3 3 0 013-3h4a3 3 
                   0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
