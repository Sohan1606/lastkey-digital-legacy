import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Lock, Unlock, Trash2, Send, ArrowLeft, Calendar, MessageSquare, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Capsules = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [minDate, setMinDate] = useState('');
  
  useEffect(() => {
    setMinDate(new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,16));
  }, []);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    unlockAt: ''
  });

  const { data: capsules, isPending: isLoading } = useQuery({
    queryKey: ['capsules'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/capsules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data.capsules;
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (newCapsule) => axios.post(`${API_BASE}/capsules`, newCapsule, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['capsules']);
      setFormData({ title: '', message: '', unlockAt: '' });
      setShowForm(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Time capsule sealed!');
    },
    onError: () => {
      toast.error('Failed to create capsule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/capsules/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('Capsule deleted');
      queryClient.invalidateQueries(['capsules']);
    },
    onError: () => {
      toast.error('Failed to delete capsule');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, unlockAt: new Date(formData.unlockAt).toISOString() });
  };

  if (isLoading) return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stars" />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Retrieving your time capsules...</p>
      </div>
    </div>
  );

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 20, textDecoration: 'none', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock style={{ width: 22, height: 22, color: 'var(--pulse)' }} />
              </div>
              <div>
                <h1 className="display" style={{ fontSize: 28 }}>Time Capsules</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Send messages and assets to the future</p>
              </div>
            </div>
            {!showForm && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00b87a, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16 }} /> Create Capsule
              </motion.button>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 32, overflow: 'hidden' }}>
              <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Seal a New Capsule</h2>
                  <button onClick={() => setShowForm(false)} style={{ padding: 8, borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X style={{ width: 18, height: 18, color: 'var(--text-3)' }} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label>Capsule Title</label>
                    <input type="text" placeholder="e.g. For my daughter's 18th birthday" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div>
                    <label>Your Future Message</label>
                    <textarea placeholder="What would you like to say?" rows="5" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{ resize: 'none' }} required />
                  </div>
                  <div>
                    <label>Unlock Date & Time</label>
                    <input type="datetime-local" value={formData.unlockAt} onChange={e => setFormData({...formData, unlockAt: e.target.value})} min={minDate} required />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={createMutation.isPending}
                      style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: 'none', background: createMutation.isPending ? 'var(--glass-2)' : 'linear-gradient(135deg, #00b87a, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: createMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending ? 0.6 : 1 }}>
                      {createMutation.isPending ? 'Sealing...' : 'Seal Capsule Now'}
                    </motion.button>
                    <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(false)}
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
          {!capsules || capsules.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 32 }}>
              <Clock style={{ width: 64, height: 64, color: 'var(--text-3)', margin: '0 auto 20px' }} />
              <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>No Time Capsules Yet</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>Your future self and loved ones are waiting. Schedule your first time-locked message.</p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowForm(true)}
                style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #00b87a, #00e5a0)', color: '#001a12', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                <Plus style={{ width: 16, height: 16, display: 'inline', marginRight: 8 }} /> Seal First Capsule
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {capsules.map((capsule, idx) => (
                <motion.div key={capsule._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: capsule.isReleased ? '1px solid rgba(0,229,160,0.3)' : '1px solid var(--glass-border)', borderRadius: 20, padding: 24, transition: 'all 0.22s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { if (!capsule.isReleased) { e.currentTarget.style.borderColor = 'rgba(0,229,160,0.4)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = capsule.isReleased ? 'rgba(0,229,160,0.3)' : 'var(--glass-border)'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: capsule.isReleased ? 'rgba(0,229,160,0.15)' : 'var(--glass-2)', border: capsule.isReleased ? '1px solid rgba(0,229,160,0.25)' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {capsule.isReleased ? <Unlock style={{ width: 20, height: 20, color: 'var(--pulse)' }} /> : <Lock style={{ width: 20, height: 20, color: 'var(--text-2)' }} />}
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { if (window.confirm('Delete this time capsule?')) deleteMutation.mutate(capsule._id); }}
                      style={{ padding: 8, borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', cursor: 'pointer' }}>
                      <Trash2 style={{ width: 14, height: 14, color: 'var(--danger)' }} />
                    </motion.button>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>{capsule.title}</h3>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                      <Calendar style={{ width: 14, height: 14 }} />
                      {capsule.isReleased ? 'Released on ' : 'Unlocks on '}
                      {format(new Date(capsule.isReleased ? capsule.releasedAt : capsule.unlockAt), 'MMM dd, yyyy')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
                      <MessageSquare style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>"{capsule.message}"</span>
                    </div>
                  </div>

                  <div style={{ paddingTop: 14, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: capsule.isReleased ? 'var(--pulse)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {capsule.isReleased ? 'Message Delivered' : 'Temporal Lock Active'}
                    </span>
                    {capsule.isReleased && <Send style={{ width: 16, height: 16, color: 'var(--pulse)' }} />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Capsules;
