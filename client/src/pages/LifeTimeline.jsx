import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Heart, Star, MapPin, Camera, Edit, Trash2, Clock, Award } from 'lucide-react';
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

  // Fetch timeline events
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

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const { data } = await axios.post(`${API_BASE}/timeline`, eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setShowAddEvent(false);
      setFormData({
        title: '',
        date: '',
        description: '',
        category: 'milestone',
        location: '',
        photos: []
      });
      toast.success('Timeline event added successfully!');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: (error) => {
      console.error('Add timeline event error:', error);
      toast.error('Failed to add timeline event');
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }) => {
      const { data } = await axios.put(`${API_BASE}/timeline/${id}`, eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      setEditingEvent(null);
      setFormData({
        title: '',
        date: '',
        description: '',
        category: 'milestone',
        location: '',
        photos: []
      });
      toast.success('Timeline event updated successfully!');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: (error) => {
      console.error('Update timeline event error:', error);
      toast.error('Failed to update timeline event');
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_BASE}/timeline/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      toast.success('Timeline event deleted successfully!');
      queryClient.invalidateQueries(['timelineEvents']);
    },
    onError: (error) => {
      console.error('Delete timeline event error:', error);
      toast.error('Failed to delete timeline event');
    }
  });

  const handleAddEvent = () => {
    if (!showAddEvent) {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'milestone',
        location: '',
        photos: []
      });
      setShowAddEvent(true);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description,
      category: event.category,
      location: event.location,
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

    const eventData = {
      ...formData,
      photos: formData.photos
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent._id, eventData });
    } else {
      addEventMutation.mutate(eventData);
    }
  };

  const handleCancel = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      date: '',
      description: '',
      category: 'milestone',
      location: '',
      photos: []
    });
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm('Are you sure you want to delete this timeline event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const categories = [
    { id: 'milestone', name: 'Milestone', color: 'blue', icon: Star },
    { id: 'achievement', name: 'Achievement', color: 'green', icon: Award },
    { id: 'memory', name: 'Memory', color: 'purple', icon: Heart },
    { id: 'travel', name: 'Travel', color: 'orange', icon: MapPin },
    { id: 'family', name: 'Family', color: 'pink', icon: Camera }
  ];

  const sortedEvents = timelineEvents?.sort((a, b) => new Date(a.date) - new Date(b.date)) || [];

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Life Timeline
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Document your life's journey, celebrate milestones, and create a beautiful timeline that tells your story.
          </p>
        </motion.div>

        {/* Add Event Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEvent}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
          >
            <Plus className="w-6 h-6" />
            Add Life Event
          </motion.button>
        </motion.div>

        {/* Add/Edit Event Modal */}
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Life Event' : 'Add Life Event'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Give your event a meaningful title..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where did this happen?"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Share the story behind this moment..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-purple-200"></div>
          
          {/* Timeline Events */}
          <div className="space-y-8">
            {sortedEvents?.map((event, index) => {
              const category = categories.find(c => c.id === event.category);
              const isLeft = index % 2 === 0;
              
              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center ${isLeft ? 'flex-row-reverse' : ''}`}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute ${isLeft ? 'right-8' : 'left-8'} w-4 h-4 bg-white border-4 border-gray-300 rounded-full z-10`}></div>
                  
                  {/* Event Card */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 max-w-md cursor-pointer ${
                      isLeft ? 'mr-8' : 'ml-8'
                    }`}
                    onClick={() => handleEditEvent(event)}
                  >
                    {/* Category Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-white mb-4 bg-gradient-to-r ${
                      category.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      category.color === 'green' ? 'from-green-500 to-green-600' :
                      category.color === 'purple' ? 'from-purple-500 to-purple-600' :
                      category.color === 'orange' ? 'from-orange-500 to-orange-600' :
                      'from-pink-500 to-pink-600'
                    }`}>
                      <category.icon className="w-4 h-4" />
                      {category.name}
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {event.title}
                    </h3>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}

                    {/* Description */}
                    {event.description && (
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {event.description}
                      </p>
                    )}

                    {/* Photos */}
                    {event.photos && event.photos.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {event.photos.slice(0, 3).map((photo, photoIndex) => (
                          <div key={photoIndex} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <img 
                              src={photo} 
                              alt={`Event photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {event.photos.length > 3 && (
                          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                            +{event.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditEvent(event)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteEvent(event._id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {!isLoading && (!timelineEvents || timelineEvents.length === 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 max-w-2xl mx-auto"
            >
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Life Timeline is Empty</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start documenting your life's journey. Add milestones, achievements, and precious memories that tell your unique story.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Event
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LifeTimeline;
