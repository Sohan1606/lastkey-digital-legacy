import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Eye, EyeOff, Plus, Shield, Lock, ExternalLink, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const formRef = useRef(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets, isPending: isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/assets`);
      return data.data;
    },
    enabled: !!user,
    retry: 1
  });

  const createMutation = useMutation({
    mutationFn: (assetData) => axios.post(`${API_BASE}/assets`, assetData),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete', assetType: 'general', cryptocurrency: '', walletAddress: '', blockchain: '' });
      setEditingId(null);
      toast.success('Asset secured!');
    },
    onError: () => {
      toast.error('Failed to save asset');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, assetData }) => axios.put(`${API_BASE}/assets/${id}`, assetData),
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
      password: asset.password,
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

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
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
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Decrypting your vault...</p>
      </div>
    </div>
  );

  
  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: 22, height: 22, color: 'var(--pulse)' }} />
              </div>
              <div>
                <h1 className="display" style={{ fontSize: 28 }}>Digital Vault</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>AES-256 encrypted legacy assets</p>
              </div>
            </div>
            {!showForm && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setShowForm(false); setEditingId(null); setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); setShowForm(true); scrollToForm(); }}
                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00e5a0, #4f9eff)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16 }} /> Add Asset
              </motion.button>
            )}
          </div>
        </motion.div>

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
                    <label>Secret Password / Key</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Enter the secure key" required />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Legacy Instruction</label>
                    <select value={formData.instruction} onChange={e => setFormData({...formData, instruction: e.target.value})}>
                      <option value="delete">Delete Account (Privacy)</option>
                      <option value="share">Share with Beneficiaries</option>
                      <option value="transfer">Transfer Ownership</option>
                    </select>
                  </div>
                  {/* Asset Type */}
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
                  {/* Crypto-specific fields */}
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
                      {/* Security tip */}
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
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={createMutation.isPending || updateMutation.isPending}
                      style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: createMutation.isPending || updateMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1 }}>
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
                {/* Crypto badges */}
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
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Key</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {showPasswords[asset._id] ? asset.password : '•••••••••••'}
                    </span>
                    <button onClick={() => togglePassword(asset._id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPasswords[asset._id] ? <EyeOff style={{ width: 16, height: 16, color: 'var(--text-2)' }} /> : <Eye style={{ width: 16, height: 16, color: 'var(--text-2)' }} />}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(asset.password);
                          toast.success('Copied! Auto-clears in 30s', { duration: 2500 });
                          setTimeout(async () => {
                            try {
                              const c = await navigator.clipboard.readText();
                              if (c === asset.password) await navigator.clipboard.writeText('');
                            } catch {}
                          }, 30000);
                        } catch { toast.error('Copy failed'); }
                      }}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Copy style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
                    </button>
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
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { setShowForm(true); scrollToForm(); }}
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
