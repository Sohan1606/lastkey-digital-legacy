import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  ArrowRight,
  Key,
  Download,
  FileText,
  Unlock,
  UserCheck,
  FileKey,
  LogOut,
  Copy
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import {
  generateRSAKeypair,
  exportRSAPublicKey,
  exportRSAPrivateKey,
  importRSAPrivateKey,
  decryptDEKAsBeneficiary,
  decryptTextWithDEK,
  deriveKey,
  encryptText
} from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Small helpers
 */
const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (bytes) => btoa(String.fromCharCode(...bytes));

/**
 * Stepper (simple, keeps your existing style)
 */
const Stepper = ({ currentStep, steps }) => {
  const stepConfig = {
    check: 0,
    otp: 1,
    enroll: 2,
    login: 2,
    access: 3
  };

  const currentIndex = stepConfig[currentStep] ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        padding: '0 20px'
      }}
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isCompleted
                    ? '#00e5a0'
                    : isActive
                      ? 'rgba(0,229,160,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isCompleted ? '#00e5a0' : isActive ? '#00e5a0' : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted ? '#001a12' : isActive ? '#00e5a0' : 'rgba(255,255,255,0.5)',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {isCompleted ? <CheckCircle size={20} /> : step.icon}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: isActive ? '#00e5a0' : 'rgba(255,255,255,0.5)',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'center',
                  maxWidth: '90px'
                }}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                style={{
                  width: '40px',
                  height: '2px',
                  background: index < currentIndex ? '#00e5a0' : 'rgba(255,255,255,0.1)',
                  margin: '0 8px',
                  marginBottom: '20px'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BeneficiaryPortal = () => {
  const [step, setStep] = useState('check'); // check | otp | enroll | login | access

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
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);

  // Vault data state
  const [assets, setAssets] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [dek, setDek] = useState(null);

  const [activeTab, setActiveTab] = useState('assets');
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [downloadedDocs, setDownloadedDocs] = useState({}); // {cacheKey:{blob,mimeType,decrypted}}

  const headersWithSession = useMemo(() => {
    const h = {};
    if (authToken) h.Authorization = `Bearer ${authToken}`;
    if (sessionToken) h['X-Session-Token'] = sessionToken;
    return h;
  }, [authToken, sessionToken]);

  /**
   * Step 1: Check status
   */
  const checkStatus = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/beneficiary/auth/check-status`, { email });
      const data = res.data?.data;
      setStatus(data);

      if (!data || data.status === 'not_found') {
        toast.error('No beneficiary found with this email (or invite not created).');
        return;
      }

      if (data.status === 'invited') {
        toast.info('Invite found. Verify your email with OTP to enroll.');
        await startOtpLogin();
        return;
      }

      if (data.status === 'enrolled') {
        if (data.ownerTriggered) {
          toast.info('Legacy is available. Verify with OTP to continue.');
          await startOtpLogin();
        } else {
          toast.info('You are enrolled, but legacy is not yet available (owner is still active).');
        }
        return;
      }

      toast.info(`Status: ${data.status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error checking status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: OTP start
   */
  const startOtpLogin = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/beneficiary/auth/login/start`, { email });
      setStep('otp');
      toast.success('OTP sent! Check email (or console in FREE_MODE).');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: OTP verify
   */
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/beneficiary/auth/login/verify`, { email, otp });

      const token = res.data?.token;
      const payload = res.data?.data;

      if (!token) throw new Error('No token received');

      setAuthToken(token);

      const needsEnrollment = !!payload?.beneficiary?.needsEnrollment;
      const ownerTriggered = !!payload?.owner?.triggered;

      if (needsEnrollment) {
        setStep('enroll');
        toast.info('Complete enrollment to set up your unlock secret and encryption keys.');
        return;
      }

      if (ownerTriggered) {
        setStep('login');
        toast.success('Verified. Legacy is available.');
        return;
      }

      toast.success('Verified. Legacy is not available yet.');
      setStep('check');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enrollment: generate RSA keys + store encrypted private key blob + hash unlock secret server-side
   * NOTE: unlock secret is sent to server once so it can store a HASH (not plaintext).
   */
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
    if (!authToken) {
      toast.error('Please verify OTP again (missing beneficiary token).');
      return;
    }

    setLoading(true);
    try {
      // 1) Generate RSA keypair
      const keypair = await generateRSAKeypair();
      const publicKeyJwk = await exportRSAPublicKey(keypair.publicKey);
      const privateKeyJwk = await exportRSAPrivateKey(keypair.privateKey);

      // 2) Encrypt private key JSON with unlockSecret-derived KEK
      const kek = await deriveKey(unlockSecret, email);
      const privateKeyJson = JSON.stringify(privateKeyJwk);

      // encryptText() is assumed to return base64 of [iv|ciphertext] bytes.
      const ciphertextB64 = await encryptText(privateKeyJson, kek);

      const encryptedPrivateKeyBlob = {
        alg: 'AES-GCM',
        version: '1',
        // Keep compatibility with old code: accept either ciphertextB64 or ciphertext
        ciphertextB64,
        kdf: { name: 'PBKDF2', salt: email, iterations: 100000, hash: 'SHA-256' }
      };

      await axios.post(
        `${API_BASE}/beneficiary/auth/enroll`,
        {
          unlockSecret,
          publicKeyJwk, // IMPORTANT: send as object (not JSON string)
          encryptedPrivateKeyBlob
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      toast.success('Enrollment complete. You can access the legacy when it’s triggered.');
      setStep('check');

      // reset sensitive fields
      setUnlockSecret('');
      setConfirmSecret('');
      setOtp('');
      setShowSecret(false);
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login step: request access + create session
   */
  const loginAndRequestAccess = async (e) => {
    e.preventDefault();

    if (!authToken) {
      toast.error('Missing beneficiary token. Please OTP login again.');
      return;
    }

    setLoading(true);
    try {
      const accessRes = await axios.post(
        `${API_BASE}/beneficiary/auth/request-access`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (accessRes.data?.data?.status !== 'granted') {
        toast.info('Access request pending.');
        return;
      }

      const gId = accessRes.data.data.grantId;
      setGrantId(gId);

      const sessionRes = await axios.post(
        `${API_BASE}/beneficiary/auth/create-session`,
        { unlockSecret, grantId: gId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const token = sessionRes.data?.data?.sessionToken;
      const expiresAt = sessionRes.data?.data?.expiresAt;

      if (!token) throw new Error('No session token received');

      setSessionToken(token);
      setSessionExpiresAt(expiresAt || null);

      await loadVaultData(unlockSecret, token);

      setStep('access');
      toast.success('Access granted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Decrypt encryptedPrivateKeyBlob
   * Supports both:
   *  - blob.ciphertextB64
   *  - blob.ciphertext (legacy)
   */
  const decryptPrivateKeyBlob = async (blob, kek) => {
    const ciphertextB64 = blob?.ciphertextB64 || blob?.ciphertext;
    if (!ciphertextB64) throw new Error('Missing ciphertext in encryptedPrivateKeyBlob');

    const combined = b64ToBytes(ciphertextB64);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, ciphertext);
    return new TextDecoder().decode(decrypted);
  };

  /**
   * Load vault share -> decrypt DEK -> load assets/capsules/docs
   */
  const loadVaultData = async (secret, sessToken) => {
    const headers = {
      Authorization: `Bearer ${authToken}`,
      'X-Session-Token': sessToken
    };

    try {
      // 1) Fetch vault share
      const shareRes = await axios.get(`${API_BASE}/beneficiary/portal/vault-share`, { headers });
      const { encryptedDekB64, encryptedPrivateKeyBlob } = shareRes.data?.data || {};

      if (!encryptedDekB64 || !encryptedPrivateKeyBlob) {
        throw new Error('Missing vault share or private key blob');
      }

      // 2) Decrypt private key locally
      const kek = await deriveKey(secret, email);
      const privateKeyJson = await decryptPrivateKeyBlob(encryptedPrivateKeyBlob, kek);
      const privateKey = await importRSAPrivateKey(JSON.parse(privateKeyJson));

      // 3) Decrypt DEK locally
      const dekKey = await decryptDEKAsBeneficiary(encryptedDekB64, privateKey);
      setDek(dekKey);

      // 4) Fetch data in parallel
      const [assetsRes, capsulesRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE}/beneficiary/portal/assets`, { headers }),
        axios.get(`${API_BASE}/beneficiary/portal/capsules`, { headers }),
        axios.get(`${API_BASE}/beneficiary/portal/legal-documents`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      setAssets(assetsRes.data?.data || []);
      setCapsules(capsulesRes.data?.data || []);
      setDocuments(docsRes.data?.data || []);
    } catch (err) {
      console.error('Vault loading error:', err);
      toast.error('Failed to load vault data.');
      throw err;
    }
  };

  /**
   * Decrypt asset password locally (auto-hide after 30s)
   */
  const decryptAssetPassword = async (assetId, encryptedPassword) => {
    if (!dek) return toast.error('Vault key not available');

    try {
      const decrypted = await decryptTextWithDEK(encryptedPassword, dek);
      setDecryptedPasswords((prev) => ({ ...prev, [assetId]: decrypted }));

      setTimeout(() => {
        setDecryptedPasswords((prev) => {
          const next = { ...prev };
          delete next[assetId];
          return next;
        });
      }, 30000);
    } catch (err) {
      toast.error('Failed to decrypt password');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  /**
   * Download attachment bytes and decrypt locally (if encrypted)
   * Robust to both formats:
   *  - [IV|ciphertext] prefix
   *  - ciphertext only + ivB64 in metadata
   */
  const downloadAndDecryptDoc = async (docId, attachment, docMimeType) => {
    if (!dek) return toast.error('Vault key not available');

    const attachmentId = attachment._id;
    const cacheKey = `${docId}_${attachmentId}`;

    try {
      toast.loading('Downloading...', { id: cacheKey });

      const response = await axios.get(
        `${API_BASE}/beneficiary/portal/legal-documents/${docId}/attachments/${attachmentId}/file`,
        { headers: headersWithSession, responseType: 'arraybuffer' }
      );

      const ciphertextBytes = new Uint8Array(response.data);

      // Choose mime type for decrypted blob:
      // Prefer attachment.mimeType (from DB). Fall back to docMimeType param.
      const mimeType = attachment.mimeType || docMimeType || 'application/pdf';

      if (!attachment.encrypted) {
        const blob = new Blob([ciphertextBytes], { type: mimeType });
        setDownloadedDocs((prev) => ({ ...prev, [cacheKey]: { blob, mimeType, decrypted: true } }));
        toast.success('Downloaded (unencrypted legacy file)', { id: cacheKey });
        return;
      }

      let iv;
      let ciphertext;

      if (attachment.ivB64) {
        iv = b64ToBytes(attachment.ivB64);
        ciphertext = ciphertextBytes; // ciphertext only
      } else {
        iv = ciphertextBytes.slice(0, 12);
        ciphertext = ciphertextBytes.slice(12);
      }

      const decryptedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, dek, ciphertext);

      const blob = new Blob([decryptedBuffer], { type: mimeType });
      setDownloadedDocs((prev) => ({ ...prev, [cacheKey]: { blob, mimeType, decrypted: true } }));
      toast.success('Downloaded and decrypted!', { id: cacheKey });
    } catch (err) {
      console.error('Download/decrypt error:', err);
      toast.error('Failed to download or decrypt file', { id: cacheKey });
    }
  };

  const openDecryptedFile = (docId, attachmentId) => {
    const cacheKey = `${docId}_${attachmentId}`;
    const file = downloadedDocs[cacheKey];
    if (!file) return;

    const url = URL.createObjectURL(file.blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const saveDecryptedFile = (docId, attachmentId, filename) => {
    const cacheKey = `${docId}_${attachmentId}`;
    const file = downloadedDocs[cacheKey];
    if (!file) return;

    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const endSession = async () => {
    if (!sessionToken) {
      setStep('check');
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/beneficiary/auth/logout`,
        {},
        { headers: { 'X-Session-Token': sessionToken } }
      );
    } catch {
      // ignore
    } finally {
      // clear all sensitive state
      setSessionToken(null);
      setSessionExpiresAt(null);
      setDek(null);
      setAssets([]);
      setCapsules([]);
      setDocuments([]);
      setDecryptedPasswords({});
      setDownloadedDocs({});
      setUnlockSecret('');
      setConfirmSecret('');
      setOtp('');
      setGrantId(null);
      setStep('check');
      toast.success('Session ended.');
    }
  };

  /**
   * UI Renderers
   */
  const renderCheckStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
          border: '1px solid rgba(0,229,160,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}
      >
        <Shield size={36} style={{ color: '#00e5a0' }} />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Beneficiary Portal</h1>
      <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
        Enter your email to verify your beneficiary status and access legacy content when it becomes available.
      </p>

      <form onSubmit={checkStatus} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#030508',
              color: '#ffffff',
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
            fontWeight: 800,
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

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
          In FREE_MODE, OTP codes are printed to the server console.
        </p>
      </form>
    </motion.div>
  );

  const renderOtpStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(79,158,255,0.15)',
            border: '1px solid rgba(79,158,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <Key size={28} style={{ color: '#4f9eff' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Enter Verification Code</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          We sent a 6-digit code to <strong>{email}</strong>.
          <br />
          <span style={{ color: '#94a3b8' }}>(Check console in FREE_MODE)</span>
        </p>
      </div>

      <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#030508',
            color: '#ffffff',
            fontSize: 24,
            textAlign: 'center',
            letterSpacing: 8,
            fontFamily: 'monospace'
          }}
        />

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
            fontWeight: 800,
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
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 8 }}
        >
          ← Back
        </button>
      </form>
    </motion.div>
  );

  const renderEnrollStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(255,184,48,0.15)',
            border: '1px solid rgba(255,184,48,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <Lock size={28} style={{ color: '#ffb830' }} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Complete Your Enrollment</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Set an unlock secret and encryption keys. You’ll use this to decrypt legacy data when it’s triggered.
          <br />
          <br />
          <strong style={{ color: '#00e5a0' }}>
            We store only a hashed unlock secret on the server — never the plaintext.
          </strong>
        </p>
      </div>

      <form onSubmit={completeEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#64748b' }}>
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
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#030508',
                color: '#ffffff',
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
                color: '#94a3b8'
              }}
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            You’ll need this later to unlock decryption keys in the Beneficiary Portal.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#64748b' }}>
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#030508',
              color: '#ffffff',
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
            fontWeight: 900,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginTop: 6
          }}
        >
          {loading ? 'Setting up...' : 'Complete Enrollment'}
        </motion.button>

        <button
          type="button"
          onClick={() => setStep('check')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 8 }}
        >
          ← Back
        </button>
      </form>
    </motion.div>
  );

  const renderLoginStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(0,229,160,0.15)',
            border: '1px solid rgba(0,229,160,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <CheckCircle size={28} style={{ color: '#00e5a0' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Legacy Available</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Guardian Protocol has been triggered. Enter your unlock secret to request access and unlock the vault.
        </p>
      </div>

      <form onSubmit={loginAndRequestAccess} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#64748b' }}>
          Unlock Secret
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#030508',
              color: '#ffffff',
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
              color: '#94a3b8'
            }}
          >
            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
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
            fontWeight: 900,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Accessing...' : 'Request & Unlock Legacy'}
        </motion.button>

        <button
          type="button"
          onClick={() => setStep('check')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 8 }}
        >
          ← Back
        </button>
      </form>
    </motion.div>
  );

  const renderAssetsTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <Lock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No assets available</p>
        </div>
      ) : (
        assets.map((asset) => (
          <div key={asset._id} style={{ background: '#030508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{asset.platform}</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{asset.username}</p>
              </div>
              {asset.instruction && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: asset.instruction === 'share' ? 'rgba(0,229,160,0.15)' : 'rgba(255,77,109,0.15)',
                    color: asset.instruction === 'share' ? '#00e5a0' : '#ff4d6d',
                    textTransform: 'uppercase',
                    fontWeight: 800
                  }}
                >
                  {asset.instruction}
                </span>
              )}
            </div>

            {asset.password && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {decryptedPasswords[asset._id] || '••••••••••••••••'}
                  </span>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {decryptedPasswords[asset._id] && (
                      <button
                        onClick={() => copyToClipboard(decryptedPasswords[asset._id])}
                        style={{ background: 'none', border: 'none', color: '#4f9eff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        title="Copy"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (decryptedPasswords[asset._id]) {
                          setDecryptedPasswords((prev) => {
                            const next = { ...prev };
                            delete next[asset._id];
                            return next;
                          });
                        } else {
                          decryptAssetPassword(asset._id, asset.password);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#00e5a0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    >
                      {decryptedPasswords[asset._id] ? <EyeOff size={14} /> : <Unlock size={14} />}
                      {decryptedPasswords[asset._id] ? 'Hide' : 'Decrypt'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {asset.notes && <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{asset.notes}</p>}
          </div>
        ))
      )}
    </div>
  );

  const renderCapsulesTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {capsules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <Clock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No capsules available</p>
        </div>
      ) : (
        capsules.map((capsule) => (
          <div key={capsule._id} style={{ background: '#030508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{capsule.title}</h4>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.55 }}>
              {capsule.content}
            </p>
          </div>
        ))
      )}
    </div>
  );

  const renderDocumentsTab = () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          background: 'rgba(255,184,48,0.08)',
          border: '1px solid rgba(255,184,48,0.25)',
          borderRadius: 12,
          padding: 12,
          color: '#64748b',
          fontSize: 12,
          lineHeight: 1.5,
          marginBottom: 6
        }}
      >
        <strong style={{ color: '#ffb830' }}>Note:</strong> Scans are reference copies. Legal proof may require certified copies/official records depending on jurisdiction.
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <FileText size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No documents available</p>
        </div>
      ) : (
        documents.map((doc) => (
          <div key={doc._id} style={{ background: '#030508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <h4 style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>{doc.title}</h4>
              <p style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{doc.type}</p>
            </div>

            {doc.propertyAddress && (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                <strong>Property:</strong> {doc.propertyAddress}
              </p>
            )}

            {doc.originalLocation?.type && (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                <strong>Original Location:</strong> {doc.originalLocation.type} — {doc.originalLocation.details}
              </p>
            )}

            {doc.instructionsForBeneficiary && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: '#64748b' }}>
                <strong style={{ color: '#ffb830' }}>Instructions:</strong>
                <br />
                {doc.instructionsForBeneficiary}
              </div>
            )}

            {doc.attachments?.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 800 }}>
                  ATTACHMENTS ({doc.attachments.length})
                </p>

                <div style={{ display: 'grid', gap: 8 }}>
                  {doc.attachments.map((att) => {
                    const cacheKey = `${doc._id}_${att._id}`;
                    const isDownloaded = downloadedDocs[cacheKey]?.decrypted;

                    const friendlySize = att.size ? `${(att.size / 1024).toFixed(1)} KB` : '';

                    return (
                      <div
                        key={att._id}
                        style={{
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: 8,
                          padding: 10,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.originalName || att.filename}
                          </p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>{friendlySize}</span>
                            {att.encrypted ? (
                              <span style={{ fontSize: 10, color: '#00e5a0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Lock size={10} /> Encrypted
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: '#ffb830', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={10} /> Unencrypted (legacy)
                              </span>
                            )}
                          </div>
                        </div>

                        {!isDownloaded ? (
                          <button
                            onClick={() => downloadAndDecryptDoc(doc._id, att, att.mimeType)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'rgba(0,229,160,0.15)',
                              color: '#00e5a0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11,
                              fontWeight: 900,
                              flexShrink: 0
                            }}
                          >
                            <Download size={12} />
                            Download
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
                                fontWeight: 900
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
                                fontWeight: 900
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

  const renderAccessStep = () => (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 950, marginBottom: 6 }}>Legacy Access Portal</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Session active{sessionExpiresAt ? ` • Expires: ${new Date(sessionExpiresAt).toLocaleString()}` : ''} • {assets.length} assets • {capsules.length} capsules • {documents.length} docs
          </p>
        </div>

        <button
          onClick={endSession}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 900,
            fontSize: 12
          }}
          title="End session"
        >
          <LogOut size={16} />
          End Session
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
        {[
          { id: 'assets', label: 'Assets', icon: Lock, count: assets.length },
          { id: 'capsules', label: 'Capsules', icon: Clock, count: capsules.length },
          { id: 'documents', label: 'Documents', icon: FileText, count: documents.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.id ? 'rgba(0,229,160,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#00e5a0' : '#64748b',
              fontSize: 13,
              fontWeight: 900,
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
              <span
                style={{
                  background: activeTab === tab.id ? '#00e5a0' : '#030508',
                  color: activeTab === tab.id ? '#001a12' : '#64748b',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 900
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {activeTab === 'assets' && renderAssetsTab()}
        {activeTab === 'capsules' && renderCapsulesTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
      </div>
    </motion.div>
  );

  const stepperSteps = [
    { id: 'check', label: 'Verify Email', icon: <Mail size={18} /> },
    { id: 'otp', label: 'OTP Code', icon: <Key size={18} /> },
    { id: 'enroll', label: 'Enroll', icon: <UserCheck size={18} /> },
    { id: 'access', label: 'Access', icon: <FileKey size={18} /> }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      background: '#030508',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background stars effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(79, 158, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124, 92, 252, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: step === 'access' ? 980 : 640,
          background: '#050d1a',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: step === 'access' ? '32px' : '40px',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
        }}
      >
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