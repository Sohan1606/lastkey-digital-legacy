import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Mail, Shield, Trash2, ArrowLeft, Heart, Briefcase, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Beneficiaries = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: 'other',
    accessLevel: 'view'
  });

  const { data: beneficiaries, isPending: isLoading } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/beneficiaries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data.beneficiaries;
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (newBeneficiary) => axios.post(`${API_BASE}/beneficiaries`, newBeneficiary, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['beneficiaries']);
      setFormData({ name: '', email: '', relationship: 'other', accessLevel: 'view' });
      toast.success('Beneficiary added!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add beneficiary');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/beneficiaries/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('Beneficiary removed');
      queryClient.invalidateQueries(['beneficiaries']);
    },
    onError: () => {
      toast.error('Failed to remove beneficiary');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getRelationshipIcon = (rel) => {
    switch(rel) {
      case 'spouse': return Heart;
      case 'child': return User;
      case 'lawyer': return Briefcase;
      default: return Users;
    }
  };

  const relationshipColors = {
    spouse: '#ff4d6d',
    child: '#4f9eff',
    friend: '#00e5a0',
    lawyer: '#ffb830',
    other: '#7c5cfc'
  };

  if (isLoading) return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stars" />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Loading trusted circle...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(255,77,109,0.3))', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: 22, height: 22, color: 'var(--plasma)' }} />
            </div>
            <div>
              <h1 className="display" style={{ fontSize: 28 }}>Beneficiaries</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Trusted individuals to manage your legacy</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 28 }}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, position: 'sticky', top: 96 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <UserPlus style={{ width: 18, height: 18, color: 'var(--plasma)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Add Contact</h2>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label>Full Name</label>
                <input type="text" placeholder="Trusted person's name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label>Email Address</label>
                <input type="email" placeholder="Their secure email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Relationship</label>
                  <select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})}>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Access Level</label>
                  <select value={formData.accessLevel} onChange={e => setFormData({...formData, accessLevel: e.target.value})}>
                    <option value="view">View Only</option>
                    <option value="full">Full Access</option>
                  </select>
                </div>
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={createMutation.isPending}
                style={{ padding: '14px 24px', borderRadius: 12, border: 'none', background: createMutation.isPending ? 'var(--glass-2)' : 'linear-gradient(135deg, #7c5cfc, #ff4d6d)', color: 'white', fontWeight: 700, fontSize: 14, cursor: createMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending ? 0.6 : 1, marginTop: 8 }}>
                {createMutation.isPending ? 'Processing...' : 'Nominate Now'}
              </motion.button>
            </form>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!beneficiaries || beneficiaries.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24 }}>
                <Users style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>No Beneficiaries Added</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 320, margin: '0 auto' }}>Your digital assets need a guardian. Add trusted contacts to your legacy plan.</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {beneficiaries.map((beneficiary, idx) => {
                  const Icon = getRelationshipIcon(beneficiary.relationship);
                  const color = relationshipColors[beneficiary.relationship] || relationshipColors.other;
                  return (
                    <motion.div key={beneficiary._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.08 }}
                      style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 24, transition: 'all 0.22s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: 22, height: 22, color }} />
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { if(window.confirm(`Remove ${beneficiary.name}?`)) deleteMutation.mutate(beneficiary._id); }}
                          style={{ padding: 8, borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', cursor: 'pointer' }}>
                          <Trash2 style={{ width: 14, height: 14, color: 'var(--danger)' }} />
                        </motion.button>
                      </div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{beneficiary.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                        <Mail style={{ width: 14, height: 14 }} /> {beneficiary.email}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{beneficiary.relationship}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#00e5a0', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Shield style={{ width: 12, height: 12 }} /> {beneficiary.accessLevel.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Beneficiaries;
