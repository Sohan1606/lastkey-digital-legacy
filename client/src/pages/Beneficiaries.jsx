import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Mail, Shield, Trash2, ArrowLeft, Heart, Briefcase, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Beneficiaries = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
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
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`${API_BASE}/beneficiaries/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => queryClient.invalidateQueries(['beneficiaries'])
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

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading your trusted circle...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 mb-8 transition-colors font-bold uppercase text-sm tracking-widest">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">Beneficiaries</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Nominate trusted individuals to manage your digital legacy.</p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Add Beneficiary Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 sticky top-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Contact</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Trusted person's name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="Their secure email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all outline-none appearance-none"
                    >
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Access Level</label>
                    <select
                      value={formData.accessLevel}
                      onChange={(e) => setFormData({...formData, accessLevel: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all outline-none appearance-none"
                    >
                      <option value="view">View Only</option>
                      <option value="full">Full Access</option>
                    </select>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-purple-500/20 transition-all disabled:opacity-50 mt-4"
                >
                  {createMutation.isPending ? 'Processing...' : 'Nominate Now'}
                </motion.button>
              </form>
            </div>
          </div>

          {/* Beneficiaries List */}
          <div className="lg:col-span-2">
            {(!beneficiaries || beneficiaries.length === 0) ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
                  <Users size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">No Beneficiaries Added</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
                  You haven't added anyone to your legacy plan yet. Your digital assets need a guardian.
                </p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {beneficiaries.map((beneficiary, idx) => {
                    const Icon = getRelationshipIcon(beneficiary.relationship);
                    return (
                      <motion.div 
                        key={beneficiary._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-8">
                          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon size={32} />
                          </div>
                          <button
                            onClick={() => {
                              if(window.confirm(`Remove ${beneficiary.name} from your legacy plan?`)) {
                                deleteMutation.mutate(beneficiary._id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} className="pointer-events-none" />
                          </button>
                        </div>

                        <h4 className="font-black text-2xl text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors">
                          {beneficiary.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-6 font-medium">
                          <Mail size={16} />
                          {beneficiary.email}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            {beneficiary.relationship}
                          </span>
                          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                            <Shield size={14} />
                            {beneficiary.accessLevel.toUpperCase()}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Beneficiaries;
