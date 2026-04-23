import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Heart, Star, MapPin, Camera, Edit, Trash2, Clock, Award, X } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const LifeTimeline = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    category: 'milestone',
    location: '',
    photos: []
  });

  const { data: timelineEvents, isLoading } = useQuery({
    queryKey: ['timelineEvents'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const { data } = await axios.post(`${API_BASE}/timeline`, eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setShowAddEvent(false);
      setFormData({ title: '', date: '', description: '', category: 'milestone', location: '', photos: [] });
      toast.success('Life event added!');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: () => {
      toast.error('Failed to add event');
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }) => {
      const { data } = await axios.put(`${API_BASE}/timeline/${id}`, eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setEditingEvent(null);
      setShowAddEvent(false);
      setFormData({ title: '', date: '', description: '', category: 'milestone', location: '', photos: [] });
      toast.success('Event updated!');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update event');
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_BASE}/timeline/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      toast.success('Event removed');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: (error) => {
      toast.error('Failed to delete event');
    }
  });

  const handleAddEvent = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'milestone',
      location: '',
      photos: []
    });
    setEditingEvent(null);
    setShowAddEvent(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description || '',
      category: event.category || 'milestone',
      location: event.location || '',
      photos: event.photos || []
    });
    setShowAddEvent(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      toast.error('Title and date are required');
      return;
    }
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent._id, eventData: formData });
    } else {
      addEventMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id) => {
    deleteEventMutation.mutate(id);
    setDeleteConfirm(null);
  };

  const categories = [
    { id: 'milestone', name: 'Milestone', color: '#4f9eff', icon: Star },
    { id: 'achievement', name: 'Achievement', color: '#00e5a0', icon: Award },
    { id: 'memory', name: 'Memory', color: '#7c5cfc', icon: Heart },
    { id: 'travel', name: 'Travel', color: '#ffb830', icon: MapPin },
    { id: 'family', name: 'Family', color: '#ff4d6d', icon: Camera }
  ];

  const sortedEvents = timelineEvents?.sort((a, b) => new Date(a.date) - new Date(b.date)) || [];

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
              📅
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Life Timeline
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0'
              }}>
                Document your journey, celebrate milestones
              </p>
            </div>
          </div>

          <button
            onClick={handleAddEvent}
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
            📅 Add Event
          </button>
        </div>

        {/* PAGE CONTENT - Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column - Add Event Form (40%) */}
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
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Milestone or memory title..."
                    required
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
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
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
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                  >
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where did this happen?"
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Share the story..."
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
                      minHeight: '120px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={addEventMutation.isPending || updateEventMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: addEventMutation.isPending || updateEventMutation.isPending
                        ? 'not-allowed'
                        : 'pointer',
                      opacity: addEventMutation.isPending || updateEventMutation.isPending ? 0.5 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {addEventMutation.isPending || updateEventMutation.isPending ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
                  </button>
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      style={{
                        padding: '12px 20px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Timeline (60%) */}
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
                Your Timeline ({sortedEvents.length})
              </h2>

              {!isLoading && sortedEvents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }}>📅</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    No events yet
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    marginBottom: '24px',
                    maxWidth: '320px',
                    margin: '0 auto 24px'
                  }}>
                    Document milestones, achievements, and precious memories that tell your unique story
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedEvents.map((event, index) => {
                    const cat = categories.find(c => c.id === event.category) || categories[0];
                    return (
                      <div
                        key={event._id}
                        style={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '20px',
                          marginBottom: '12px',
                          transition: 'border-color 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '24px' }}>
                            {cat.id === 'milestone' ? '⭐' : 
                             cat.id === 'achievement' ? '🏆' :
                             cat.id === 'memory' ? '💙' :
                             cat.id === 'travel' ? '🌍' : '📸'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              marginBottom: '4px'
                            }}>
                              {event.title}
                            </h3>
                            <p style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)'
                            }}>
                              {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: cat.color,
                            background: `${cat.color}15`,
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            {cat.name}
                          </span>
                        </div>

                        {event.location && (
                          <p style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            📍 {event.location}
                          </p>
                        )}

                        {event.description && (
                          <p style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6',
                            marginBottom: '12px'
                          }}>
                            {event.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleEditEvent(event)}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-secondary)',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            ✏ Edit
                          </button>
                          {deleteConfirm === event._id ? (
                            <>
                              <button
                                onClick={() => handleDeleteEvent(event._id)}
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
                              onClick={() => setDeleteConfirm(event._id)}
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

export default LifeTimeline;
