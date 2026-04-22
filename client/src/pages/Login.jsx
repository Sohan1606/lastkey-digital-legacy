import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      await login({ email: formData.email, password: formData.password });
      toast.success('Welcome back! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #030508, #070e1b, #030508)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '384px',
        height: '384px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '50%',
        filter: 'blur(96px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '25%',
        width: '384px',
        height: '384px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '50%',
        filter: 'blur(96px)',
        pointerEvents: 'none'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 28, scale: 0.97 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.45, ease: [0.23,1,0.32,1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '448px',
          background: 'rgba(7, 14, 27, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '32px'
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Logo size="md" darkMode={true} />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          Welcome back
        </h1>
        <p style={{
          color: '#94a3b8',
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Sign in to access your digital legacy
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#e2e8f0',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <Mail style={{ width: '16px', height: '16px', color: '#64748b' }} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#030508',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#e2e8f0',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <Lock style={{ width: '16px', height: '16px', color: '#64748b' }} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  background: '#030508',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {showPassword ? (
                  <EyeOff style={{ width: '16px', height: '16px', color: '#64748b' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px', color: '#64748b' }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginLoading}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loginLoading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
              opacity: loginLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loginLoading) {
                e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loginLoading) {
                e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loginLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </>
            ) : (
              <>
                <Shield style={{ width: '16px', height: '16px' }} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            marginBottom: '12px'
          }}>
            No account?{' '}
            <Link 
              to="/register" 
              style={{
                color: '#3b82f6',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = '#2563eb'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              Create one free
            </Link>
          </p>
          <Link 
            to="/forgot-password" 
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'color 150ms'
            }}
            onMouseEnter={(e) => e.target.style.color = '#e2e8f0'}
            onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
          >
            Forgot your password?
          </Link>
        </div>

        {/* Security Note */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Shield style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#3b82f6'
            }}>
              Protected by Zero-Knowledge Encryption
            </span>
          </div>
          <p style={{
            fontSize: '11px',
            color: '#64748b',
            margin: 0,
            lineHeight: '1.4'
          }}>
            Your password never leaves your device. We use AES-256 encryption to secure your data.
          </p>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
