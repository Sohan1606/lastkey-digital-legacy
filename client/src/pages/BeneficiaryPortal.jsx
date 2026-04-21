import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Clock, Eye, EyeOff, ArrowRight, Key, Download, FileText, Unlock, UserCheck, FileKey } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  generateRSAKeypair, 
  exportRSAPublicKey, 
  exportRSAPrivateKey,
  importRSAPrivateKey,
  decryptDEKAsBeneficiary,
  decryptTextWithDEK,
  decryptFileWithDEK,
  deriveKey,
  encryptText
} from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Stepper component for visual flow indication
const Stepper = ({ currentStep, steps }) => {
  const stepConfig = {
    check: 0,
    otp: 1,
    enroll: 2,
    login: 2,
    access: 3
  };
  
  const currentIndex = stepConfig[currentStep] || 0;
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: 32,
      padding: '0 20px'
    }}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isCompleted ? '#00e5a0' : isActive ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isCompleted ? '#00e5a0' : isActive ? '#00e5a0' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted ? '#001a12' : isActive ? '#00e5a0' : 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                fontSize: 14
              }}>
                {isCompleted ? <CheckCircle size={20} /> : step.icon}
              </div>
              <span style={{
                fontSize: 11,
                color: isActive ? '#00e5a0' : 'rgba(255,255,255,0.5)',
                fontWeight: isActive ? 600 : 400,
                textAlign: 'center',
                maxWidth: 80
              }}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{
                width: 40,
                height: 2,
                background: index < currentIndex ? '#00e5a0' : 'rgba(255,255,255,0.1)',
                margin: '0 8px',
                marginBottom: 20
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BeneficiaryPortal = () => {
  const [step, setStep] = useState('check'); // check, otp, login, enroll, access
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [unlockSecret, setUnlockSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [grantId, setGrantId] = useState(null);
  
  // Vault access state
  const [assets, setAssets] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [dek, setDek] = useState(null);
  const [activeTab, setActiveTab] = useState('assets');
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [downloadedDocs, setDownloadedDocs] = useState({}); // track downloaded doc blobs

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
        // For invited beneficiaries, they need to login with OTP first, then enroll
        toast.info('Please verify your email first');
        startOtpLogin();
      } else if (res.data.data.status === 'enrolled') {
        if (res.data.data.ownerTriggered) {
          toast.info('Please verify with OTP to access');
          startOtpLogin();
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

  // Start OTP login flow
  const startOtpLogin = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/beneficiary/auth/login/start`, { email });
      setStep('otp');
      toast.success('OTP sent! Check your email (or console in FREE_MODE)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/beneficiary/auth/login/verify`, { 
        email, 
        otp 
      });
      
      setAuthToken(res.data.token);
      
      // Check if enrollment is needed
      if (res.data.data.beneficiary && !res.data.data.beneficiary.hasEncryptionKeys) {
        setStep('enroll');
        toast.info('Please complete your enrollment');
      } else if (res.data.data.owner?.triggered) {
        setStep('login');
      } else {
        toast.info('Login successful. Legacy not yet available.');
        setStep('check');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Complete enrollment with encryption keys
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
      // Generate RSA keypair for beneficiary
      const keypair = await generateRSAKeypair();
      const publicKeyJwk = await exportRSAPublicKey(keypair.publicKey);
      const privateKeyJwk = await exportRSAPrivateKey(keypair.privateKey);
      
      // Encrypt private key with unlock secret
      const kek = await deriveKey(unlockSecret, email);
      const privateKeyJson = JSON.stringify(privateKeyJwk);
      const encryptedPrivateKey = await encryptText(privateKeyJson, kek);
      
      // Parse encrypted private key blob
      const encryptedPrivateKeyBlob = {
        iv: encryptedPrivateKey.slice(0, 24), // First 16 bytes = 24 base64 chars
        ciphertext: encryptedPrivateKey,
        kdfSalt: btoa(email), // Use email as salt
        kdfIterations: 100000,
        algVersion: '1'
      };
      
      await axios.post(`${API_BASE}/beneficiary/auth/enroll`, {
        unlockSecret,
        publicKeyJwk: JSON.stringify(publicKeyJwk),
        encryptedPrivateKeyBlob
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      toast.success('Enrollment complete! You can now access the legacy when triggered.');
      setStep('check');
      setUnlockSecret('');
      setConfirmSecret('');
      setAuthToken(null);
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  // Login and request access (after OTP verification)
  const loginAndRequestAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Request access using existing authToken from OTP verification
      const accessRes = await axios.post(
        `${API_BASE}/beneficiary/auth/request-access`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (accessRes.data.data.status === 'granted') {
        setGrantId(accessRes.data.data.grantId);
        
        // Create session with unlock secret
        const sessionRes = await axios.post(
          `${API_BASE}/beneficiary/auth/create-session`,
          {
            unlockSecret,
            grantId: accessRes.data.data.grantId
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        setSessionToken(sessionRes.data.data.sessionToken);
        
        // Load vault data and decrypt DEK
        await loadVaultData(unlockSecret, sessionRes.data.data.sessionToken);
        
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

  // Load vault data and decrypt DEK
  const loadVaultData = async (secret, token) => {
    try {
      const headers = { 
        Authorization: `Bearer ${authToken}`,
        'X-Session-Token': token
      };

      // Fetch vault share (encrypted DEK)
      const shareRes = await axios.get(`${API_BASE}/beneficiary/portal/vault-share`, { headers });
      const { encryptedDekB64, encryptedPrivateKeyBlob } = shareRes.data.data;

      // Decrypt private key with unlock secret
      const kek = await deriveKey(secret, email);
      const privateKeyJson = await decryptPrivateKey(encryptedPrivateKeyBlob, kek);
      const privateKey = await importRSAPrivateKey(JSON.parse(privateKeyJson));

      // Decrypt DEK with private key
      const dekKey = await decryptDEKAsBeneficiary(encryptedDekB64, privateKey);
      setDek(dekKey);

      // Fetch assets, capsules, documents in parallel
      const [assetsRes, capsulesRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE}/beneficiary/portal/assets`, { headers }),
        axios.get(`${API_BASE}/beneficiary/portal/capsules`, { headers }),
        axios.get(`${API_BASE}/beneficiary/portal/legal-documents`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      setAssets(assetsRes.data.data || []);
      setCapsules(capsulesRes.data.data || []);
      setDocuments(docsRes.data.data || []);

    } catch (err) {
      console.error('Vault loading error:', err);
      toast.error('Failed to load vault data');
      throw err;
    }
  };

  // Decrypt private key blob
  const decryptPrivateKey = async (blob, kek) => {
    // Parse the encrypted blob
    const combined = Uint8Array.from(atob(blob.ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      kek,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  };

  // Decrypt asset password
  const decryptAssetPassword = async (assetId, encryptedPassword) => {
    if (!dek) {
      toast.error('DEK not available');
      return;
    }
    
    try {
      const decrypted = await decryptTextWithDEK(encryptedPassword, dek);
      setDecryptedPasswords(prev => ({ ...prev, [assetId]: decrypted }));
      
      // Auto-hide after 30 seconds
      setTimeout(() => {
        setDecryptedPasswords(prev => {
          const next = { ...prev };
          delete next[assetId];
          return next;
        });
      }, 30000);
    } catch (err) {
      toast.error('Failed to decrypt password');
    }
  };

  // Download and decrypt legal document attachment
  const downloadAndDecryptDoc = async (docId, attachmentId, encrypted) => {
    if (!dek) {
      toast.error('DEK not available');
      return;
    }
    
    const cacheKey = `${docId}_${attachmentId}`;
    
    try {
      toast.loading('Downloading...', { id: cacheKey });
      
      // Download raw bytes
      const response = await axios.get(
        `${API_BASE}/beneficiary/portal/legal-documents/${docId}/attachments/${attachmentId}/file`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'X-Session-Token': sessionToken
          },
          responseType: 'arraybuffer'
        }
      );
      
      const mimeType = response.headers['content-type'] || 'application/octet-stream';
      
      if (!encrypted) {
        // Legacy unencrypted file - save as-is
        const blob = new Blob([response.data], { type: mimeType });
        setDownloadedDocs(prev => ({ ...prev, [cacheKey]: { blob, mimeType, decrypted: true } }));
        toast.success('Downloaded (unencrypted legacy file)', { id: cacheKey });
        return;
      }
      
      // Decrypt with DEK
      // The file was encrypted as a single blob (IV + ciphertext combined)
      const combined = new Uint8Array(response.data);
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        dek,
        ciphertext
      );
      
      const blob = new Blob([decryptedBuffer], { type: mimeType });
      setDownloadedDocs(prev => ({ ...prev, [cacheKey]: { blob, mimeType, decrypted: true } }));
      toast.success('Downloaded and decrypted!', { id: cacheKey });
    } catch (err) {
      console.error('Download/decrypt error:', err);
      toast.error('Failed to download or decrypt file', { id: cacheKey });
    }
  };

  // Open decrypted file in new tab
  const openDecryptedFile = (docId, attachmentId) => {
    const cacheKey = `${docId}_${attachmentId}`;
    const doc = downloadedDocs[cacheKey];
    if (!doc) return;
    
    const url = URL.createObjectURL(doc.blob);
    window.open(url, '_blank');
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // Save decrypted file to disk
  const saveDecryptedFile = (docId, attachmentId, filename) => {
    const cacheKey = `${docId}_${attachmentId}`;
    const doc = downloadedDocs[cacheKey];
    if (!doc) return;
    
    const url = URL.createObjectURL(doc.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const renderOtpStep = () => (
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
          background: 'rgba(79,158,255,0.15)',
          border: '1px solid rgba(79,158,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Key size={28} style={{ color: '#4f9eff' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Enter Verification Code
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
          We've sent a 6-digit code to {email}.<br/>
          <small>(Check console in FREE_MODE)</small>
        </p>
      </div>
      
      <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-2)',
              color: 'var(--text-1)',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: 8,
              fontFamily: 'monospace'
            }}
          />
        </div>
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading || otp.length !== 6}
          style={{
            padding: '16px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || otp.length !== 6 ? 0.7 : 1
          }}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
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
          Set up your secure unlock secret and encryption keys. You'll need this to decrypt the legacy when it's triggered.
          <br/><br/>
          <strong style={{ color: '#00e5a0' }}>🔐 Your unlock secret never leaves this device.</strong>
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
      style={{ width: '100%' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
          border: '1px solid rgba(0,229,160,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Shield size={28} style={{ color: '#00e5a0' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Legacy Access Portal
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Session active • {assets.length} assets • {capsules.length} capsules
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 20,
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: 12
      }}>
        {[
          { id: 'assets', label: 'Assets', icon: Lock, count: assets.length },
          { id: 'capsules', label: 'Capsules', icon: Clock, count: capsules.length },
          { id: 'documents', label: 'Documents', icon: FileText, count: documents.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.id ? 'rgba(0,229,160,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#00e5a0' : 'var(--text-2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ 
                background: activeTab === tab.id ? '#00e5a0' : 'var(--glass-2)',
                color: activeTab === tab.id ? '#001a12' : 'var(--text-2)',
                padding: '2px 6px',
                borderRadius: 10,
                fontSize: 10
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {activeTab === 'assets' && renderAssetsTab()}
        {activeTab === 'capsules' && renderCapsulesTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
      </div>
    </motion.div>
  );

  const renderAssetsTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
          <Lock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No assets available</p>
        </div>
      ) : (
        assets.map(asset => (
          <div
            key={asset._id}
            style={{
              background: 'var(--glass-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{asset.platform}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{asset.username}</p>
              </div>
              <span style={{
                fontSize: 10,
                padding: '4px 8px',
                borderRadius: 6,
                background: asset.instruction === 'share' ? 'rgba(0,229,160,0.15)' : 'rgba(255,77,109,0.15)',
                color: asset.instruction === 'share' ? '#00e5a0' : '#ff4d6d',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                {asset.instruction}
              </span>
            </div>
            
            {asset.password && (
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: 8, 
                padding: 12,
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {decryptedPasswords[asset._id] || '••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => {
                      if (decryptedPasswords[asset._id]) {
                        setDecryptedPasswords(prev => {
                          const next = { ...prev };
                          delete next[asset._id];
                          return next;
                        });
                      } else {
                        decryptAssetPassword(asset._id, asset.password);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00e5a0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12
                    }}
                  >
                    {decryptedPasswords[asset._id] ? <EyeOff size={14} /> : <Unlock size={14} />}
                    {decryptedPasswords[asset._id] ? 'Hide' : 'Decrypt'}
                  </button>
                </div>
              </div>
            )}
            
            {asset.notes && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>{asset.notes}</p>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderCapsulesTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {capsules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
          <Clock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No capsules available</p>
        </div>
      ) : (
        capsules.map(capsule => (
          <div
            key={capsule._id}
            style={{
              background: 'var(--glass-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: 16
            }}
          >
            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{capsule.title}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
              {capsule.content}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {capsule.attachments?.map((att, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    background: 'rgba(79,158,255,0.15)',
                    borderRadius: 6,
                    color: '#4f9eff'
                  }}
                >
                  {att.filename}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDocumentsTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
          <FileText size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No documents available</p>
        </div>
      ) : (
        documents.map(doc => (
          <div
            key={doc._id}
            style={{
              background: 'var(--glass-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: 16
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{doc.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'capitalize' }}>{doc.type}</p>
            </div>
            
            {doc.propertyAddress && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                <strong>Property:</strong> {doc.propertyAddress}
              </p>
            )}
            
            {doc.originalLocation && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                <strong>Original Location:</strong> {doc.originalLocation.type} — {doc.originalLocation.details}
              </p>
            )}
            
            {doc.instructionsForBeneficiary && (
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: 8, 
                padding: 10,
                marginBottom: 12,
                fontSize: 12,
                color: 'var(--text-2)'
              }}>
                <strong style={{ color: '#ffb830' }}>Instructions:</strong><br/>
                {doc.instructionsForBeneficiary}
              </div>
            )}
            
            {/* Attachments */}
            {doc.attachments && doc.attachments.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>
                  ATTACHMENTS ({doc.attachments.length})
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {doc.attachments.map(att => {
                    const cacheKey = `${doc._id}_${att._id}`;
                    const isDownloaded = downloadedDocs[cacheKey]?.decrypted;
                    
                    return (
                      <div 
                        key={att._id}
                        style={{
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: 8,
                          padding: 10,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500 }}>{att.originalName || att.filename}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                              {(att.size / 1024).toFixed(1)} KB
                            </span>
                            {att.encrypted ? (
                              <span style={{ fontSize: 10, color: '#00e5a0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Lock size={8} /> Encrypted
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: '#ffb830', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AlertCircle size={8} /> Unencrypted (legacy)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isDownloaded ? (
                          <button
                            onClick={() => downloadAndDecryptDoc(doc._id, att._id, att.encrypted)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(0,229,160,0.15)',
                              color: '#00e5a0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            <Download size={12} />
                            Download
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => openDecryptedFile(doc._id, att._id)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'rgba(79,158,255,0.15)',
                                color: '#4f9eff',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              Open
                            </button>
                            <button
                              onClick={() => saveDecryptedFile(doc._id, att._id, att.originalName || att.filename)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'rgba(0,229,160,0.15)',
                                color: '#00e5a0',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const stepperSteps = [
    { id: 'check', label: 'Verify', icon: <Mail size={18} /> },
    { id: 'otp', label: 'OTP Code', icon: <Key size={18} /> },
    { id: 'enroll', label: 'Enroll', icon: <UserCheck size={18} /> },
    { id: 'access', label: 'Access', icon: <FileKey size={18} /> }
  ];

  return (
    <div className="page spatial-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: step === 'access' ? 900 : 600,
          background: 'var(--glass-1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 28,
          padding: step === 'access' ? 32 : 40
        }}
      >
        {/* Stepper - hidden on access step */}
        {step !== 'access' && <Stepper currentStep={step} steps={stepperSteps} />}
        
        <AnimatePresence mode="wait">
          {step === 'check' && renderCheckStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'enroll' && renderEnrollStep()}
          {step === 'login' && renderLoginStep()}
          {step === 'access' && renderAccessStep()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BeneficiaryPortal;
