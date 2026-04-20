import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Lock, Users, Clock, FileText, CheckCircle, 
  ArrowRight, ArrowLeft, Key, Fingerprint, Sparkles
} from 'lucide-react';
import { registerPasskey, isWebAuthnSupported } from '../utils/webauthn';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'security', title: 'Security Setup', icon: Shield },
  { id: 'passkey', title: 'Passkey Setup', icon: Fingerprint },
  { id: 'vault', title: 'Vault Encryption', icon: Lock },
  { id: 'guardian', title: 'Guardian Protocol', icon: Clock },
  { id: 'beneficiaries', title: 'Add Beneficiaries', icon: Users },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState([]);
  
  // Form states
  const [vaultPassword, setVaultPassword] = useState('');
  const [inactivityDuration, setInactivityDuration] = useState(30);
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [webauthnSupported, setWebauthnSupported] = useState(false);

  useEffect(() => {
    setWebauthnSupported(isWebAuthnSupported());
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompleted([...completed, steps[currentStep].id]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success('Onboarding complete! Welcome to LastKey.');
    navigate('/dashboard');
  };

  const setupPasskey = async () => {
    setLoading(true);
    const result = await registerPasskey(user.id || user._id, user.email, user.name);
    if (result.success) {
      toast.success('Passkey registered successfully!');
      handleNext();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const setupVault = async () => {
    if (vaultPassword.length < 8) {
      toast.error('Vault password must be at least 8 characters');
      return;
    }
    setLoading(true);
    // Store vault password in session for encryption
    sessionStorage.setItem('vaultPassword', vaultPassword);
    toast.success('Vault encryption configured!');
    setLoading(false);
    handleNext();
  };

  const setupGuardian = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/user/settings`, 
        { inactivityDuration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Guardian Protocol configured!');
      handleNext();
    } catch (err) {
      toast.error('Failed to configure Guardian Protocol');
    }
    setLoading(false);
  };

  const addBeneficiary = async () => {
    if (!beneficiaryEmail || !beneficiaryName) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/beneficiaries`, {
        name: beneficiaryName,
        email: beneficiaryEmail,
        relationship: 'other',
        accessLevel: 'view'
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Beneficiary added! They will receive an invitation email.');
      setBeneficiaryEmail('');
      setBeneficiaryName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add beneficiary');
    }
    setLoading(false);
  };

  const renderStep = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'welcome':
        return (
          <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
              border: '1px solid rgba(0,229,160,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px'
            }}>
              <Sparkles size={48} style={{ color: '#00e5a0' }} />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
              Welcome to LastKey
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32 }}>
              Let's set up your digital legacy in just a few steps. This wizard will guide you through 
              securing your vault, setting up the Guardian Protocol, and adding your beneficiaries.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                color: '#001a12',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Get Started <ArrowRight size={20} />
            </motion.button>
          </div>
        );

      case 'security':
        return (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              Security First
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', textAlign: 'center', marginBottom: 32 }}>
              LastKey uses multiple layers of security to protect your digital legacy.
            </p>
            
            <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
              {[
                { icon: Lock, title: 'Client-Side Encryption', desc: 'Your passwords are encrypted in your browser before reaching our servers.' },
                { icon: Shield, title: 'Zero-Knowledge Architecture', desc: 'We cannot read your vault contents - only you and your beneficiaries can.' },
                { icon: Fingerprint, title: 'Passkey Support', desc: 'Use modern biometric authentication for secure, phishing-resistant access.' },
                { icon: Clock, title: 'Guardian Protocol', desc: 'Automatic legacy transfer after period of inactivity.' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: 20,
                    background: 'var(--glass-2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 16
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(0,229,160,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <item.icon size={22} style={{ color: '#00e5a0' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                  color: '#001a12',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                Continue
              </motion.button>
            </div>
          </div>
        );

      case 'passkey':
        return (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'rgba(124,92,252,0.15)',
              border: '1px solid rgba(124,92,252,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Fingerprint size={40} style={{ color: '#7c5cfc' }} />
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
              Set Up Passkey (Optional)
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>
              Passkeys provide the most secure and convenient way to access your account. 
              Use your fingerprint, face recognition, or device PIN.
            </p>
            
            {!webauthnSupported ? (
              <div style={{
                padding: 16,
                background: 'rgba(255,184,48,0.1)',
                border: '1px solid rgba(255,184,48,0.3)',
                borderRadius: 12,
                marginBottom: 24
              }}>
                <p style={{ fontSize: 14, color: '#ffb830' }}>
                  Your browser doesn't support passkeys. You can still use password login.
                </p>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={setupPasskey}
                disabled={loading}
                style={{
                  padding: '16px 32px',
                  borderRadius: 12,
                  border: '1px solid rgba(124,92,252,0.3)',
                  background: 'rgba(124,92,252,0.1)',
                  color: '#7c5cfc',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Fingerprint size={20} />
                {loading ? 'Setting up...' : 'Register Passkey'}
              </motion.button>
            )}
            
            <div>
              <button
                onClick={handleNext}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        );

      case 'vault':
        return (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'rgba(255,77,109,0.15)',
              border: '1px solid rgba(255,77,109,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Lock size={40} style={{ color: '#ff4d6d' }} />
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              Set Up Your Vault
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', textAlign: 'center', marginBottom: 32 }}>
              Create a master password for your vault. This will encrypt all your sensitive data.
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-2)' }}>
                Vault Master Password
              </label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-2)',
                  color: 'var(--text-1)',
                  fontSize: 15
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                This password is never sent to our servers. It's used to encrypt your data in your browser.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={setupVault}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ff4d6d, #7c5cfc)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Setting up...' : 'Set Up Vault'}
            </motion.button>
          </div>
        );

      case 'guardian':
        return (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'rgba(0,229,160,0.15)',
              border: '1px solid rgba(0,229,160,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Clock size={40} style={{ color: '#00e5a0' }} />
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              Guardian Protocol
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', textAlign: 'center', marginBottom: 32 }}>
              Set how long of inactivity before your legacy is transferred to beneficiaries.
            </p>
            
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>
                Inactivity Duration: <strong>{inactivityDuration} days</strong>
              </label>
              <input
                type="range"
                min="7"
                max="365"
                value={inactivityDuration}
                onChange={(e) => setInactivityDuration(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                <span>7 days</span>
                <span>365 days</span>
              </div>
            </div>
            
            <div style={{
              padding: 16,
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 12,
              marginBottom: 24
            }}>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <strong style={{ color: '#00e5a0' }}>How it works:</strong> If you don't check in for {inactivityDuration} days, 
                the Guardian Protocol will trigger and your beneficiaries will be notified that your legacy is available.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={setupGuardian}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                color: '#001a12',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Configure Guardian Protocol'}
            </motion.button>
          </div>
        );

      case 'beneficiaries':
        return (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'rgba(79,158,255,0.15)',
              border: '1px solid rgba(79,158,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Users size={40} style={{ color: '#4f9eff' }} />
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              Add Your First Beneficiary
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', textAlign: 'center', marginBottom: 32 }}>
              Add at least one trusted person who will receive your legacy.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Beneficiary Name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                style={{
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-2)',
                  color: 'var(--text-1)',
                  fontSize: 15
                }}
              />
              <input
                type="email"
                placeholder="Beneficiary Email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                style={{
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-2)',
                  color: 'var(--text-1)',
                  fontSize: 15
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addBeneficiary}
                disabled={loading}
                style={{
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid rgba(79,158,255,0.3)',
                  background: 'rgba(79,158,255,0.1)',
                  color: '#4f9eff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Adding...' : 'Add Beneficiary'}
              </motion.button>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleNext}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                I'll add beneficiaries later →
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
              border: '1px solid rgba(0,229,160,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px'
            }}>
              <CheckCircle size={48} style={{ color: '#00e5a0' }} />
            </div>
            
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
              You're All Set!
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32 }}>
              Your digital legacy is now secured. You can always add more assets, 
              beneficiaries, and documents from your dashboard.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                color: '#001a12',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </motion.button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div className="stars" />
      
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            {steps.map((step, i) => (
              <div 
                key={step.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: i <= currentStep ? 1 : 0.4
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: i <= currentStep ? 'linear-gradient(135deg, #00e5a0, #4f9eff)' : 'var(--glass-2)',
                  border: `1px solid ${i <= currentStep ? 'rgba(0,229,160,0.3)' : 'var(--glass-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <step.icon size={18} style={{ color: i <= currentStep ? '#001a12' : 'var(--text-3)' }} />
                </div>
                <span style={{ fontSize: 10, color: i <= currentStep ? 'var(--text-1)' : 'var(--text-3)' }}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            height: 4,
            background: 'var(--glass-2)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00e5a0, #4f9eff)',
                borderRadius: 2
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 28,
            padding: 40
          }}
        >
          {renderStep()}
        </motion.div>

        {/* Navigation */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
