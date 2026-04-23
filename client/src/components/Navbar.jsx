import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../contexts/AuthContext'

const PUBLIC_ROUTES = [
  '/', '/login', '/signin', '/register', '/signup',
  '/verify-email', '/forgot-password', '/pricing',
  '/privacy', '/terms', '/trust'
]

const DASHBOARD_ROUTES = [
  '/dashboard', '/vault', '/beneficiaries', '/capsules',
  '/voice-messages', '/final-message', '/memoir-ai',
  '/life-timeline', '/legal-documents', '/settings',
  '/activity-logs', '/ai'
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()

  const isPublicRoute = 
    PUBLIC_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/beneficiary')

  const isDashboardRoute = 
    DASHBOARD_ROUTES.some(route => location.pathname.startsWith(route)) ||
    location.pathname.startsWith('/portal')

  // Don't show navbar on dashboard routes
  if (isDashboardRoute) {
    return null
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [])

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } else {
      document.getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSignOut = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const userName = user?.name || user?.email || 'User'
  const userInitials = userName
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // PUBLIC NAVBAR
  if (isPublicRoute) {
    return (
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(3,5,8,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: '64px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          {/* Left: Logo */}
          <Logo size="sm" darkMode={true} />

          {/* Center: Navigation Links (hidden below md) */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '32px'
          }} className="md:flex">
            <button
              onClick={() => scrollToSection('features')}
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('security')}
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              Security
            </button>
          </div>

          {/* Right: Auth Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff'
                e.target.style.borderColor = 'rgba(255,255,255,0.3)'
                e.target.style.backgroundColor = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgba(255,255,255,0.8)'
                e.target.style.borderColor = 'rgba(255,255,255,0.15)'
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #9333ea)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #3b82f6, #a855f7)'
                e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #2563eb, #9333ea)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
    )
  }

  // AUTHENTICATED NAVBAR
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(3,5,8,0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      height: '64px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%'
      }}>
        {/* Left: Logo */}
        <Logo size="sm" darkMode={true} />

        {/* Right: User Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              transition: 'background-color 150ms',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {userInitials}
              </span>
            </div>
            
            {/* Name */}
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff'
            }}>
              {userName}
            </span>
            
            {/* Chevron */}
            <svg 
              style={{
                width: '16px',
                height: '16px',
                color: '#94a3b8',
                transition: 'transform 150ms',
                transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              width: '208px',
              background: '#0b1629',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '8px 0',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => {
                  navigate('/settings')
                  setUserMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#ffffff'
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#cbd5e1'
                  e.target.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>ÿ</span>
                <span>Profile Settings</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/activity-logs')
                  setUserMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#ffffff'
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#cbd5e1'
                  e.target.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>ð</span>
                <span>Activity Logs</span>
              </button>
              
              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.06)',
                margin: '4px 0'
              }} />
              
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#ef4444'
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#f87171'
                  e.target.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>Þ</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

