import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('loading'); // loading, valid, invalid
  const [resetStatus, setResetStatus] = useState(null); // null, success, error

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setTokenStatus('valid');
    } else {
      setTokenStatus('invalid');
    }
  }, [searchParams]);

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validatePassword(password)) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        token,
        password
      });
      
      if (response.data.status === 'success') {
        setResetStatus('success');
        toast.success('Password reset successful!');
        
        // Store token and redirect to dashboard after delay
        localStorage.setItem('token', response.data.token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setResetStatus('error');
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (error) {
      setResetStatus('error');
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-base)' }}>
      <div className="stars" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 28, border: '1px solid var(--glass-border)', padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
          {tokenStatus === 'loading' ? (
            <div style={{ textAlign: 'center', padding: '18px 0' }}>
              <Loader2 style={{ width: 34, height: 34, color: 'var(--ion)', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Validating reset token...</p>
            </div>
          ) : tokenStatus === 'invalid' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, background: 'rgba(255,77,109,0.10)', border: '1px solid rgba(255,77,109,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle style={{ width: 28, height: 28, color: 'var(--danger)' }} />
              </div>
              <h1 className="display" style={{ fontSize: 22, marginBottom: 10, textAlign: 'center' }}>Invalid Reset Link</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6, fontSize: 13 }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoToLogin}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 800, boxShadow: 'var(--glow-ion)' }}>
                Request New Reset Link
              </motion.button>
            </div>
          ) : (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, background: 'rgba(79,158,255,0.10)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock style={{ width: 28, height: 28, color: 'var(--ion)' }} />
              </motion.div>

              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="display" style={{ fontSize: 22, marginBottom: 8, textAlign: 'center' }}>
                Set New Password
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ color: 'var(--text-muted)', marginBottom: 18, textAlign: 'center', lineHeight: 1.6, fontSize: 13 }}>
                Choose a strong password for your LastKey account
              </motion.p>

              {resetStatus === 'success' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '18px 0' }}>
                  <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, background: 'rgba(0,229,160,0.10)', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle style={{ width: 28, height: 28, color: 'var(--pulse)' }} />
                  </div>
                  <h2 className="display" style={{ fontSize: 18, marginBottom: 6 }}>Password Reset Successful!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirecting you to dashboard...</p>
                </motion.div>
              ) : (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="password">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <Lock style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        style={{ paddingLeft: 40, paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}
                      >
                        {showPassword ? <EyeOff style={{ width: 16, height: 16, color: 'var(--text-muted)' }} /> : <Eye style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />}
                      </button>
                    </div>
                    {password && !validatePassword(password) && (
                      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle style={{ width: 14, height: 14 }} />
                        Password must be at least 6 characters long
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <Lock style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        style={{ paddingLeft: 40, paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}
                      >
                        {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16, color: 'var(--text-muted)' }} /> : <Eye style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle style={{ width: 14, height: 14 }} />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !validatePassword(password) || password !== confirmPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 800, boxShadow: 'var(--glow-ion)', opacity: (isLoading || !validatePassword(password) || password !== confirmPassword) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} />
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </motion.button>
                </motion.form>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'var(--glass-2)', border: '1px solid var(--glass-border)', color: 'var(--text-1)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
