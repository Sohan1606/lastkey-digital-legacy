import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Eye, EyeOff, Plus, Shield, Lock, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Encryption functions
const getEncryptionKey = (userId) => {
  const salt = import.meta.env.VITE_ENCRYPTION_SALT || 'default-salt-for-development';
  return `${userId}-${salt}`;
};

const encryptPassword = (password, userId) => {
  if (!password) return '';
  const key = getEncryptionKey(userId);
  return CryptoJS.AES.encrypt(password, key).toString();
};

const decryptPassword = (encryptedPassword, userId) => {
  if (!encryptedPassword) return '';
  try {
    const key = getEncryptionKey(userId);
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '•••••••••••'; // Show masked if decryption fails
  }
};

const Vault = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    username: '',
    url: '',
    password: '',
    notes: '',
    instruction: 'delete'
  });
  const [showPasswords, setShowPasswords] = useState({});
  const formRef = useRef(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets, isPending: isLoading, error } = useQuery({
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
      setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' });
      setEditingId(null);
    },
    onError: (err) => {
      console.error('Create asset error:', err);
      alert(err.response?.data?.message || 'Failed to save asset. Please check your inputs.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, assetData }) => axios.put(`${API_BASE}/assets/${id}`, assetData),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      setShowForm(false);
      setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' });
      setEditingId(null);
    },
    onError: (err) => {
      console.error('Update asset error:', err);
      alert(err.response?.data?.message || 'Failed to update asset.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/assets/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['assets'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Encrypt password before sending to server
    if (submitData.password && user?.id) {
      submitData.password = encryptPassword(submitData.password, user.id);
    }
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, assetData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleEdit = (asset) => {
    setFormData({
      platform: asset.platform,
      username: asset.username,
      url: asset.url || '',
      password: decryptPassword(asset.password, user.id),
      notes: asset.notes || '',
      instruction: asset.instruction
    });
    setEditingId(asset._id);
    setShowForm(true);
    scrollToForm();
  };

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getInstructionColor = (ins) => {
    switch(ins) {
      case 'delete': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'share': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'transfer': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Decrypting your vault...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Vault</h2>
        <p className="text-slate-600 mb-6">We couldn't retrieve your secure assets. Please try again later.</p>
        <button 
          onClick={() => queryClient.invalidateQueries(['assets'])}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">Digital Vault</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Your secure legacy, protected by AES-256 encryption.</p>
            </div>
            {!showForm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowForm(false); setEditingId(null); setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); setShowForm(true); scrollToForm(); }}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
              >
                <Plus size={24} />
                Add New Asset
              </motion.button>
            )}
          </motion.div>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Secured Asset' : 'Secure New Asset'}
                  </h3>
                  <button 
                    onClick={() => { setShowForm(false); setEditingId(null); setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Platform Name</label>
                    <input
                      name="platform"
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      placeholder="e.g. Google, Binance, Facebook"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Username / ID</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Email or Username"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Website URL (Optional)</label>
                    <input
                      name="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="e.g. https://gmail.com"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Secret Password / Key</label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter the secure key"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Legacy Instruction</label>
                    <select
                      name="instruction"
                      value={formData.instruction}
                      onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                      required
                    >
                      <option value="delete">🗑️ Delete Account (Privacy Protection)</option>
                      <option value="share">🤝 Share Access with Beneficiaries</option>
                      <option value="transfer">💼 Transfer Full Ownership</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Add any specific instructions or context..."
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none h-32 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                    >
                      {createMutation.isPending || updateMutation.isPending ? 'Processing...' : editingId ? 'Update Asset' : 'Secure Asset Now'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); setFormData({ platform: '', username: '', url: '', password: '', notes: '', instruction: 'delete' }); }}
                      className="px-8 py-5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets && assets.map((asset, idx) => (
            <motion.div 
              key={asset._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl border border-slate-100 dark:border-slate-800 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Shield size={28} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(asset)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                    title="Edit Asset"
                  >
                    <Pencil size={18} className="pointer-events-none" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this asset?')) {
                        deleteMutation.mutate(asset._id);
                      }
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-red-600 transition-all"
                    title="Remove Asset"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={18} className="pointer-events-none" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-indigo-600 transition-colors">
                {asset.platform}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Identity</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{asset.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Secure Key</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg text-slate-900 dark:text-white flex-1 truncate">
                      {showPasswords[asset._id] ? decryptPassword(asset.password, user.id) : '•••••••••••'}
                    </span>
                    <button
                      onClick={() => togglePassword(asset._id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPasswords[asset._id] ? <EyeOff size={20} className="pointer-events-none" /> : <Eye size={20} className="pointer-events-none" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${getInstructionColor(asset.instruction)}`}>
                    <Lock size={14} />
                    {asset.instruction}
                  </div>
                  {asset.url && (
                    <motion.a 
                      whileHover={{ scale: 1.1, color: '#4f46e5' }} 
                      href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {(!assets || assets.length === 0) && !showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
          >
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
              <Shield size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Your Vault is Empty</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
              Start securing your digital legacy today. Add social accounts, financial keys, or private documents.
            </p>
            <button
              onClick={() => { setShowForm(true); scrollToForm(); }}
              className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
            >
              Secure First Asset
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Vault;
