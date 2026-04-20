import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Clock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const BeneficiaryPortal = () => {
  const [step, setStep] = useState('check'); // check, login, enroll, access
  const [email, setEmail] = useState('');
  const [unlockSecret, setUnlockSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  // Check enrollment status
  const checkStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/beneficiary/auth/check-status`, { email });
      setStatus(res.data.data);
      
      if (res.data.data.status === 'not_found') {
        toast.error('No beneficiary found with this email');
      } else if (res.data.data.status === 'invited') {
        setStep('enroll');
        toast.info('Please complete your enrollment');
      } else if (res.data.data.status === 'enrolled') {
        if (res.data.data.ownerTriggered) {
          setStep('login');
        } else {
          toast.info('The legacy is not yet available. The owner is still active.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error checking status');
    } finally {
      setLoading(false);
    }
  };

  // Complete enrollment
  const completeEnrollment = async (e) => {
    e.preventDefault();
    
    if (unlockSecret.length < 12) {
      toast.error('Unlock secret must be at least 12 characters');
      return;
    }
    
    if (unlockSecret !== confirmSecret) {
      toast.error('Unlock secrets do not match');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/beneficiary/auth/enroll`, {
        email,
        unlockSecret
      });
      toast.success('Enrollment complete! You can now access the legacy when triggered.');
      setStep('check');
      setUnlockSecret('');
      setConfirmSecret('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  // Login and request access
  const loginAndRequestAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Login
      const loginRes = await axios.post(`${API_BASE}/beneficiary/auth/login`, { email });
      const token = loginRes.data.token;
      
      // Request access
      const accessRes = await axios.post(
        `${API_BASE}/beneficiary/auth/request-access`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (accessRes.data.data.status === 'granted') {
        // Create session with unlock secret
        const sessionRes = await axios.post(
          `${API_BASE}/beneficiary/auth/create-session`,
          {
            unlockSecret,
            grantId: accessRes.data.data.grantId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSessionToken(sessionRes.data.data.sessionToken);
        setStep('access');
        toast.success('Access granted!');
      } else {
        toast.info('Access request pending approval');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  const renderCheckStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}
    >
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
        border: '1px solid rgba(0,229,160,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <Shield size={36} style={{ color: '#00e5a0' }} />
      </div>
      
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Beneficiary Portal
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
        Enter your email to check your enrollment status and access the legacy.
      </p>
      
      <form onSubmit={checkStatus} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-2)',
              color: 'var(--text-1)',
              fontSize: 15
            }}
          />
        </div>
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          style={{
            padding: '16px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
            color: '#001a12',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {loading ? 'Checking...' : 'Check Status'}
          <ArrowRight size={18} />
        </motion.button>
      </form>
    </motion.div>
  );

  const renderEnrollStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ maxWidth: 450, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(255,184,48,0.15)',
          border: '1px solid rgba(255,184,48,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Lock size={28} style={{ color: '#ffb830' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Complete Your Enrollment
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Set up your secure unlock secret. You'll need this to access the legacy when it's triggered.
        </p>
      </div>
      
      <form onSubmit={completeEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-2)' }}>
            Create Unlock Secret
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showSecret ? 'text' : 'password'}
              placeholder="Minimum 12 characters"
              value={unlockSecret}
              onChange={(e) => setUnlockSecret(e.target.value)}
              required
              minLength={12}
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-2)',
                color: 'var(--text-1)',
                fontSize: 15
              }}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)'
              }}
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
            This secret will be used to decrypt the legacy contents. Keep it safe.
          </p>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-2)' }}>
            Confirm Unlock Secret
          </label>
          <input
            type={showSecret ? 'text' : 'password'}
            placeholder="Re-enter your secret"
            value={confirmSecret}
            onChange={(e) => setConfirmSecret(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-2)',
              color: 'var(--text-1)',
              fontSize: 15
            }}
          />
        </div>
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          style={{
            padding: '16px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #ffb830, #ff4d6d)',
            color: '#001a12',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: 8
          }}
        >
          {loading ? 'Setting up...' : 'Complete Enrollment'}
        </motion.button>
        
        <button
          type="button"
          onClick={() => setStep('check')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
            fontSize: 14,
            cursor: 'pointer',
            padding: 8
          }}
        >
          ← Back
        </button>
      </form>
    </motion.div>
  );

  const renderLoginStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ maxWidth: 400, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(0,229,160,0.15)',
          border: '1px solid rgba(0,229,160,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <CheckCircle size={28} style={{ color: '#00e5a0' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Legacy Available
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          The Guardian Protocol has been triggered. Enter your unlock secret to access the legacy.
        </p>
      </div>
      
      <form onSubmit={loginAndRequestAccess} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-2)' }}>
            Your Unlock Secret
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showSecret ? 'text' : 'password'}
              placeholder="Enter your unlock secret"
              value={unlockSecret}
              onChange={(e) => setUnlockSecret(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-2)',
                color: 'var(--text-1)',
                fontSize: 15
              }}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)'
              }}
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          style={{
            padding: '16px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
            color: '#001a12',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Accessing...' : 'Access Legacy'}
        </motion.button>
        
        <button
          type="button"
          onClick={() => setStep('check')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-3)',
            fontSize: 14,
            cursor: 'pointer',
            padding: 8
          }}
        >
          ← Back
        </button>
      </form>
    </motion.div>
  );

  const renderAccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
        border: '1px solid rgba(0,229,160,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <Shield size={36} style={{ color: '#00e5a0' }} />
      </div>
      
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Access Granted
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
        You now have access to the legacy. Your session is active for 30 minutes.
      </p>
      
      <div style={{
        background: 'var(--glass-1)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 500,
        margin: '0 auto'
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>
          Available Resources:
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--glass-2)',
            borderRadius: 10
          }}>
            <Lock size={18} style={{ color: '#4f9eff' }} />
            <span style={{ fontSize: 14 }}>Digital Assets & Credentials</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--glass-2)',
            borderRadius: 10
          }}>
            <Clock size={18} style={{ color: '#7c5cfc' }} />
            <span style={{ fontSize: 14 }}>Time Capsules & Messages</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--glass-2)',
            borderRadius: 10
          }}>
            <Shield size={18} style={{ color: '#00e5a0' }} />
            <span style={{ fontSize: 14 }}>Legal Documents & Property Records</span>
          </div>
        </div>
      </div>
      
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>
        Session Token: {sessionToken?.substring(0, 16)}...
      </p>
    </motion.div>
  );

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--glass-1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 28,
          padding: 40
        }}
      >
        <AnimatePresence mode="wait">
          {step === 'check' && renderCheckStep()}
          {step === 'enroll' && renderEnrollStep()}
          {step === 'login' && renderLoginStep()}
          {step === 'access' && renderAccessStep()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BeneficiaryPortal;
