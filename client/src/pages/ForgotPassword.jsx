import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      
      if (response.data.status === 'success') {
        setIsSubmitted(true);
        toast.success('If an account exists, you will receive a reset link');
      } else {
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-base)', paddingTop: 88 }}>
      <div className="stars" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 28, border: '1px solid var(--glass-border)', padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
          
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={handleBackToLogin}
            style={{ marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontWeight: 600 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 13 }}>Back to Login</span>
          </motion.button>

          {!isSubmitted ? (
            <>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Mail style={{ width: 28, height: 28, color: 'var(--ion)' }} />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="display"
                style={{ fontSize: 22, marginBottom: 8, textAlign: 'center' }}
              >
                Forgot Your Password?
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'var(--text-2)', marginBottom: 22, textAlign: 'center', lineHeight: 1.6, fontSize: 13 }}
              >
                No worries! Enter your email address and we'll send you a link to reset your password.
              </motion.p>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label htmlFor="email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <Mail style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: 40 }}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-base)', 
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: 'var(--glow-ion)',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </motion.button>
              </motion.form>
            </>
          ) : (
            <>
              {/* Success State */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, background: 'rgba(0,229,160,0.10)', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle style={{ width: 28, height: 28, color: 'var(--pulse)' }} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="display"
                style={{ fontSize: 22, marginBottom: 10, textAlign: 'center' }}
              >
                Check Your Email
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'var(--text-2)', marginBottom: 18, textAlign: 'center', lineHeight: 1.6, fontSize: 13 }}
              >
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 1 hour.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ padding: 14, background: 'rgba(255,184,48,0.06)', border: '1px solid rgba(255,184,48,0.22)', borderRadius: 14 }}>
                  <p style={{ color: 'var(--amber)', fontSize: 12, textAlign: 'center', margin: 0 }}>
                    <strong>Didn’t receive the email?</strong> Check spam, or{' '}
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--ion)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToLogin}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: 'var(--glass-2)', border: '1px solid var(--glass-border)', color: 'var(--text-1)', cursor: 'pointer', fontWeight: 700 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-3)'; e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-2)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  Back to Login
                </motion.button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
