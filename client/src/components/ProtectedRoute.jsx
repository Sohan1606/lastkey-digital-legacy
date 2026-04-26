import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { token, fetchingUser } = useAuth();

  if (fetchingUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, position: 'relative' }}>
        <div className="stars" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(79,158,255,0.15)', borderTopColor: '#4f9eff', position: 'relative', zIndex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          <Shield size={14} color="var(--text-3)" />
          <span style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.05em' }}>Loading your legacy...</span>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/signin" replace />;
  return children;
};

export default ProtectedRoute;
