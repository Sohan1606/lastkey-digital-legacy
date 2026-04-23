import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Eye, EyeOff, Plus, Shield, Lock, Unlock, ExternalLink, X, Copy, ShieldCheck, Search, Filter, Key, Wallet, FileText, Database, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { 
  deriveKey, encryptText, decryptText, isCryptoSupported,
  generateMasterDEK, setMasterDEK, getMasterDEK, hasDEK, clearMasterDEK,
  wrapDEKWithKEK, unwrapDEKWithKEK, generateSalt
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
  const [passwordChanged, setPasswordChanged] = useState(false);
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

  // Check DEK status on mount (using new vault-key API)
  const { data: dekStatus } = useQuery({
    queryKey: ['vault-key-status'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/vault-key/status`);
      return data.data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (dekStatus) {
      setDekInitialized(dekStatus.hasWrappedDek);
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
      
      // Derive KEK from password with random salt
      const salt = generateSalt();
      const kek = await deriveKey(password, salt);
      
      // Wrap DEK with KEK
      const wrapped = await wrapDEKWithKEK(dek, kek);
      
      // Send to server
      await axios.post(`${API_BASE}/vault-key/initialize`, {
        wrappedDek: {
          saltB64: salt,
          iterations: 100000,
          ivB64: wrapped.ivB64,
          ciphertextB64: wrapped.ciphertextB64,
          version: '1'
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
      if (err.response?.status === 409) {
        toast.error('Vault already initialized. Please unlock instead.');
        // Update status to prevent repeated attempts
        setDekInitialized(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to initialize vault');
      }
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
      
      // Fetch wrapped DEK from server
      const { data } = await axios.get(`${API_BASE}/vault-key/wrapped-dek`);
      const wrappedDek = data.data.wrappedDek;
      
      // Derive KEK from password
      const kek = await deriveKey(password, wrappedDek.saltB64);
      
      // Unwrap DEK with KEK
      const dek = await unwrapDEKWithKEK(
        wrappedDek.ciphertextB64,
        wrappedDek.ivB64,
        kek
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
          const encryptedPassword = await encryptText(assetData.password, dek);
          assetData.password = encryptedPassword;
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
      console.error('Asset creation error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const errorMessages = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to save asset');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, assetData }) => {
      // Block plaintext updates - require vault unlock for password changes
      if (assetData.password && assetData.password.trim() !== '' && !hasDEK()) {
        toast.error('Unlock vault to update password');
        setShowUnlockModal(true);
        throw new Error('Vault must be unlocked to update password');
      }
      
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
      setPasswordChanged(false);
      toast.success('Asset updated!');
    },
    onError: (err) => {
      if (err.message.includes('unlock')) return;
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
    
    if (!hasDEK()) {
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
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading your vault...</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        padding: '32px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Vault Status Indicator */}
          <div style={{
            background: hasDEK() ? 'rgba(0,229,160,0.1)' : 'rgba(255,184,48,0.1)',
            border: `1px solid ${hasDEK() ? 'rgba(0,229,160,0.3)' : 'rgba(255,184,48,0.3)'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: hasDEK() ? 'rgba(0,229,160,0.2)' : 'rgba(255,184,48,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {hasDEK() ? (
                <Unlock style={{ width: '20px', height: '20px', color: '#00e5a0' }} />
              ) : (
                <Lock style={{ width: '20px', height: '20px', color: '#ffb830' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px' }}>
                Vault Status: {hasDEK() ? 'Unlocked' : 'Locked'}
              </h3>
              <p style={{ fontSize: '13px', color: hasDEK() ? '#00e5a0' : '#ffb830', margin: 0 }}>
                {hasDEK() 
                  ? 'Your vault is unlocked. You can securely add and manage assets.' 
                  : 'Your vault is locked. Click "Add Asset" to unlock your vault first.'
                }
              </p>
            </div>
            {!hasDEK() && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUnlockModal(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--gradient-amber)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Unlock Vault
              </motion.button>
            )}
          </div>
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
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
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
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                      {dekInitialized ? 'Unlock Your Vault' : 'Initialize Your Vault'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
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
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    unlockVault(vaultPassword).then(success => {
                      if (success && pendingDecryptId) {
                        const asset = assets.find(a => a._id === pendingDecryptId);
                        if (asset) {
                          handleShowPassword(pendingDecryptId, asset.password);
                        }
                        setPendingDecryptId(null);
                      }
                    });
                  }}>
                    <input
                      type="password"
                      placeholder="Enter vault password..."
                      value={vaultPassword}
                      onChange={e => setVaultPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-hover)',
                        background: 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}
                    />
                  </form>
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
                      border: 'none', background: 'var(--gradient-green-blue)',
                      color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: isInitializingDEK ? 'not-allowed' : 'pointer',
                      opacity: isInitializingDEK ? 0.7 : 1
                    }}
                  >
                    {isInitializingDEK ? 'Initializing...' : dekInitialized ? 'Unlock Vault' : 'Initialize Vault'}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                My Vault
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {assets?.length || 0} encrypted items stored securely
              </p>
            </div>
            {!showForm && (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.97 }} 
                onClick={() => { 
                  if (!hasDEK()) {
                    setShowUnlockModal(true);
                    return;
                  }
                  setShowForm(false); 
                  setEditingId(null); 
                  setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); 
                  setShowForm(true); 
                  scrollToForm(); 
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Plus size={16} />
                Add Vault Item
              </motion.button>
            )}
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {['All', 'Passwords', 'Documents', 'Notes', 'Financial', 'Medical'].map((category) => (
              <button
                key={category}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  border: 'none',
                  background: category === 'All' ? 'var(--blue-dim)' : 'transparent',
                  color: category === 'All' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: category === 'All' ? '1px solid var(--blue-border)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (category !== 'All') {
                    e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (category !== 'All') {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search and Filter Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#64748b'
              }} />
              <input 
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: '#050d1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
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
                placeholder="Search vault items..." 
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#050d1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 150ms'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#64748b';
              e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
            >
              <Filter size={16} />
              Filter
            </button>
          </div>

          {assets && assets.length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '12px', 
              background: 'rgba(0,229,160,0.04)', 
              border: '1px solid rgba(0,229,160,0.15)', 
              borderRadius: '12px', 
              padding: '12px 18px', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    background: '#00e5a0', 
                    boxShadow: '0 0 8px #00e5a0' 
                  }} />
                  <span style={{ fontSize: '12px', color: '#00e5a0', fontWeight: 600 }}>AES-256 Encrypted</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {assets.length} item{assets.length !== 1 ? 's' : ''} secured
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                Zero-knowledge vault
              </span>
            </div>
          )}

          <AnimatePresence>
            {showForm && (
              <motion.div ref={formRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: '32px', overflow: 'hidden' }}>
                <div style={{ 
                  background: '#050d1a', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px', 
                  padding: '24px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                      {editingId ? 'Edit Asset' : 'Secure New Asset'}
                    </h3>
                    <button 
                      onClick={() => { setShowForm(false); setEditingId(null); }} 
                      style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                      onMouseLeave={(e) => e.target.style.color = '#64748b'}
                    >
                      <X style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Platform Name</label>
                      <input 
                        type="text" 
                        value={formData.platform} 
                        onChange={e => setFormData({...formData, platform: e.target.value})} 
                        placeholder="e.g. Google, Binance" 
                        required 
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
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
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Username / ID</label>
                      <input 
                        type="text" 
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        placeholder="Email or username" 
                        required 
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
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
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Website URL (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.url} 
                        onChange={e => setFormData({...formData, url: e.target.value})} 
                        placeholder="https://..." 
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
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
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Secret Password / Key</span>
                          {cryptoSupported && formData.password && hasDEK() && (
                            <span style={{ fontSize: '10px', color: '#00e5a0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Lock size={10} /> DEK Encrypted
                            </span>
                          )}
                        </span>
                      </label>
                      <input 
                        type="password" 
                        value={formData.password} 
                        onChange={e => {
                          setFormData({...formData, password: e.target.value});
                          if (editingId) setPasswordChanged(e.target.value !== '');
                        }}
                        placeholder={hasDEK() ? "Enter the secure key" : "Unlock vault first to add assets"} 
                        required 
                        disabled={!hasDEK() && !editingId}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 150ms',
                          opacity: (!hasDEK() && !editingId) ? 0.5 : 1
                        }}
                        onFocus={(e) => {
                          if (hasDEK() || editingId) {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {(!hasDEK() && editingId && passwordChanged) ? (
                        <p style={{ fontSize: '11px', color: '#ffb830', marginTop: '6px', marginBottom: 0 }}>
                          â ï¸ Unlock vault to update password (required for client encryption)
                        </p>
                      ) : !hasDEK() && !editingId ? (
                        <p style={{ fontSize: '11px', color: '#ffb830', marginTop: '6px', marginBottom: 0 }}>
                          â ï¸ Please unlock your vault using the button above to enable encryption.
                        </p>
                      ) : (
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                          This password will be encrypted in your browser before being sent to our servers.
                        </p>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Legacy Instruction</label>
                      <select 
                        value={formData.instruction} 
                        onChange={e => setFormData({...formData, instruction: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
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
                      >
                        <option value="delete">Delete Account (Privacy)</option>
                        <option value="share">Share with Beneficiaries</option>
                        <option value="transfer">Transfer Ownership</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Asset Type</label>
                      <select 
                        value={formData.assetType || 'general'} 
                        onChange={e => setFormData({...formData, assetType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
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
                      >
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
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#e2e8f0',
                            marginBottom: '8px'
                          }}>Cryptocurrency</label>
                          <select 
                            value={formData.cryptocurrency || ''} 
                            onChange={e => setFormData({...formData, cryptocurrency: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: 'var(--bg-base)',
                              border: '1px solid var(--border-hover)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
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
                          >
                            <option value="">Select crypto...</option>
                            {['BTC','ETH','USDT','USDC','BNB','SOL','ADA','DOT','MATIC','AVAX','LINK','other'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#e2e8f0',
                            marginBottom: '8px'
                          }}>Blockchain Network</label>
                          <select 
                            value={formData.blockchain || ''} 
                            onChange={e => setFormData({...formData, blockchain: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: 'var(--bg-base)',
                              border: '1px solid var(--border-hover)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
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
                          >
                            <option value="">Select blockchain...</option>
                            {['Bitcoin','Ethereum','BSC','Polygon','Solana','Avalanche','Cardano','Polkadot','other'].map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#e2e8f0',
                            marginBottom: '8px'
                          }}>Public Wallet Address (Optional)</label>
                          <input 
                            type="text" 
                            value={formData.walletAddress || ''} 
                            onChange={e => setFormData({...formData, walletAddress: e.target.value})} 
                            placeholder="0x... or bc1... (public address only)" 
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: 'var(--bg-base)',
                              border: '1px solid var(--border-hover)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
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
                        <div style={{ 
                          gridColumn: '1 / -1', 
                          background: 'rgba(255,184,48,0.06)', 
                          border: '1px solid rgba(255,184,48,0.2)', 
                          borderRadius: '8px', 
                          padding: '12px 14px' 
                        }}>
                          <p style={{ fontSize: '12px', color: '#ffb830', margin: 0 }}>
                            Security: Your seed phrase / private key is encrypted with AES-256 before storage. Never share your private key with anyone other than your designated beneficiaries.
                          </p>
                        </div>
                      </>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '8px'
                      }}>Additional Notes</label>
                      <textarea 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})} 
                        placeholder="Instructions or context..." 
                        style={{ 
                          height: '80px', 
                          resize: 'none',
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 150ms',
                          fontFamily: 'inherit'
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
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                      <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }} 
                        disabled={createMutation.isPending || updateMutation.isPending || (!hasDEK() && (passwordChanged || !editingId))}
                        style={{ 
                          flex: 1, 
                          padding: '14px 24px', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', 
                          color: 'white', 
                          fontWeight: 600, 
                          fontSize: '14px', 
                          cursor: (createMutation.isPending || updateMutation.isPending || (!hasDEK() && (passwordChanged || !editingId))) ? 'not-allowed' : 'pointer', 
                          opacity: (createMutation.isPending || updateMutation.isPending || (!hasDEK() && (passwordChanged || !editingId))) ? 0.6 : 1,
                          transition: 'all 150ms'
                        }}
                        onMouseEnter={(e) => {
                          if (!(createMutation.isPending || updateMutation.isPending || (!hasDEK() && (passwordChanged || !editingId)))) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 158, 255, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(createMutation.isPending || updateMutation.isPending || (!hasDEK() && (passwordChanged || !editingId)))) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {createMutation.isPending || updateMutation.isPending ? 'Processing...' : editingId ? 'Update Asset' : 'Secure Asset'}
                      </motion.button>
                      <motion.button 
                        type="button" 
                        whileHover={{ scale: 1.01 }} 
                        whileTap={{ scale: 0.98 }} 
                        onClick={() => { setShowForm(false); setEditingId(null); }}
                        style={{ 
                          padding: '14px 24px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-hover)', 
                          background: 'var(--bg-card)', 
                          color: '#e2e8f0', 
                          fontWeight: 500, 
                          fontSize: '14px', 
                          cursor: 'pointer',
                          transition: 'all 150ms'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.04)';
                          e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#050d1a';
                          e.target.style.color = '#e2e8f0';
                        }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {assets && assets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--glass-1)',
              border: '1px solid var(--glass-border)',
              borderRadius: 24,
              marginTop: 24
            }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>
                🔒
              </div>
              <h3 style={{ 
                fontSize: 20, fontWeight: 700, 
                color: 'var(--text-1)', marginBottom: 8 
              }}>
                Your vault is empty
              </h3>
              <p style={{ 
                fontSize: 14, color: 'var(--text-2)', 
                marginBottom: 24, maxWidth: 340, margin: '0 auto 24px'
              }}>
                Start protecting your most important 
                digital assets. Add passwords, documents, 
                financial info, and more.
              </p>
              <button onClick={() => { 
                if (!hasDEK()) {
                  setShowUnlockModal(true);
                  return;
                }
                setShowForm(true);
                setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete', assetType: 'general', cryptocurrency: '', walletAddress: '', blockchain: '' });
                scrollToForm();
              }}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none', borderRadius: 12,
                  color: 'white', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer'
                }}>
                + Add Your First Item
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {assets && assets.map((asset, idx) => {
              const insStyle = getInstructionStyle(asset.instruction);
              const decryptedPassword = showPasswords[asset._id];
              
              // Get appropriate icon based on asset type
              const getAssetIcon = () => {
                if (asset.assetType?.includes('crypto')) return <Wallet size={20} />;
                if (asset.assetType?.includes('key') || asset.assetType?.includes('seed')) return <Key size={20} />;
                if (asset.assetType?.includes('document')) return <FileText size={20} />;
                if (asset.assetType?.includes('financial')) return <CreditCard size={20} />;
                return <Shield size={20} />;
              };
              
              return (
                <motion.div 
                  key={asset._id} 
                  initial={{ opacity: 0, y: 16 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 200ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 20px 40px -10px rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.04)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {/* Header with icon and actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--primary-light)',
                      border: '1px solid var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}>
                      {getAssetIcon()}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {deleteConfirm === asset._id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => { deleteMutation.mutate(asset._id); setDeleteConfirm(null); }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'var(--error-light)',
                              border: '1px solid var(--error)',
                              color: 'var(--error)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--error)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'var(--error-light)';
                            }}
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-hover)',
                              color: 'var(--text-muted)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                              e.target.style.color = 'var(--text-muted)';
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <motion.button 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => handleEdit(asset)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-hover)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = '#ffffff';
                              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = 'var(--text-muted)';
                              e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <Pencil size={16} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={() => setDeleteConfirm(asset._id)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-hover)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 150ms'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = 'var(--error)';
                              e.target.style.background = 'var(--error-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = 'var(--text-muted)';
                              e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                            }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Platform name */}
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '12px' }}>
                    {asset.platform}
                  </h3>

                  {/* Category tags */}
                  {asset.assetType && asset.assetType !== 'general' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'var(--warning-light)',
                        border: '1px solid var(--warning)',
                        color: 'var(--warning)',
                        fontSize: '10px',
                        fontWeight: 500,
                        textTransform: 'uppercase'
                      }}>
                        {asset.assetType.replace(/_/g, ' ')}
                      </span>
                      {asset.cryptocurrency && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--primary-light)',
                          border: '1px solid var(--primary)',
                          color: 'var(--primary)',
                          fontSize: '10px',
                          fontWeight: 500
                        }}>
                          {asset.cryptocurrency}
                        </span>
                      )}
                      {asset.blockchain && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          color: '#8b5cf6',
                          fontSize: '10px',
                          fontWeight: 500
                        }}>
                          {asset.blockchain}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Username */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Username
                    </span>
                    <p style={{ fontSize: '14px', color: '#ffffff', marginTop: '4px', margin: 0 }}>
                      {asset.username}
                    </p>
                  </div>
                  
                  {/* Password field */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Password
                      </span>
                      {asset.clientEncrypted && (
                        <span style={{
                          fontSize: '10px',
                          color: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500,
                          background: 'rgba(34, 197, 94, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                          <Lock size={10} /> Client Encrypted
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {decryptedPassword || 'â¢â¢â¢â¢â¢â¢â¢â¢â¢â¢'}
                      </span>
                      <button 
                        onClick={() => handleShowPassword(asset._id, asset.password)} 
                        style={{
                          padding: '6px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 150ms',
                          background: 'none',
                          border: 'none',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#ffffff';
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#64748b';
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        {decryptedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'all 150ms',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#ffffff';
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#64748b';
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ 
                    paddingTop: '16px', 
                    borderTop: '1px solid rgba(255,255,255,0.04)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: insStyle.color, 
                      background: insStyle.bg, 
                      border: `1px solid ${insStyle.border}`, 
                      borderRadius: '6px', 
                      padding: '4px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px' 
                    }}>
                      <Lock style={{ width: 12, height: 12 }} /> 
                      {asset.instruction}
                    </span>
                    {asset.url && (
                      <motion.a 
                        whileHover={{ scale: 1.1 }} 
                        href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: 'var(--text-muted)', 
                          display: 'flex',
                          textDecoration: 'none',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'all 150ms'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#ffffff';
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#64748b';
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        <ExternalLink style={{ width: 16, height: 16 }} />
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Vault;
