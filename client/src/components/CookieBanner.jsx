import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay to not interrupt initial page load
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 50, maxWidth: 420, marginLeft: 'auto' }}
    >
      <div style={{ background: 'rgba(7,14,27,0.96)', backdropFilter: 'blur(24px)', borderRadius: 18, boxShadow: '0 20px 70px rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.10)', padding: 18, position: 'relative' }}>
        {/* Close button */}
        <button
          onClick={handleDecline}
          style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, borderRadius: 10 }}
          aria-label="Close cookie banner"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        {/* Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,184,48,0.10)', border: '1px solid rgba(255,184,48,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cookie style={{ width: 18, height: 18, color: 'var(--amber)' }} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Cookie Notice</h3>
        </div>

        {/* Content */}
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.6 }}>
          We use essential cookies only to provide our services and remember your preferences. 
          No tracking or advertising cookies are used.
        </p>

        {/* Links */}
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
          <Link 
            to="/privacy" 
            style={{ color: 'var(--ion)', textDecoration: 'underline', fontWeight: 700 }}
            onClick={() => setIsVisible(false)}
          >
            Privacy Policy
          </Link>
          <span style={{ margin: '0 8px', color: 'var(--text-3)' }}>•</span>
          <Link 
            to="/terms" 
            style={{ color: 'var(--ion)', textDecoration: 'underline', fontWeight: 700 }}
            onClick={() => setIsVisible(false)}
          >
            Terms of Service
          </Link>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAccept}
            style={{ flex: 1, background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 12, padding: '10px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', color: 'white', boxShadow: 'var(--glow-ion)' }}
          >
            Accept Essential Cookies
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDecline}
            style={{ padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
          >
            Decline
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CookieBanner;
