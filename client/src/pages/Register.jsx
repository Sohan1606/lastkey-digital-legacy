import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: [] };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('One uppercase letter');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('One lowercase letter');
    
    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('One number');
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('One special character');
    
    return { score, feedback };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return '#ef4444'; // red
    if (passwordStrength.score <= 3) return '#f97316'; // orange
    if (passwordStrength.score <= 4) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setRegisterLoading(true);

    try {
      await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      });
      toast.success('Account created! Redirecting to onboarding...');
      setTimeout(() => navigate('/onboarding'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
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
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '88px'
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
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
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
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          Create your legacy
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Join thousands preserving what matters most
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--red-dim)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--red)' }} />
            <span style={{ color: 'var(--red)', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Full Name
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
                <User style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              </div>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 158, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-hover)';
                  e.target.style.color = 'var(--text-primary)';
                }}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
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
                <Mail style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              </div>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 158, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-hover)';
                  e.target.style.color = 'var(--text-primary)';
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
              color: 'var(--text-secondary)',
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 158, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-hover)';
                  e.target.style.color = 'var(--text-primary)';
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
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: '16px', height: '16px', color: '#64748b' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px', color: '#64748b' }} />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: getPasswordStrengthColor(),
                    fontWeight: 500
                  }}>
                    Password strength: {getPasswordStrengthText()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}>
                    {passwordStrength.score}/5
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    background: getPasswordStrengthColor(),
                    transition: 'all 300ms ease'
                  }} />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginTop: '2px'
                      }}>
                        <XCircle style={{ width: '10px', height: '10px', color: '#ef4444' }} />
                        {feedback}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Confirm Password
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
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 158, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-hover)';
                  e.target.style.color = 'var(--text-primary)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {showConfirmPassword ? (
                  <EyeOff style={{ width: '16px', height: '16px', color: '#64748b' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px', color: '#64748b' }} />
                )}
              </button>
            </div>
            {formData.confirmPassword && (
              <div style={{ marginTop: '4px' }}>
                {formData.password === formData.confirmPassword ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--green)'
                  }}>
                    <CheckCircle style={{ width: '12px', height: '12px' }} />
                    Passwords match
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--red)'
                  }}>
                    <XCircle style={{ width: '12px', height: '12px' }} />
                    Passwords do not match
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={registerLoading || passwordStrength.score < 3}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: registerLoading || passwordStrength.score < 3 ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
              opacity: registerLoading || passwordStrength.score < 3 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!registerLoading && passwordStrength.score >= 3) {
                e.target.style.background = 'var(--blue)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = 'var(--shadow-blue)';
                e.target.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!registerLoading && passwordStrength.score >= 3) {
                e.target.style.background = 'linear-gradient(135deg, #4f9eff, #7c5cfc)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {registerLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating account...
              </>
            ) : (
              <>
                <Shield style={{ width: '16px', height: '16px' }} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{
                color: 'var(--blue)',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 150ms'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--blue-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--blue)'}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'var(--blue-dim)',
          border: '1px solid var(--blue-border)',
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

          </div>
  );
};

export default Register;
