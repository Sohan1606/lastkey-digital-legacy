import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';
import AuthForm from '../components/AuthForm';

const Login = () => {
  const [error, setError] = useState('');
  const { login, loginLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    setError('');
    login({ email: formData.email, password: formData.password }, {
      onSuccess: () => navigate('/dashboard'),
      onError: (err) => setError(err.response?.data?.message || 'Invalid credentials'),
    });
  };

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div className="stars" />
      <div style={{ position: 'absolute', top: '25%', left: '15%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.06),transparent)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '25%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.06),transparent)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.23,1,0.32,1] }}
        style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, padding: '44px 38px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(79,158,255,0.4)' }}>
            <Shield size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#4f9eff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LastKey</span>
        </div>

        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: '#f0f4ff', marginBottom: 6, letterSpacing: '-0.02em' }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 30 }}>Sign in to access your digital legacy</p>

        <AuthForm type="login" onSubmit={handleSubmit} loading={loginLoading} error={error} buttonText="Sign In" />

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            No account? <Link to="/register" style={{ color: 'var(--ion)', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </p>
          <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>Forgot your password?</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
