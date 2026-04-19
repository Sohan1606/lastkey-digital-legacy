import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Mail, User, CheckCircle, Download, X, Copy, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { deriveKey, decryptText } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EmergencyAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const [accessCode, setAccessCode] = useState(code || '');
  const [showPassword, setShowPassword] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [legacyData, setLegacyData] = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Recovery passphrase state
  const [recoveryPassphrase, setRecoveryPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState(null);
  const [decryptedAssets, setDecryptedAssets] = useState([]);
  
  // Session expiry
  const sessionExpiryRef = useRef(null);

  const handleAccessRequest = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!accessCode) {
      toast.error('Please enter the access code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE}/emergency/access`, { code: accessCode });

      if (response.data.success) {
        setLegacyData(response.data.data);
        setBeneficiary(response.data.data.beneficiary);
        setIsAuthenticated(true);
        
        // Initialize decrypted assets with locked state
        setDecryptedAssets(response.data.data.assets.map(asset => ({
          ...asset,
          decryptedPassword: null,
          isLocked: asset.clientEncrypted
        })));
        
        toast.success('Access granted!');
        
        // Start session expiry timer (30 minutes)
        sessionExpiryRef.current = setTimeout(() => {
          setIsAuthenticated(false);
          setLegacyData(null);
          setRecoveryKey(null);
          toast('Session expired for security', { style: { border: '1px solid #ffb830' } });
        }, 30 * 60 * 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid access code');
    } finally {
      setIsLoading(false);
    }
  }, [accessCode]);

  // Auto-submit when code from URL is valid
  useEffect(() => {
    if (code && code.length === 8) {
      const timer = setTimeout(() => {
        handleAccessRequest({ preventDefault: () => {} });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [code, handleAccessRequest]);
  
  // Cleanup session timer on unmount
  useEffect(() => {
    return () => {
      if (sessionExpiryRef.current) {
        clearTimeout(sessionExpiryRef.current);
      }
    };
  }, []);
  
  // Unlock vault with recovery passphrase
  const unlockVault = async () => {
    if (!recoveryPassphrase || !legacyData?.user?.email) {
      toast.error('Please enter the recovery passphrase');
      return;
    }
    
    try {
      const key = await deriveKey(recoveryPassphrase, legacyData.user.email);
      setRecoveryKey(key);
      
      // Decrypt all assets
      const decrypted = await Promise.all(
        legacyData.assets.map(async (asset) => {
          if (asset.clientEncrypted) {
            try {
              const decryptedPw = await decryptText(asset.password, key);
              return { ...asset, decryptedPassword: decryptedPw, isLocked: false };
            } catch (err) {
              return { ...asset, decryptedPassword: '(Decryption failed)', isLocked: true };
            }
          }
          return { ...asset, decryptedPassword: asset.password, isLocked: false };
        })
      );
      
      setDecryptedAssets(decrypted);
      toast.success('Vault unlocked successfully!');
    } catch (err) {
      toast.error('Failed to unlock vault. Please check your recovery passphrase.');
    }
  };

  const handleDownloadAsset = async (asset) => {
    try {
      const response = await axios.get(`${API_BASE}/emergency/download/${asset._id}?code=${accessCode}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${asset.platform}-credentials.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${asset.platform} credentials`);
    } catch {
      toast.error('Failed to download credentials');
    }
  };

  const handleSendMessage = async () => {
    if (!beneficiary?.email) return;
    try {
      await axios.post(`${API_BASE}/emergency/notify`, {
        beneficiaryId: beneficiary._id,
        message: 'Emergency access confirmed.'
      });
      toast.success('Notification sent');
    } catch {
      toast.error('Failed to send notification');
    }
  };

  if (isAuthenticated && legacyData) {
    return (
      <div className="page spatial-bg">
        <div className="stars" />
        <div className="container" style={{ maxWidth: 1000 }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle style={{ width: 28, height: 28, color: 'var(--pulse)' }} />
            </div>
            <h1 className="display" style={{ fontSize: 26, marginBottom: 8 }}>Emergency Access Granted</h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>You have access to <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{legacyData.user.name}</span>'s digital legacy.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User style={{ width: 18, height: 18, color: 'var(--ion)' }} /> Account Owner
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4 }}>{legacyData.user.name}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4 }}>{legacyData.user.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian Protocol</span>
                  <p style={{ fontSize: 14, color: legacyData.user.triggerStatus === 'triggered' ? 'var(--danger)' : 'var(--pulse)', marginTop: 4, fontWeight: 600 }}>
                    {legacyData.user.triggerStatus === 'triggered' ? '⚠️ Activated' : '✓ Active'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 18, height: 18, color: 'var(--plasma)' }} /> Your Access
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4 }}>{beneficiary.name}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4, textTransform: 'capitalize' }}>{beneficiary.relationship}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Granted</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4 }}>{new Date(beneficiary.accessGrantedAt).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Recovery Passphrase Unlock Section */}
          {!recoveryKey && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'rgba(255,184,48,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,184,48,0.25)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key style={{ width: 18, height: 18, color: '#ffb830' }} /> Unlock Vault
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                The account owner should have shared a recovery passphrase with you for emergency access.
                Enter it below to decrypt the vault passwords.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="password"
                  placeholder="Enter recovery passphrase..."
                  value={recoveryPassphrase}
                  onChange={e => setRecoveryPassphrase(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') unlockVault(); }}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={unlockVault}
                  disabled={!recoveryPassphrase}
                  style={{ 
                    padding: '12px 24px', 
                    borderRadius: 12, 
                    border: 'none', 
                    background: recoveryPassphrase ? 'linear-gradient(135deg, #ffb830, #ff4d6d)' : 'var(--glass-2)', 
                    color: '#001a12', 
                    fontWeight: 700, 
                    fontSize: 14, 
                    cursor: recoveryPassphrase ? 'pointer' : 'not-allowed',
                    opacity: recoveryPassphrase ? 1 : 0.6
                  }}
                >
                  Unlock Vault
                </motion.button>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock style={{ width: 18, height: 18, color: 'var(--amber)' }} /> Digital Assets ({decryptedAssets.length})
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {decryptedAssets.map((asset, index) => (
                <motion.div key={asset._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + index * 0.1 }}
                  style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 18 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{asset.platform}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>{asset.username}</p>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Password:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {asset.isLocked ? '(Locked - unlock vault to view)' : (showPassword[asset._id] ? (asset.decryptedPassword || asset.password) : '••••••••••')}
                        </span>
                        {!asset.isLocked && (
                          <button onClick={() => setShowPassword(prev => ({ ...prev, [asset._id]: !prev[asset._id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            {showPassword[asset._id] ? <EyeOff style={{ width: 14, height: 14, color: 'var(--text-2)' }} /> : <Eye style={{ width: 14, height: 14, color: 'var(--text-2)' }} />}
                          </button>
                        )}
                        {!asset.isLocked && showPassword[asset._id] && (
                          <button 
                            onClick={() => { 
                              const pw = asset.decryptedPassword || asset.password;
                              navigator.clipboard.writeText(pw); 
                              toast.success('Password copied!'); 
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          >
                            <Copy style={{ width: 13, height: 13, color: 'var(--text-2)' }} />
                          </button>
                        )}
                      </div>
                    </div>
                    {asset.instruction && (
                      <p style={{ fontSize: 11, color: 'var(--text-2)' }}><span style={{ fontWeight: 600 }}>Instruction:</span> {asset.instruction}</p>
                    )}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDownloadAsset(asset)}
                    style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--ion)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Download style={{ width: 13, height: 13 }} /> Download Credentials
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {legacyData.capsules && legacyData.capsules.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail style={{ width: 18, height: 18, color: 'var(--plasma)' }} /> Time Letters ({legacyData.capsules.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {legacyData.capsules.map((capsule, index) => (
                  <motion.div key={capsule._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + index * 0.1 }}
                    style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{capsule.title}</h3>
                      {capsule.recipient && <span style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--glass-1)', padding: '2px 8px', borderRadius: 6 }}>{capsule.recipient}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>{capsule.content}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Delivered: {new Date(capsule.releaseDate).toLocaleDateString()}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ display: 'flex', gap: 12 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSendMessage}
              style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Confirm Access Received
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
              style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', color: 'var(--text-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Exit Portal
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 28, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(79,158,255,0.3), rgba(124,92,252,0.3))', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield style={{ width: 28, height: 28, color: 'var(--plasma)' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Emergency Legacy Access</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Enter the access code provided to access the digital legacy</p>
          </div>

          <form onSubmit={handleAccessRequest} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label>Emergency Access Code</label>
              {code && (
                <div style={{ marginBottom: 12, background: 'rgba(79,158,255,0.06)', border: '1px solid rgba(79,158,255,0.2)', borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ion)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Code from link
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--text-1)' }}>
                      {code.toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(code.toUpperCase());
                          toast.success('Code copied');
                        } catch {
                          toast.error('Copy failed');
                        }
                      }}
                      style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 12, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
              )}
              <input type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())} placeholder="Enter the 8-character access code" required maxLength={8} style={{ fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.15em', textAlign: 'center' }} />
              {code && <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>Access code detected in URL</p>}
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                Your access code was sent via email by the account owner's LastKey account.
              </p>
            </div>

            <motion.button type="submit" disabled={isLoading || !accessCode} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: isLoading || !accessCode ? 'var(--glass-2)' : 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 700, fontSize: 15, cursor: isLoading || !accessCode ? 'not-allowed' : 'pointer', opacity: isLoading || !accessCode ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              {isLoading ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Verifying Access...</>
              ) : (
                <><Shield style={{ width: 18, height: 18 }} /> Access Digital Legacy</>
              )}
            </motion.button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Need Help?</h3>
            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p>• Contact the estate administrator for access code</p>
              <p>• Access codes are case-sensitive and 8 characters</p>
              <p>• This portal is for emergency use only</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyAccess;
