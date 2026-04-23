import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Mail, Shield, Trash2, ArrowLeft, Heart, Briefcase, User, CheckCircle, Clock, AlertCircle, Send, Search, Filter, UserCheck, Crown, Key, Lock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Beneficiaries = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: 'other',
    accessLevel: 'view',
    verificationQuestion: '',
    verificationAnswer: '',
    verificationHint: ''
  });

  const [showChecklist, setShowChecklist] = useState(false);

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
      setFormData({ name: '', email: '', relationship: 'other', accessLevel: 'view', verificationQuestion: '', verificationAnswer: '', verificationHint: '' });
      setShowChecklist(false);
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

  // SECURITY LAYER 5: Portal access mutations
  const revokePortalMutation = useMutation({
    mutationFn: (id) => axios.post(`${API_BASE}/beneficiaries/${id}/revoke-portal`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('Portal access revoked');
      queryClient.invalidateQueries(['beneficiaries']);
    },
    onError: () => {
      toast.error('Failed to revoke access');
    }
  });

  const resendPortalMutation = useMutation({
    mutationFn: (id) => axios.post(`${API_BASE}/beneficiaries/${id}/resend-portal`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('New access link sent');
      queryClient.invalidateQueries(['beneficiaries']);
    },
    onError: () => {
      toast.error('Failed to resend link');
    }
  });

  // Fetch portal status for all beneficiaries
  const { data: portalStatuses } = useQuery({
    queryKey: ['portal-statuses', beneficiaries],
    queryFn: async () => {
      if (!beneficiaries || beneficiaries.length === 0) return {};
      const statuses = {};
      await Promise.all(
        beneficiaries.map(async (b) => {
          try {
            const { data } = await axios.get(`${API_BASE}/beneficiaries/${b._id}/portal-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            statuses[b._id] = data.data;
          } catch {
            statuses[b._id] = null;
          }
        })
      );
      return statuses;
    },
    enabled: !!beneficiaries && beneficiaries.length > 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getRelationshipIcon = (rel) => {
    const map = { spouse: Heart, child: User, parent: User, sibling: User, friend: Users, lawyer: Briefcase, other: Shield };
    return map[rel] || Shield;
  };

  const relationshipColors = {
    spouse: '#ff4d6d', child: '#7c5cfc', parent: '#4f9eff',
    sibling: '#00e5a0', friend: '#ffb830', lawyer: '#8899bb', other: '#3d5070'
  };

  const totalCount = beneficiaries?.length || 0;

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
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading trusted circle...</p>
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
          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link 
              to="/dashboard" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                marginBottom: '32px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#64748b';
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.2), rgba(255, 77, 109, 0.2))',
                  border: '1px solid rgba(124, 92, 252, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users style={{ width: '28px', height: '28px', color: '#7c5cfc' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    Beneficiaries
                  </h1>
                  <p style={{ fontSize: '16px', color: '#64748b' }}>
                    Trusted individuals to manage your legacy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                👥 Add Beneficiary
              </button>
            </div>
            
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
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
                    background: 'var(--bg-card)',
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
                  placeholder="Search beneficiaries..." 
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
            
            {/* Beneficiary Access Info */}
            {totalCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(79,158,255,0.06)',
                  border: '1px solid rgba(79,158,255,0.15)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '18px' }}>ℹ️</span>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Your beneficiaries will automatically receive 
                    secure email access when your trigger activates.
                    They do not need to do anything in advance.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
            {/* Add Beneficiary Form */}
            <motion.div 
              initial={{ opacity: 0, x: -16 }} 
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                position: 'sticky',
                top: '96px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <UserPlus style={{ width: '20px', height: '20px', color: '#7c5cfc' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                  Add Beneficiary
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#e2e8f0',
                    marginBottom: '8px'
                  }}>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Trusted person's name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
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
                  }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Their secure email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#e2e8f0',
                      marginBottom: '8px'
                    }}>Relationship</label>
                    <select 
                      value={formData.relationship} 
                      onChange={e => setFormData({...formData, relationship: e.target.value})}
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
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#e2e8f0',
                      marginBottom: '8px'
                    }}>Access Level</label>
                    <select 
                      value={formData.accessLevel} 
                      onChange={e => setFormData({...formData, accessLevel: e.target.value})}
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
                      <option value="view">View Only</option>
                      <option value="full">Full Access</option>
                    </select>
                  </div>
                </div>

                {/* Security Question Section */}
                <div style={{ 
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <p style={{ 
                    fontSize: 13, 
                    fontWeight: 600,
                    color: '#4f9eff',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}>
                    🔐 Security Verification
                  </p>
                  <p style={{ 
                    fontSize: 12, 
                    color: 'var(--text-secondary)', 
                    marginBottom: 16 
                  }}>
                    Set a question only this person can answer.
                    This protects their access if someone else 
                    intercepts the email.
                  </p>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#e2e8f0',
                      marginBottom: '8px'
                    }}>
                      <Shield style={{ width: '12px', height: '12px', marginRight: '4px', display: 'inline-block' }} />
                      Verification Question
                    </label>
                    <input 
                      type="text" 
                      placeholder="Example: What is the name of the city where we first met?" 
                      value={formData.verificationQuestion} 
                      onChange={e => setFormData({...formData, verificationQuestion: e.target.value})} 
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
                  <div style={{ marginTop: 16 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#e2e8f0',
                      marginBottom: '8px'
                    }}>
                      <Key style={{ width: '12px', height: '12px', marginRight: '4px', display: 'inline-block' }} />
                      Answer (Only this beneficiary should know)
                    </label>
                    <input 
                      type="text" 
                      placeholder="The answer to your question" 
                      value={formData.verificationAnswer} 
                      onChange={e => setFormData({...formData, verificationAnswer: e.target.value})} 
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
                  <div style={{ marginTop: 16 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#e2e8f0',
                      marginBottom: '8px'
                    }}>
                      Hint (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="A clue to help them remember..." 
                      value={formData.verificationHint} 
                      onChange={e => setFormData({...formData, verificationHint: e.target.value})} 
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
                    <p style={{ fontSize: 11, color: '#3d5070', marginTop: 4 }}>
                      The hint is shown to the beneficiary but 
                      NOT the answer. Keep it vague enough 
                      that only they understand.
                    </p>
                  </div>
                </div>

                {/* SECURITY LAYER 7: Show Checklist Button */}
                {!showChecklist && (
                  <motion.button
                    type="button"
                    onClick={() => setShowChecklist(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!formData.name || !formData.email || !formData.verificationQuestion || !formData.verificationAnswer}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: (!formData.name || !formData.email || !formData.verificationQuestion || !formData.verificationAnswer) ? '#050d1a' : 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: (!formData.name || !formData.email || !formData.verificationQuestion || !formData.verificationAnswer) ? 'not-allowed' : 'pointer',
                      opacity: (!formData.name || !formData.email || !formData.verificationQuestion || !formData.verificationAnswer) ? 0.6 : 1,
                      marginTop: '8px',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => {
                      if (formData.name && formData.email && formData.verificationQuestion && formData.verificationAnswer) {
                        e.target.style.background = 'linear-gradient(135deg, #3b82f6, #6d28d9)';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 158, 255, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.name && formData.email && formData.verificationQuestion && formData.verificationAnswer) {
                        e.target.style.background = 'linear-gradient(135deg, #4f9eff, #7c5cfc)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    Review Security Checklist
                  </motion.button>
                )}

                {/* SECURITY LAYER 7: Security Checklist */}
                {showChecklist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      background: 'rgba(79, 158, 255, 0.06)',
                      border: '1px solid rgba(79, 158, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginTop: '8px'
                    }}
                  >
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#4f9eff',
                      marginBottom: '16px'
                    }}>
                      Security Checklist for {formData.name}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                          Make sure <strong>{formData.name}'s email is current</strong> and only they have access to it
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                          The verification question should be something <strong>only {formData.name} would know</strong> — not public information
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                          Tell {formData.name} they are a beneficiary but <strong>do NOT share the verification answer</strong> with anyone else
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                          Periodically verify {formData.name}'s email is still active
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                          You can revoke access at any time from your dashboard
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showChecklist && (
                  <motion.button 
                  type="submit" 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.98 }} 
                  disabled={createMutation.isPending}
                  style={{ 
                    padding: '14px 24px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: createMutation.isPending ? '#050d1a' : 'linear-gradient(135deg, #7c5cfc, #ff4d6d)', 
                    color: 'var(--text-primary)', 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer', 
                    opacity: createMutation.isPending ? 0.6 : 1,
                    marginTop: '8px',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    if (!createMutation.isPending) {
                      e.target.style.background = 'linear-gradient(135deg, #6d28d9, #dc2626)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 10px 25px -5px rgba(124, 92, 252, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!createMutation.isPending) {
                      e.target.style.background = 'linear-gradient(135deg, #7c5cfc, #ff4d6d)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {createMutation.isPending ? 'Processing...' : 'Nominate Now'}
                </motion.button>
                )}
              </form>
            </motion.div>

            {/* Beneficiaries List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {!beneficiaries || beneficiaries.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '80px 40px', 
                    background: 'var(--bg-card)', 
                    backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(255,255,255,0.04)', 
                    borderRadius: '16px' 
                  }}
                >
                  <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>
                    👥
                  </div>
                  <h3 style={{ 
                    fontSize: 20, fontWeight: 700, 
                    color: 'var(--text-primary)', marginBottom: 8 
                  }}>
                    No beneficiaries added yet
                  </h3>
                  <p style={{ 
                    fontSize: 14, color: '#64748b', 
                    marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' 
                  }}>
                    Designate the people who should 
                    receive your digital legacy when the time comes.
                  </p>
                  <button onClick={() => setShowChecklist(true)}
                    style={{
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                      border: 'none', borderRadius: 12,
                      color: 'white', fontSize: 14,
                      fontWeight: 700, cursor: 'pointer'
                    }}>
                    Add Your First Beneficiary
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {beneficiaries.map((beneficiary, idx) => {
                    const Icon = getRelationshipIcon(beneficiary.relationship);
                    const color = relationshipColors[beneficiary.relationship] || relationshipColors.other;
                    return (
                      <motion.div 
                        key={beneficiary._id} 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        transition={{ delay: idx * 0.08 }}
                        style={{
                          background: 'var(--bg-card)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '12px',
                          padding: '24px',
                          transition: 'all 200ms'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = `${color}40`;
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.04)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: `${color}15`,
                            border: `1px solid ${color}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon style={{ width: '28px', height: '28px', color }} />
                          </div>
                          {deleteConfirm === beneficiary._id ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => { deleteMutation.mutate(beneficiary._id); setDeleteConfirm(null); }}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 150ms'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                                }}
                              >
                                Remove
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: 'var(--text-muted)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 150ms'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = '#ffffff';
                                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = '#64748b';
                                  e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <motion.button 
                              whileHover={{ scale: 1.1 }} 
                              whileTap={{ scale: 0.9 }} 
                              onClick={() => setDeleteConfirm(beneficiary._id)}
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 150ms'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                              }}
                            >
                              <Trash2 style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                            </motion.button>
                          )}
                        </div>
                        
                        <h4 style={{ 
                          fontSize: '18px', 
                          fontWeight: 700, 
                          color: 'var(--text-primary)', 
                          marginBottom: '8px' 
                        }}>
                          {beneficiary.name}
                        </h4>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          fontSize: '14px', 
                          color: 'var(--text-muted)', 
                          marginBottom: '16px' 
                        }}>
                          <Mail style={{ width: '16px', height: '16px' }} /> 
                          {beneficiary.email}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px', 
                          paddingTop: '16px', 
                          borderTop: '1px solid rgba(255,255,255,0.04)' 
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--text-muted)', 
                              textTransform: 'capitalize',
                              fontWeight: 500
                            }}>
                              {beneficiary.relationship}
                            </span>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 600, 
                              color: '#22c55e', 
                              background: 'rgba(34, 197, 94, 0.1)', 
                              border: '1px solid rgba(34, 197, 94, 0.2)', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px' 
                            }}>
                              {beneficiary.accessLevel === 'full' ? <Crown style={{ width: 12, height: 12 }} /> : <Key style={{ width: 12, height: 12 }} />}
                              {beneficiary.accessLevel.toUpperCase()}
                            </span>
                          </div>
                          {/* SECURITY LAYER 5: Portal Access Status */}
                          <div style={{
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255,255,255,0.04)'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px'
                            }}>
                              <span style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                fontWeight: 500
                              }}>
                                <Lock style={{ width: '12px', height: '12px', marginRight: '4px', display: 'inline-block' }} />
                                Portal Access
                              </span>
                              {portalStatuses?.[beneficiary._id]?.hasAccess ? (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: portalStatuses[beneficiary._id].isRevoked ? '#ff4d6d' : '#00e5a0',
                                  background: portalStatuses[beneficiary._id].isRevoked ? 'rgba(255,77,109,0.1)' : 'rgba(0,229,160,0.1)',
                                  border: portalStatuses[beneficiary._id].isRevoked ? '1px solid rgba(255,77,109,0.2)' : '1px solid rgba(0,229,160,0.2)',
                                  padding: '4px 10px',
                                  borderRadius: '6px'
                                }}>
                                  {portalStatuses[beneficiary._id].isRevoked ? 'Revoked' : 'Active'}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  background: 'rgba(100,116,139,0.1)',
                                  border: '1px solid rgba(100,116,139,0.2)',
                                  padding: '4px 10px',
                                  borderRadius: '6px'
                                }}>
                                  Not Activated
                                </span>
                              )}
                            </div>

                            {portalStatuses?.[beneficiary._id]?.hasAccess && !portalStatuses[beneficiary._id].isRevoked && (
                              <div style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                marginBottom: '12px'
                              }}>
                                <div>Accessed: {portalStatuses[beneficiary._id].accessCount || 0} time(s)</div>
                                {portalStatuses[beneficiary._id].lastAccessed && (
                                  <div>Last: {new Date(portalStatuses[beneficiary._id].lastAccessed).toLocaleDateString()}</div>
                                )}
                                <div>Expires: {new Date(portalStatuses[beneficiary._id].expiresAt).toLocaleDateString()}</div>
                              </div>
                            )}

                            {/* SECURITY LAYER 5: Revoke/Resend Buttons */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {portalStatuses?.[beneficiary._id]?.hasAccess && !portalStatuses[beneficiary._id].isRevoked ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => revokePortalMutation.mutate(beneficiary._id)}
                                  disabled={revokePortalMutation.isPending}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,77,109,0.2)',
                                    background: 'rgba(255,77,109,0.1)',
                                    color: '#ff4d6d',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: revokePortalMutation.isPending ? 'not-allowed' : 'pointer',
                                    transition: 'all 150ms'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!revokePortalMutation.isPending) {
                                      e.target.style.background = 'rgba(255,77,109,0.2)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255,77,109,0.1)';
                                  }}
                                >
                                  {revokePortalMutation.isPending ? 'Revoking...' : 'Revoke Access'}
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => resendPortalMutation.mutate(beneficiary._id)}
                                  disabled={resendPortalMutation.isPending}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(79,158,255,0.2)',
                                    background: 'rgba(79,158,255,0.1)',
                                    color: '#4f9eff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: resendPortalMutation.isPending ? 'not-allowed' : 'pointer',
                                    transition: 'all 150ms'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!resendPortalMutation.isPending) {
                                      e.target.style.background = 'rgba(79,158,255,0.2)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(79,158,255,0.1)';
                                  }}
                                >
                                  {resendPortalMutation.isPending ? 'Sending...' : (
                                    <>
                                      <RefreshCw style={{ width: '12px', height: '12px', marginRight: '4px', display: 'inline-block' }} />
                                      Resend Link
                                    </>
                                  )}
                                </motion.button>
                              )}
                            </div>
                          </div>
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
    </DashboardLayout>
  );
};

export default Beneficiaries;
