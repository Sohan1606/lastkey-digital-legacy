import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Lock, Unlock, Trash2, Send, ArrowLeft, Calendar, MessageSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Capsules = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/capsules/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => queryClient.invalidateQueries(['capsules'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, unlockAt: new Date(formData.unlockAt).toISOString() });
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Retrieving your time capsules...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 transition-colors font-bold uppercase text-sm tracking-widest">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">Time Capsules</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Send messages and assets to the future.</p>
            </div>
            {!showForm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
              >
                <Plus size={24} />
                Create Capsule
              </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Seal a New Capsule</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Capsule Title</label>
                    <input
                      type="text"
                      placeholder="e.g. For my daughter's 18th birthday"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Your Future Message</label>
                    <textarea
                      placeholder="What would you like to say?"
                      rows="5"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Unlock Date & Time</label>
                    <div className="relative">
                      <input 
                        type="datetime-local"
                        value={formData.unlockAt}
                        onChange={(e) => setFormData({...formData, unlockAt: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none"
                        min={new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,16)}
                        required
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Sealing...' : 'Seal Capsule Now'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
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
          {(!capsules || capsules.length === 0) ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-2 lg:col-span-3 text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
            >
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
                <Clock size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">No Time Capsules Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
                Your future self and loved ones are waiting. Schedule your first time-locked message today.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
              >
                Seal First Capsule
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {capsules.map((capsule, idx) => (
                <motion.div 
                  key={capsule._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl border transition-all relative overflow-hidden ${
                    capsule.isReleased 
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      capsule.isReleased 
                        ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {capsule.isReleased ? <Unlock size={28} /> : <Lock size={28} />}
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this time capsule? This cannot be undone.')) {
                          deleteMutation.mutate(capsule._id);
                        }
                      }}
                      className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} className="pointer-events-none" />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-emerald-600 transition-colors">
                    {capsule.title}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Calendar size={18} />
                      <span className="font-medium">
                        {capsule.isReleased ? 'Released on ' : 'Unlocks on '}
                        {format(new Date(capsule.isReleased ? capsule.releasedAt : capsule.unlockAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                      <MessageSquare size={18} className="mt-1" />
                      <p className="text-sm line-clamp-2 italic font-medium">
                        "{capsule.message}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      capsule.isReleased ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {capsule.isReleased ? 'Message Delivered' : 'Temporal Lock Active'}
                    </div>
                    {capsule.isReleased && <Send size={18} className="text-emerald-400" />}
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
