import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Mail, Shield, Trash2, ArrowLeft, Heart, Briefcase, User, CheckCircle, Clock, AlertCircle, Send, Search, Filter, UserCheck, Crown, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Beneficiaries = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
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
    const map = { spouse: Heart, child: User, parent: User, sibling: User, friend: Users, lawyer: Briefcase, other: Shield };
    return map[rel] || Shield;
  };

  const relationshipColors = {
    spouse: '#ff4d6d', child: '#7c5cfc', parent: '#4f9eff',
    sibling: '#00e5a0', friend: '#ffb830', lawyer: '#8899bb', other: '#3d5070'
  };

  const getEnrollmentStatusIcon = (status) => {
    switch (status) {
      case 'enrolled': return <CheckCircle size={14} style={{ color: '#00e5a0' }} />;
      case 'invited': return <Clock size={14} style={{ color: '#ffb830' }} />;
      default: return <AlertCircle size={14} style={{ color: '#ff4d6d' }} />;
    }
  };

  const getEnrollmentStatusText = (status) => {
    switch (status) {
      case 'enrolled': return 'Enrolled';
      case 'invited': return 'Pending Enrollment';
      default: return 'Not Invited';
    }
  };

  const getEnrollmentStatusColor = (status) => {
    switch (status) {
      case 'enrolled': return '#00e5a0';
      case 'invited': return '#ffb830';
      default: return '#ff4d6d';
    }
  };

  // Calculate enrollment stats
  const enrolledCount = beneficiaries?.filter(b => b.enrollmentStatus === 'enrolled').length || 0;
  const totalCount = beneficiaries?.length || 0;
  const enrollmentComplete = enrolledCount === totalCount && totalCount > 0;

  if (isLoading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{
        marginLeft: '240px',
        minHeight: '100vh',
        background: '#030508',
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
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{
        marginLeft: '240px',
        minHeight: '100vh',
        background: '#030508',
        flex: 1,
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
                color: '#64748b',
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
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
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>
                  Beneficiaries
                </h1>
                <p style={{ fontSize: '16px', color: '#64748b' }}>
                  Trusted individuals to manage your legacy
                </p>
              </div>
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
                    background: '#050d1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
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
                color: '#64748b',
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
            
            {/* Enrollment Status Summary */}
            {totalCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  marginBottom: '32px',
                  padding: '16px 20px', 
                  background: enrollmentComplete ? 'rgba(0,229,160,0.1)' : 'rgba(255,184,48,0.1)', 
                  border: `1px solid ${enrollmentComplete ? 'rgba(0,229,160,0.3)' : 'rgba(255,184,48,0.3)'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {enrollmentComplete ? (
                  <CheckCircle size={24} style={{ color: '#00e5a0' }} />
                ) : (
                  <Clock size={24} style={{ color: '#ffb830' }} />
                )}
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: enrollmentComplete ? '#00e5a0' : '#ffb830' }}>
                    {enrollmentComplete 
                      ? 'All beneficiaries enrolled' 
                      : `${enrolledCount} of ${totalCount} beneficiaries enrolled`
                    }
                  </p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                    {enrollmentComplete 
                      ? 'Your legacy is ready for transfer when needed'
                      : 'Beneficiaries must complete enrollment to access your legacy'
                    }
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
                background: '#050d1a',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
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
                      background: '#030508',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
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
                      background: '#030508',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
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
                        background: '#030508',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
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
                        background: '#030508',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
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
                    color: '#ffffff', 
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
                    background: '#050d1a', 
                    backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(255,255,255,0.04)', 
                    borderRadius: '16px' 
                  }}
                >
                  <Users style={{ 
                    width: '64px', 
                    height: '64px', 
                    color: '#64748b', 
                    margin: '0 auto 24px' 
                  }} />
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: '#ffffff', 
                    marginBottom: '12px' 
                  }}>
                    No Beneficiaries Added
                  </h3>
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#64748b', 
                    maxWidth: '400px', 
                    margin: '0 auto' 
                  }}>
                    Your digital assets need a guardian. Add trusted contacts to your legacy plan.
                  </p>
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
                          background: '#050d1a',
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
                                  color: '#64748b',
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
                          color: '#ffffff', 
                          marginBottom: '8px' 
                        }}>
                          {beneficiary.name}
                        </h4>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          fontSize: '14px', 
                          color: '#64748b', 
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
                              color: '#64748b', 
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
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#64748b',
                              fontWeight: 500
                            }}>
                              Enrollment Status
                            </span>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 600, 
                              color: getEnrollmentStatusColor(beneficiary.enrollmentStatus), 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              background: `${getEnrollmentStatusColor(beneficiary.enrollmentStatus)}15`,
                              border: `1px solid ${getEnrollmentStatusColor(beneficiary.enrollmentStatus)}30`,
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              {getEnrollmentStatusIcon(beneficiary.enrollmentStatus)}
                              {getEnrollmentStatusText(beneficiary.enrollmentStatus)}
                            </span>
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
    </div>
  );
};

export default Beneficiaries;
