import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/auth/verify-email?token=${token}`);
        
        if (response.data.status === 'success') {
          setStatus('success');
          setMessage(response.data.message);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-base)', paddingTop: 88 }}>
      <div className="stars" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 28, border: '1px solid var(--glass-border)', padding: 32, textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
          
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ width: 80, height: 80, margin: '0 auto 18px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {status === 'loading' && (
              <div style={{ width: 80, height: 80, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: 34, height: 34, color: 'var(--ion)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {status === 'success' && (
              <div style={{ width: 80, height: 80, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ width: 34, height: 34, color: 'var(--pulse)' }} />
              </div>
            )}
            {status === 'error' && (
              <div style={{ width: 80, height: 80, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle style={{ width: 34, height: 34, color: 'var(--danger)' }} />
              </div>
            )}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="display"
            style={{ fontSize: 22, marginBottom: 10 }}
          >
            {status === 'loading' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6, fontSize: 13 }}
          >
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {status === 'success' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToDashboard}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'var(--text-primary)', fontWeight: 800, boxShadow: 'var(--glow-ion)' }}
              >
                Go to Dashboard
              </motion.button>
            )}
            
            {status === 'error' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToLogin}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1px solid var(--glass-border)', cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-1)', fontWeight: 800 }}
              >
                Back to Login
              </motion.button>
            )}
          </motion.div>

          {/* Help Text */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: 18, padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontSize: 12 }}>
                <Mail style={{ width: 14, height: 14 }} />
                <span>
                  If you continue to have trouble, contact support at support@lastkey.com
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
