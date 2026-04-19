import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Lock, Users, Clock, Bot, Mic,
  Calendar, BookOpen, Trophy, Menu, X, LogOut,
  ChevronDown, Shield, Zap, Heart, Settings, MessageSquare,
  ClipboardList, ShieldCheck
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close dropdowns on route change
  useEffect(() => { setMoreOpen(false); setMobileOpen(false); }, [location.pathname]);

  // Click outside to close more dropdown (ENFORCEMENT 6)
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-more-dropdown]')) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  const primary = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Vault', path: '/vault', icon: Lock },
    { name: 'Capsules', path: '/capsules', icon: Clock },
    { name: 'AI Writer', path: '/ai', icon: Bot },
  ];

  const more = [
    { name: 'Beneficiaries', path: '/beneficiaries', icon: Users },
    { name: 'Voice', path: '/voice-messages', icon: Mic },
    { name: 'Timeline', path: '/life-timeline', icon: Calendar },
    { name: 'Memoir', path: '/memoir-ai', icon: BookOpen },
    { name: 'Final Message', path: '/final-message', icon: MessageSquare },
    { name: 'Activity Logs', path: '/activity-logs', icon: ClipboardList },
    { name: 'Achievements', path: '/gamification', icon: Trophy },
    { name: 'Trust & Security', path: '/trust', icon: ShieldCheck },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Emergency', path: '/emergency', icon: Heart },
    { name: 'Pricing', path: '/pricing', icon: Zap },
  ];

  const isActive = (path) => location.pathname === path;

  // Check if any "more" route is active (ENFORCEMENT 6)
  const moreActive = more.some(item => location.pathname === item.path);

  const linkStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', borderRadius: 10,
    fontSize: 13, fontWeight: active ? 600 : 500,
    color: active ? '#4f9eff' : 'rgba(136,153,187,0.85)',
    background: active ? 'rgba(79,158,255,0.10)' : 'transparent',
    border: active ? '1px solid rgba(79,158,255,0.22)' : '1px solid transparent',
    textDecoration: 'none', transition: 'all 0.18s ease', whiteSpace: 'nowrap',
  });

  const hoverLink = (e, active) => {
    if (!active) { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }
  };
  const unhoverLink = (e, active) => {
    if (!active) { e.currentTarget.style.color = 'rgba(136,153,187,0.85)'; e.currentTarget.style.background = 'transparent'; }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '10px 16px' }}
      >
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          background: scrolled ? 'rgba(7,14,27,0.92)' : 'rgba(7,14,27,0.6)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : 'none',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(79,158,255,0.45)' }}>
              <Shield size={15} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 19, background: 'linear-gradient(135deg,#4f9eff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LastKey</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden md:flex">
              {primary.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} style={linkStyle(active)}
                    onMouseEnter={e => hoverLink(e, active)} onMouseLeave={e => unhoverLink(e, active)}>
                    <Icon size={13} />{item.name}
                  </Link>
                );
              })}

              {/* More dropdown */}
              <div style={{ position: 'relative' }} data-more-dropdown>
                <button onClick={() => setMoreOpen(o => !o)}
                  style={{ ...linkStyle(moreActive), background: moreActive ? 'rgba(79,158,255,0.10)' : 'transparent', cursor: 'pointer', border: moreActive ? '1px solid rgba(79,158,255,0.22)' : '1px solid transparent' }}
                  onMouseEnter={e => { if (!moreActive) { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                  onMouseLeave={e => { if (!moreActive) { e.currentTarget.style.color = 'rgba(136,153,187,0.85)'; e.currentTarget.style.background = 'transparent'; }}}
                >
                  More
                  <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
                    <ChevronDown size={12} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: 'rgba(7,14,27,0.97)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: 14, padding: 6, minWidth: 180,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.7)', zIndex: 200,
                      }}
                    >
                      {more.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                          <Link key={item.path} to={item.path}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: active ? '#4f9eff' : 'rgba(136,153,187,0.9)', textDecoration: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = active ? '#4f9eff' : 'rgba(136,153,187,0.9)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Icon size={13} />{item.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <>
                <div className="hidden md:flex" style={{ alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '5px 11px' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(240,244,255,0.8)', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
                  {user.isPremium && <Zap size={11} color="#ffb830" />}
                </div>
                <button onClick={() => { logout(); navigate('/'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'rgba(255,77,109,0.8)', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.18)', cursor: 'pointer', transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff4d6d'; e.currentTarget.style.background = 'rgba(255,77,109,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,77,109,0.8)'; e.currentTarget.style.background = 'rgba(255,77,109,0.08)'; }}
                >
                  <LogOut size={13} />
                  <span className="hidden md:inline">Sign out</span>
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link to="/login" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(136,153,187,0.9)', textDecoration: 'none' }}>Sign in</Link>
                {/* Trust & Security link for public nav (ENFORCEMENT 6) */}
                <Link to="/trust" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(136,153,187,0.9)', textDecoration: 'none' }}>Security</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Get Started</Link>
              </div>
            )}
            <button className="md:hidden" onClick={() => setMobileOpen(o => !o)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 7, color: '#f0f4ff', cursor: 'pointer', display: 'flex' }}>
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ position: 'fixed', top: 74, left: 12, right: 12, zIndex: 99, background: 'rgba(7,14,27,0.98)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12 }}>
            {/* Public links for non-authenticated users (ENFORCEMENT 6) */}
            {!user && (
              <>
                <Link to="/trust"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: isActive('/trust') ? '#4f9eff' : 'rgba(136,153,187,0.9)', textDecoration: 'none', marginBottom: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive('/trust') ? '#4f9eff' : 'rgba(136,153,187,0.9)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <ShieldCheck size={15} />🛡️ Trust & Security
                </Link>
                <Link to="/pricing"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: isActive('/pricing') ? '#4f9eff' : 'rgba(136,153,187,0.9)', textDecoration: 'none', marginBottom: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive('/pricing') ? '#4f9eff' : 'rgba(136,153,187,0.9)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Zap size={15} />💰 Pricing
                </Link>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
              </>
            )}
            {[...primary, ...more].map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: isActive(item.path) ? '#4f9eff' : 'rgba(136,153,187,0.9)', textDecoration: 'none', marginBottom: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive(item.path) ? '#4f9eff' : 'rgba(136,153,187,0.9)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={15} />{item.name}
                </Link>
              );
            })}
            {user && (
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                style={{ width: '100%', marginTop: 8, padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#ff4d6d', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.18)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                <LogOut size={15} /> Sign out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
