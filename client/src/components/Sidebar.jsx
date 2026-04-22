import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import {
  BarChart3,
  Lock,
  Users,
  Package,
  Mic,
  Calendar,
  BookOpen,
  MessageSquare,
  FileText,
  Bot,
  ListChecks,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userName = user?.name || user?.email || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && isSidebarOpen && !e.target.closest('.sidebar-container') && !e.target.closest('.mobile-menu-button')) {
        setIsSidebarOpen(false);
      }
    };

    if (isMobile && isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen]);

  const handleLogout = () => {
    logout();
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="mobile-menu-button"
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#050d1a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.borderColor = '#4f9eff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#050d1a';
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 45,
            backdropFilter: 'blur(4px)'
          }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className="sidebar-container"
        style={{
          width: isMobile ? '280px' : '240px',
          position: 'fixed',
          left: isMobile ? (isSidebarOpen ? 0 : '-280px') : 0,
          top: 0,
          height: '100vh',
          background: '#050d1a',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.04)',
          borderLeft: isMobile && isSidebarOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 46,
          transition: isMobile ? 'left 0.3s ease-in-out, border-left 0.3s ease-in-out' : 'none',
          boxShadow: isMobile && isSidebarOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none'
        }}>
      {/* TOP - Logo area */}
      <div style={{
        padding: '20px 20px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <Logo size="sm" darkMode={true} />
      </div>

      {/* MIDDLE - Navigation */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0'
      }}>
        {/* Group: VAULT */}
        <div>
          <div style={{
            padding: '20px 20px 6px 20px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            VAULT
          </div>
          
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/dashboard' ? '#ffffff' : '#64748b',
              background: location.pathname === '/dashboard' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/dashboard' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/dashboard') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/dashboard') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Dashboard</span>
          </Link>
          
          <Link
            to="/vault"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/vault' ? '#ffffff' : '#64748b',
              background: location.pathname === '/vault' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/vault' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/vault') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/vault') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Vault</span>
          </Link>
          
          <Link
            to="/beneficiaries"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/beneficiaries' ? '#ffffff' : '#64748b',
              background: location.pathname === '/beneficiaries' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/beneficiaries' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/beneficiaries') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/beneficiaries') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Beneficiaries</span>
          </Link>
        </div>

        {/* Group: LEGACY */}
        <div>
          <div style={{
            padding: '20px 20px 6px 20px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            LEGACY
          </div>
          
          <Link
            to="/capsules"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/capsules' ? '#ffffff' : '#64748b',
              background: location.pathname === '/capsules' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/capsules' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/capsules') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/capsules') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>â¡</span>
            <span style={{ flex: 1 }}>Time Capsules</span>
          </Link>
          
          <Link
            to="/voice-messages"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/voice-messages' ? '#ffffff' : '#64748b',
              background: location.pathname === '/voice-messages' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/voice-messages' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/voice-messages') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/voice-messages') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Voice Messages</span>
          </Link>
          
          <Link
            to="/life-timeline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/life-timeline' ? '#ffffff' : '#64748b',
              background: location.pathname === '/life-timeline' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/life-timeline' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/life-timeline') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/life-timeline') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Life Timeline</span>
          </Link>
          
          <Link
            to="/memoir-ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/memoir-ai' ? '#ffffff' : '#64748b',
              background: location.pathname === '/memoir-ai' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/memoir-ai' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/memoir-ai') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/memoir-ai') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Memoir AI</span>
          </Link>
          
          <Link
            to="/final-message"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/final-message' ? '#ffffff' : '#64748b',
              background: location.pathname === '/final-message' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/final-message' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/final-message') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/final-message') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>âµ</span>
            <span style={{ flex: 1 }}>Final Message</span>
          </Link>
        </div>

        {/* Group: VERIFY */}
        <div>
          <div style={{
            padding: '20px 20px 6px 20px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            VERIFY
          </div>
          
          <Link
            to="/legal-documents"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/legal-documents' ? '#ffffff' : '#64748b',
              background: location.pathname === '/legal-documents' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/legal-documents' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/legal-documents') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/legal-documents') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Legal Documents</span>
          </Link>
          
          <Link
            to="/activity-logs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/activity-logs' ? '#ffffff' : '#64748b',
              background: location.pathname === '/activity-logs' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/activity-logs' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/activity-logs') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/activity-logs') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>Activity Logs</span>
          </Link>
        </div>

        {/* Group: TOOLS */}
        <div>
          <div style={{
            padding: '20px 20px 6px 20px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            TOOLS
          </div>
          
          <Link
            to="/ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 12px 2px 12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '2px',
              textDecoration: 'none',
              color: location.pathname === '/ai' ? '#ffffff' : '#64748b',
              background: location.pathname === '/ai' 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.18), rgba(124, 92, 252, 0.1))' 
                : 'transparent',
              border: location.pathname === '/ai' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/ai') {
                e.target.style.color = '#e2e8f0';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/ai') {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>ð</span>
            <span style={{ flex: 1 }}>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* BOTTOM - User section */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '12px'
      }}>
        {/* User card */}
        <div
          onClick={() => window.location.href = '/settings'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 150ms'
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
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {userInitials}
            </span>
          </div>
          
          {/* Name and email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {userName}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {userEmail}
            </div>
          </div>
        </div>
        
        {/* Sign out button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 150ms',
            border: 'none',
            background: 'none',
            borderRadius: '6px',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#ef4444';
            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#64748b';
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '14px' }}>Þ</span>
          <span>Sign Out</span>
        </button>
      </div>
      </div>
    </>
  );
}
