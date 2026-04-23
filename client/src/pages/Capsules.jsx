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
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Capsules = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="stars" />
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', marginTop: 16, fontSize: 14 }}>Retrieving your time capsules...</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--bg-base)'
      }}>
        {/* PAGE HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79,158,255,0.15), rgba(167,139,250,0.15))',
              border: '1px solid rgba(79,158,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              ⏳
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Time Capsules
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0'
              }}>
                Preserve messages for the future
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
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
            ⚡ Create Trigger
          </button>
        </div>

        {/* PAGE CONTENT - Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column - Create Form (40%) */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}>
                Create Capsule
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What's inside?"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Unlock Date
                  </label>
                  <input
                    type="date"
                    value={formData.unlockAt}
                    onChange={e => setFormData({ ...formData, unlockAt: e.target.value })}
                    min={minDate}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      colorScheme: 'dark',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Your message to the future..."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: '1.6',
                      minHeight: '150px'
                    }}
                    maxLength={500}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    textAlign: 'right'
                  }}>
                    {formData.message.length}/500
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !formData.title.trim() || !formData.unlockAt || !formData.message.trim()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: createMutation.isPending || !formData.title.trim() || !formData.unlockAt || !formData.message.trim()
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: createMutation.isPending || !formData.title.trim() || !formData.unlockAt || !formData.message.trim() ? 0.5 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Capsule'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Capsules List (60%) */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}>
                Your Capsules ({capsules?.length || 0})
              </h2>

              {!capsules || capsules.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }}>⏳</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    No capsules yet
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    marginBottom: '24px',
                    maxWidth: '320px',
                    margin: '0 auto 24px'
                  }}>
                    Create your first time capsule to preserve memories for the future
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {capsules.map((capsule, index) => {
                    const isUnlocked = new Date(capsule.unlockAt) <= new Date();
                    return (
                      <div
                        key={capsule._id}
                        style={{
                          background: 'var(--bg-base)',
                          border: `1px solid ${isUnlocked ? 'rgba(0,229,160,0.2)' : 'var(--border)'}`,
                          borderRadius: '16px',
                          padding: '20px',
                          marginBottom: '12px',
                          transition: 'border-color 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = isUnlocked ? 'rgba(0,229,160,0.2)' : 'var(--border)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '24px' }}>⏳</span>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              marginBottom: '4px'
                            }}>
                              {capsule.title}
                            </h3>
                            <p style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)'
                            }}>
                              Unlocks: {new Date(capsule.unlockAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: isUnlocked ? '#00e5a0' : '#4f9eff',
                            background: isUnlocked ? 'rgba(0,229,160,0.1)' : 'rgba(79,158,255,0.1)',
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            {isUnlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6',
                          marginBottom: '12px'
                        }}>
                          {capsule.message.substring(0, 100)}...
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {isUnlocked && (
                            <button
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(0,229,160,0.08)',
                                border: '1px solid rgba(0,229,160,0.2)',
                                borderRadius: '8px',
                                color: '#00e5a0',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              👁 View
                            </button>
                          )}
                          {deleteConfirm === capsule._id ? (
                            <>
                              <button
                                onClick={() => { deleteMutation.mutate(capsule._id); setDeleteConfirm(null); }}
                                style={{
                                  padding: '8px 16px',
                                  background: 'rgba(255,77,109,0.1)',
                                  border: '1px solid rgba(255,77,109,0.3)',
                                  borderRadius: '8px',
                                  color: '#ff4d6d',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: '8px 16px',
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  color: 'var(--text-secondary)',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(capsule._id)}
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(255,77,109,0.08)',
                                border: '1px solid rgba(255,77,109,0.2)',
                                borderRadius: '8px',
                                color: '#ff4d6d',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Capsules;
