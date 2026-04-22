import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ variant = 'app' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/privacy', '/terms', '/trust', '/pricing', '/beneficiary-portal'];

  const isPublic = publicRoutes.includes(location.pathname);
  const isPublicAuthed = isPublic && user;
  const isApp = !isPublic || user;

  const navItems = {
    public: [
      { label: 'Security', href: '/trust' },
      ...(process.env.VITE_FEATURE_PAYMENTS === 'true' ? [{ label: 'Pricing', href: '/pricing' }] : []),
      { label: 'Beneficiary Portal', href: '/beneficiary-portal' },
    ],
    app: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Vault', href: '/vault' },
      { label: 'Beneficiaries', href: '/beneficiaries' },
      { label: 'Capsules', href: '/capsules' },
      ...(process.env.VITE_FEATURE_AI === 'true' ? [{ label: 'AI', href: '/ai' }] : []),
      ...(process.env.VITE_FEATURE_PAYMENTS === 'true' ? [{ label: 'Pricing', href: '/pricing' }] : []),
      { label: 'Legal Documents', href: '/legal-documents' },
      { label: 'Settings', href: '/settings' },
    ]
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
      background: 'rgba(255,255,255,0.1)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <BrandMark size={28} />
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-1)' }}>LastKey</span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {variant === 'public' && navItems.public.map(item => (
            <Link key={item.href} to={item.href} style={{ color: 'var(--text-1)', textDecoration: 'none', fontWeight: 500 }}>
              {item.label}
            </Link>
          ))}

          {variant === 'public-authed' && (
            <>
              <Link to="/dashboard" style={{ color: 'var(--text-1)', textDecoration: 'none', fontWeight: 500 }}>
                Go to Dashboard
              </Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-1)', cursor: 'pointer' }}>
                Sign Out
              </button>
            </>
          )}

          {variant === 'app' && (
            <>
              {navItems.app.map(item => (
                <Link key={item.href} to={item.href} style={{ color: 'var(--text-1)', textDecoration: 'none', fontWeight: 500 }}>
                  {item.label}
                </Link>
              ))}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-1)', cursor: 'pointer' }}
                >
                  <User size={20} />
                  <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'var(--glass-1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '0.5rem',
                        minWidth: '160px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    >
                      <button 
                        onClick={handleLogout}
                        style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-1)' }}
                      >
                        <LogOut size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            display: '(max-width: 768px)' ? 'block' : 'none', 
            background: 'none', border: 'none', cursor: 'pointer' 
          }}
          className="mobile-menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                position: 'fixed',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--glass-1)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                padding: '1rem 2rem'
              }}
            >
              {variant === 'public' && navItems.public.map(item => (
                <Link 
                  key={item.href} 
                  to={item.href} 
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'block', color: 'var(--text-1)', textDecoration: 'none', marginBottom: '1rem', fontWeight: 500 }}
                >
                  {item.label}
                </Link>
              ))}
              {variant === 'app' && (
                <div>
                  {navItems.app.map(item => (
                    <Link 
                      key={item.href} 
                      to={item.href} 
                      onClick={() => setIsOpen(false)}
                      style={{ display: 'block', color: 'var(--text-1)', textDecoration: 'none', marginBottom: '1rem', fontWeight: 500 }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button 
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem', border: 'none', background: 'none', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', marginTop: '1rem' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;

