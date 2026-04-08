import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Heart, Star, MapPin, Camera, Edit, Trash2, Clock, Award, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const LifeTimeline = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
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
    if (window.confirm('Delete this life event?')) {
      deleteEventMutation.mutate(id);
    }
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
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #4f9eff30, #7c5cfc30)', border: '1px solid rgba(79,158,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar style={{ width: 22, height: 22, color: 'var(--ion)' }} />
            </div>
            <div>
              <h1 className="display" style={{ fontSize: 28 }}>Life Timeline</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Document your journey, celebrate milestones</p>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleAddEvent}
          style={{ marginTop: 24, width: '100%', padding: '16px 24px', borderRadius: 14, border: '1px dashed rgba(79,158,255,0.3)', background: 'rgba(79,158,255,0.04)', color: 'var(--ion)', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.22s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,158,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(79,158,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,158,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(79,158,255,0.3)'; }}
        >
          <Plus style={{ width: 18, height: 18 }} />
          Add Life Event
        </motion.button>

        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(3,5,8,0.85)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--deep)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
                  {editingEvent ? 'Edit Life Event' : 'Add Life Event'}
                </h2>
                <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 4 }}>
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label>Event Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Milestone or memory title..." required />
                </div>
                <div>
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div>
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Location (Optional)</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Where did this happen?" />
                </div>
                <div>
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Share the story..." style={{ height: 100, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    disabled={addEventMutation.isPending || updateEventMutation.isPending}
                    style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 700, fontSize: 14, cursor: addEventMutation.isPending || updateEventMutation.isPending ? 'not-allowed' : 'pointer', opacity: addEventMutation.isPending || updateEventMutation.isPending ? 0.6 : 1 }}>
                    {addEventMutation.isPending || updateEventMutation.isPending ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
                  </motion.button>
                  <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCancel}
                    style={{ flex: 1, padding: '14px 24px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-1)', color: 'var(--text-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {!isLoading && sortedEvents.length > 0 && (
          <div style={{ position: 'relative', marginTop: 40 }}>
            <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, rgba(79,158,255,0.4), rgba(124,92,252,0.2), transparent)', borderRadius: 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sortedEvents.map((event, index) => {
                const cat = categories.find(c => c.id === event.category) || categories[0];
                const CatIcon = cat.icon;
                return (
                  <motion.div key={event._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
                    style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cat.color}15`, border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                      <CatIcon style={{ width: 20, height: 20, color: cat.color }} />
                    </div>
                    <div style={{ flex: 1, background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.22s' }}
                      onClick={() => handleEditEvent(event)}
                      onMouseEnter={e => { e.currentTarget.style.background = `${cat.color}08`; e.currentTarget.style.borderColor = `${cat.color}30`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-1)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{event.title}</h3>
                        <span style={{ fontSize: 11, fontWeight: 600, color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}25`, borderRadius: 8, padding: '2px 8px' }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', marginBottom: event.location ? 6 : 0 }}>
                        <Clock style={{ width: 13, height: 13 }} />
                        {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      {event.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                          <MapPin style={{ width: 13, height: 13 }} />
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>{event.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                          style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(79,158,255,0.2)', background: 'rgba(79,158,255,0.08)', color: 'var(--ion)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Edit style={{ width: 13, height: 13 }} /> Edit
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }}
                          style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.08)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Trash2 style={{ width: 13, height: 13 }} /> Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && sortedEvents.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '60px 20px', marginTop: 40, background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 24 }}>
            <Calendar style={{ width: 48, height: 48, color: 'var(--text-3)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Your Timeline Awaits</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>Document milestones, achievements, and precious memories that tell your unique story.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleAddEvent}
              style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 16, height: 16 }} /> Start Your Journey
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LifeTimeline;
