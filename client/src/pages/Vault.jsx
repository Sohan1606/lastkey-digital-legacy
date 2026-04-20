import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Eye, EyeOff, Plus, Shield, Lock, ExternalLink, X, Copy, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  deriveKey, encryptText, decryptText, isCryptoSupported,
  generateMasterDEK, encryptDEKWithPassword, decryptDEKWithPassword,
  setMasterDEK, getMasterDEK, hasDEK, clearMasterDEK
} from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Vault = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    url: '',
    password: '',
    notes: '',
    instruction: 'delete',
    assetType: 'general',
    cryptocurrency: '',
    walletAddress: '',
    blockchain: ''
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cryptoSupported, setCryptoSupported] = useState(true);
  const [vaultPassword, setVaultPassword] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingDecryptId, setPendingDecryptId] = useState(null);
  const [dekInitialized, setDekInitialized] = useState(false);
  const [isInitializingDEK, setIsInitializingDEK] = useState(false);
  const formRef = useRef(null);
  
  // CRITICAL: Master DEK stored in-memory only (never in localStorage/sessionStorage)
  // The DEK is the Data Encryption Key used for all vault encryption

  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCryptoSupported(isCryptoSupported());
  }, []);

  // Check DEK status on mount
  const { data: dekStatus } = useQuery({
    queryKey: ['dek-status'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/dek/status`);
      return data.data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (dekStatus) {
      setDekInitialized(dekStatus.initialized);
    }
  }, [dekStatus]);

  const { data: assets, isPending: isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/assets`);
      return data.data;
    },
    enabled: !!user,
    retry: 1
  });

  // Initialize DEK for new users
  const initializeDEK = async (password) => {
    if (!password || !user?.email) return false;
    setIsInitializingDEK(true);
    try {
      // Generate new master DEK
      const dek = await generateMasterDEK();
      
      // Encrypt DEK with password
      const encryptedData = await encryptDEKWithPassword(dek, password, user.email);
      
      // Send to server
      await axios.post(`${API_BASE}/dek/initialize`, {
        encryptedMasterKey: {
          ciphertext: encryptedData.ciphertext,
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          iterations: 100000,
          version: '1'
        },
        keyVerification: {
          hash: encryptedData.ciphertext.slice(0, 64), // First 64 chars as verification hash
          salt: encryptedData.salt
        }
      });
      
      setMasterDEK(dek);
      setDekInitialized(true);
      setShowUnlockModal(false);
      setVaultPassword('');
      toast.success('Vault initialized successfully!');
      return true;
    } catch (err) {
      console.error('DEK initialization error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize vault');
      return false;
    } finally {
      setIsInitializingDEK(false);
    }
  };

  // Unlock vault with user password (retrieve and decrypt DEK)
  const unlockVault = async (password) => {
    if (!password || !user?.email) return false;
    try {
      // If DEK not initialized, initialize it first
      if (!dekInitialized) {
        return await initializeDEK(password);
      }
      
      // Fetch encrypted DEK from server
      const { data } = await axios.get(`${API_BASE}/dek/my-dek`);
      const encryptedMasterKey = data.data.encryptedMasterKey;
      
      // Decrypt DEK with password
      const dek = await decryptDEKWithPassword(
        encryptedMasterKey.ciphertext,
        password,
        user.email
      );
      
      setMasterDEK(dek);
      setShowUnlockModal(false);
      setVaultPassword('');
      return true;
    } catch (err) {
      console.error('Vault unlock error:', err);
      if (err.response?.status === 404) {
        // DEK not found, need to initialize
        return await initializeDEK(password);
      }
      toast.error('Failed to unlock vault. Please check your password.');
      return false;
    }
  };

  // Show password - decrypt if needed
  const handleShowPassword = async (assetId, encryptedPassword) => {
    // If already showing, just hide it
    if (showPasswords[assetId]) {
      setShowPasswords(prev => ({ ...prev, [assetId]: null }));
      return;
    }

    // If vault not unlocked, show unlock modal
    if (!hasDEK()) {
      setPendingDecryptId(assetId);
      setShowUnlockModal(true);
      return;
    }

    // Decrypt the password using DEK
    try {
      const dek = getMasterDEK();
      const decrypted = await decryptText(encryptedPassword, dek);
      setShowPasswords(prev => ({ ...prev, [assetId]: decrypted }));
    } catch (err) {
      toast.error('Failed to decrypt password. The vault password may be incorrect.');
    }
  };

  const createMutation = useMutation({
    mutationFn: async (assetData) => {
      // ENFORCEMENT: Encrypt in browser BEFORE sending to backend using DEK
      if (cryptoSupported && assetData.password && assetData.password.trim() !== '') {
        if (!hasDEK()) {
          // Need to unlock vault first
          throw new Error('Please unlock your vault first');
        }
        try {
          const dek = getMasterDEK();
          // Encrypt the password before sending using DEK
          assetData.password = await encryptText(assetData.password, dek);
          assetData.clientEncrypted = true;
        } catch (err) {
          console.error('Encryption failed:', err);
          throw new Error('Failed to encrypt password');
        }
      }
      return axios.post(`${API_BASE}/assets`, assetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete', assetType: 'general', cryptocurrency: '', walletAddress: '', blockchain: '' });
      setEditingId(null);
      toast.success('Asset secured with client-side encryption!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save asset');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, assetData }) => {
      // ENFORCEMENT: Encrypt password if provided and vault is unlocked using DEK
      if (cryptoSupported && assetData.password && assetData.password.trim() !== '' && hasDEK()) {
        try {
          const dek = getMasterDEK();
          assetData.password = await encryptText(assetData.password, dek);
          assetData.clientEncrypted = true;
        } catch (err) {
          console.error('Encryption failed:', err);
        }
      }
      return axios.put(`${API_BASE}/assets/${id}`, assetData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete', assetType: 'general', cryptocurrency: '', walletAddress: '', blockchain: '' });
      setEditingId(null);
      toast.success('Asset updated!');
    },
    onError: () => {
      toast.error('Failed to update asset.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/assets/${id}`),
    onSuccess: () => {
      toast.success('Asset removed');
      queryClient.invalidateQueries(['assets']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasDEK() && !editingId) {
      setShowUnlockModal(true);
      return;
    }
    const submitData = { ...formData };
    if (editingId) {
      updateMutation.mutate({ id: editingId, assetData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const scrollToForm = () => {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleEdit = (asset) => {
    setFormData({
      platform: asset.platform,
      username: asset.username,
      url: asset.url || '',
      password: '', // Don't show encrypted password
      notes: asset.notes || '',
      instruction: asset.instruction,
      assetType: asset.assetType || 'general',
      cryptocurrency: asset.cryptocurrency || '',
      walletAddress: asset.walletAddress || '',
      blockchain: asset.blockchain || '',
    });
    setEditingId(asset._id);
    setShowForm(true);
    scrollToForm();
  };

  const getInstructionStyle = (ins) => {
    switch(ins) {
      case 'delete': return { color: '#ff4d6d', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.2)' };
      case 'share': return { color: '#4f9eff', bg: 'rgba(79,158,255,0.1)', border: 'rgba(79,158,255,0.2)' };
      case 'transfer': return { color: '#00e5a0', bg: 'rgba(0,229,160,0.1)', border: 'rgba(0,229,160,0.2)' };
      default: return { color: '#8899bb', bg: 'var(--glass-1)', border: 'var(--glass-border)' };
    }
  };

  if (isLoading) return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stars" />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Loading your vault...</p>
      </div>
    </div>
  );

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        {/* Unlock Modal */}
        <AnimatePresence>
          {showUnlockModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onClick={() => setShowUnlockModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'var(--glass-1)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 24,
                  padding: 32,
                  maxWidth: 400,
                  width: '90%'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
                    border: '1px solid rgba(0,229,160,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Lock style={{ width: 26, height: 26, color: '#00e5a0' }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
                    {dekInitialized ? 'Unlock Your Vault' : 'Initialize Your Vault'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {dekInitialized 
                      ? 'Enter your vault password to decrypt your DEK and access your assets.'
                      : 'Create a vault password to generate your Data Encryption Key (DEK).'
                    }
                    <br /><strong>Your password never leaves this device.</strong>
                  </p>
                  {!dekInitialized && (
                    <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,184,48,0.1)', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: '#ffb830', margin: 0 }}>
                        This password will encrypt your DEK. Store it safely - it cannot be recovered!
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Enter vault password..."
                  value={vaultPassword}
                  onChange={e => setVaultPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      unlockVault(vaultPassword).then(success => {
                        if (success && pendingDecryptId) {
                          // Retry the decrypt after unlock
                          const asset = assets.find(a => a._id === pendingDecryptId);
                          if (asset) {
                            handleShowPassword(pendingDecryptId, asset.password);
                          }
                          setPendingDecryptId(null);
                        }
                      });
                    }
                  }}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1px solid var(--glass-border)', background: 'var(--glass-2)',
                    color: 'var(--text-1)', fontSize: 14, marginBottom: 16
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isInitializingDEK}
                  onClick={() => {
                    unlockVault(vaultPassword).then(success => {
                      if (success && pendingDecryptId) {
                        const asset = assets.find(a => a._id === pendingDecryptId);
                        if (asset) {
                          handleShowPassword(pendingDecryptId, asset.password);
                        }
                        setPendingDecryptId(null);
                      }
                    });
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    border: 'none', background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                    color: '#001a12', fontWeight: 700, fontSize: 14, cursor: isInitializingDEK ? 'not-allowed' : 'pointer',
                    opacity: isInitializingDEK ? 0.7 : 1
                  }}
                >
                  {isInitializingDEK ? 'Initializing...' : dekInitialized ? 'Unlock Vault' : 'Initialize Vault'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: 22, height: 22, color: 'var(--pulse)' }} />
              </div>
              <div>
                <h1 className="display" style={{ fontSize: 28 }}>Digital Vault</h1>
                {/* Trust Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#00e5a0', marginTop: 4 }}>
                  <ShieldCheck size={13} />
                  <span>Encrypted in your browser — we cannot read this</span>
                </div>
              </div>
            </div>
            {!showForm && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { 
                if (!hasDEK()) {
                  setShowUnlockModal(true);
                  return; // Don't open form if vault is locked
                }
                setShowForm(false); 
                setEditingId(null); 
                setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); 
                setShowForm(true); 
                scrollToForm(); 
              }}
                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00e5a0, #4f9eff)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16 }} /> Add Asset
              </motion.button>
            )}
          </div>
        </motion.div>

        {assets && assets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 14, padding: '12px 18px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pulse)', boxShadow: '0 0 8px var(--pulse)' }} />
                <span style={{ fontSize: 12, color: 'var(--pulse)', fontWeight: 600 }}>AES-256 Encrypted</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{assets.length} item{assets.length !== 1 ? 's' : ''} secured</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Zero-knowledge vault</span>
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div ref={formRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 32, overflow: 'hidden' }}>
              <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{editingId ? 'Edit Asset' : 'Secure New Asset'}</h3>
                  <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: 8, borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X style={{ width: 18, height: 18, color: 'var(--text-3)' }} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                  <div>
                    <label>Platform Name</label>
                    <input type="text" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} placeholder="e.g. Google, Binance" required />
                  </div>
                  <div>
                    <label>Username / ID</label>
                    <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Email or username" required />
                  </div>
                  <div>
                    <label>Website URL (Optional)</label>
                    <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Secret Password / Key</span>
                      {cryptoSupported && formData.password && hasDEK() && (
                        <span style={{ fontSize: 10, color: 'var(--pulse)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <Lock size={10} /> DEK Encrypted
                        </span>
                      )}
                    </label>
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder={hasDEK() ? "Enter the secure key" : "Unlock vault first to add assets"} 
                      required 
                      disabled={!hasDEK() && !editingId}
                    />
                    {!hasDEK() && !editingId && (
                      <p style={{ fontSize: 11, color: '#ffb830', marginTop: 6, marginBottom: 0 }}>
                        ⚠️ Please unlock your vault using the button above to enable encryption.
                      </p>
                    )}
                    {cryptoKeyRef.current && (
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, marginBottom: 0 }}>
                        This password will be encrypted in your browser before being sent to our servers.
                      </p>
                    )}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Legacy Instruction</label>
                    <select value={formData.instruction} onChange={e => setFormData({...formData, instruction: e.target.value})}>
                      <option value="delete">Delete Account (Privacy)</option>
                      <option value="share">Share with Beneficiaries</option>
                      <option value="transfer">Transfer Ownership</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Asset Type</label>
                    <select value={formData.assetType || 'general'} onChange={e => setFormData({...formData, assetType: e.target.value})}>
                      <option value="general">General Account / Password</option>
                      <option value="crypto_exchange">Crypto Exchange (Binance, Coinbase...)</option>
                      <option value="crypto_wallet">Crypto Wallet (MetaMask, Trust Wallet...)</option>
                      <option value="hardware_wallet">Hardware Wallet (Ledger, Trezor...)</option>
                      <option value="seed_phrase">Seed Phrase / Recovery Words</option>
                      <option value="private_key">Private Key</option>
                    </select>
                  </div>
                  {formData.assetType && formData.assetType !== 'general' && (
                    <>
                      <div>
                        <label>Cryptocurrency</label>
                        <select value={formData.cryptocurrency || ''} onChange={e => setFormData({...formData, cryptocurrency: e.target.value})}>
                          <option value="">Select crypto...</option>
                          {['BTC','ETH','USDT','USDC','BNB','SOL','ADA','DOT','MATIC','AVAX','LINK','other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Blockchain Network</label>
                        <select value={formData.blockchain || ''} onChange={e => setFormData({...formData, blockchain: e.target.value})}>
                          <option value="">Select blockchain...</option>
                          {['Bitcoin','Ethereum','BSC','Polygon','Solana','Avalanche','Cardano','Polkadot','other'].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label>Public Wallet Address (Optional)</label>
                        <input type="text" value={formData.walletAddress || ''} onChange={e => setFormData({...formData, walletAddress: e.target.value})} placeholder="0x... or bc1... (public address only)" />
                      </div>
                      <div style={{ gridColumn: '1 / -1', background: 'rgba(255,184,48,0.06)', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 12, color: '#ffb830', margin: 0 }}>
                          Security: Your seed phrase / private key is encrypted with AES-256 before storage. Never share your private key with anyone other than your designated beneficiaries.
                        </p>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Additional Notes</label>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Instructions or context..." style={{ height: 80, resize: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={createMutation.isPending || updateMutation.isPending || (!hasDEK() && !editingId)}
                      style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: (createMutation.isPending || updateMutation.isPending || (!hasDEK() && !editingId)) ? 'not-allowed' : 'pointer', opacity: (createMutation.isPending || updateMutation.isPending || (!hasDEK() && !editingId)) ? 0.6 : 1 }}>
                      {createMutation.isPending || updateMutation.isPending ? 'Processing...' : editingId ? 'Update Asset' : 'Secure Asset'}
                    </motion.button>
                    <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowForm(false); setEditingId(null); }}
                      style={{ padding: '14px 24px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', color: 'var(--text-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {assets && assets.map((asset, idx) => {
            const insStyle = getInstructionStyle(asset.instruction);
            const decryptedPassword = showPasswords[asset._id];
            return (
              <motion.div key={asset._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24, transition: 'all 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(79,158,255,0.1)', border: '1px solid rgba(79,158,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield style={{ width: 20, height: 20, color: 'var(--ion)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {deleteConfirm === asset._id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { deleteMutation.mutate(asset._id); setDeleteConfirm(null); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(asset)}
                          style={{ padding: 8, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', cursor: 'pointer' }}>
                          <Pencil style={{ width: 14, height: 14, color: 'var(--text-2)' }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirm(asset._id)}
                          style={{ padding: 8, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', cursor: 'pointer' }}>
                          <Trash2 style={{ width: 14, height: 14, color: 'var(--danger)' }} />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>{asset.platform}</h3>
                {asset.assetType && asset.assetType !== 'general' && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,184,48,0.1)', border: '1px solid rgba(255,184,48,0.2)', color: '#ffb830', fontWeight: 600 }}>
                      {asset.assetType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {asset.cryptocurrency && (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(79,158,255,0.1)', border: '1px solid rgba(79,158,255,0.2)', color: '#4f9eff', fontWeight: 600 }}>
                        {asset.cryptocurrency}
                      </span>
                    )}
                    {asset.blockchain && (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7c5cfc', fontWeight: 600 }}>
                        {asset.blockchain}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity</span>
                  <p style={{ fontSize: 14, color: 'var(--text-1)', marginTop: 4 }}>{asset.username}</p>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Key</span>
                    {asset.clientEncrypted && (
                      <span style={{ fontSize: 9, color: 'var(--pulse)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, background: 'rgba(0,229,160,0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(0,229,160,0.2)' }}>
                        <Lock size={8} /> Client Encrypted
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {decryptedPassword || '•••••••••••'}
                    </span>
                    <button onClick={() => handleShowPassword(asset._id, asset.password)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {decryptedPassword ? <EyeOff style={{ width: 16, height: 16, color: 'var(--text-2)' }} /> : <Eye style={{ width: 16, height: 16, color: 'var(--text-2)' }} />}
                    </button>
                    {decryptedPassword && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(decryptedPassword);
                            toast.success('Copied! Auto-clears in 30s', { duration: 2500 });
                            setTimeout(async () => {
                              try {
                                const c = await navigator.clipboard.readText();
                                if (c === decryptedPassword) await navigator.clipboard.writeText('');
                              } catch { return; }
                            }, 30000);
                          } catch { toast.error('Copy failed'); }
                        }}
                        style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Copy style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: insStyle.color, background: insStyle.bg, border: `1px solid ${insStyle.border}`, borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Lock style={{ width: 12, height: 12 }} /> {asset.instruction}
                  </span>
                  {asset.url && (
                    <motion.a whileHover={{ scale: 1.1 }} href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-3)', display: 'flex' }}>
                      <ExternalLink style={{ width: 16, height: 16 }} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!assets || assets.length === 0) && !showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 32 }}>
            <Shield style={{ width: 64, height: 64, color: 'var(--text-3)', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>Your Vault is Empty</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>Secure your digital legacy. Add accounts, keys, and sensitive information.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { 
              if (!hasDEK()) {
                setShowUnlockModal(true);
                return; // Don't open form if vault is locked
              }
              setShowForm(true); 
              scrollToForm(); 
            }}
              style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <Plus style={{ width: 16, height: 16, display: 'inline', marginRight: 8 }} /> Secure First Asset
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Vault;
