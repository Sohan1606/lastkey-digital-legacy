import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { initSocket } from '../socket';
import GuardianProtocolPanel from '../components/GuardianProtocolPanel';
import ActivityFeed from '../components/ActivityFeed';
import { 
  Users, Lock, Clock, Sparkles, Zap, Award, BarChart3,
  Loader2, Mic, Calendar, BookOpen, Trophy, Heart
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const IconDisplay = ({ iconName }) => {
  const icons = {
    users: Users,
    lock: Lock,
    clock: Clock,
    sparkles: Sparkles,
    zap: Zap,
    award: Award,
    chart: BarChart3
  };
  const Icon = icons[iconName] || Users;
  return <Icon className="w-5 h-5" />;
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dmsStatus, setDmsStatus] = useState({
    status: user?.triggerStatus || 'active',
    remainingMinutes: user?.inactivityDuration || 60,
    message: user?.triggerStatus === 'active' ? '✅ Active & Secure' : 'Guardian Protocol Status Update'
  });

  // Sync initial state when user loads
  useEffect(() => {
    if (user) {
      setDmsStatus({
        status: user.triggerStatus,
        remainingMinutes: user.inactivityDuration, // Simple fallback
        message: user.triggerStatus === 'active' ? '✅ Active & Secure' : 'Guardian Protocol Status Update'
      });
    }
  }, [user]);

  const isPremium = !!user?.isPremium;

  // Handle ping to reset Guardian Protocol timer
  const handlePing = async () => {
    try {
      await axios.post(`${API_BASE}/user/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setDmsStatus(prev => ({
        ...prev,
        status: 'active',
        remainingMinutes: user.inactivityDuration,
        message: '✅ Active & Secure'
      }));
      
      toast.success('Guardian Protocol reset! You\'re confirmed active.');
    } catch (error) {
      console.error('Ping error:', error);
      toast.error('Failed to reset timer. Please try again.');
    }
  };

  // 1. AI Suggestions Query
  const { data: suggestionsData, isPending: suggestionsLoading } = useQuery({
    queryKey: ['aiSuggestions'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/ai/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!user && !!token,
  });

  const suggestions = suggestionsData?.data || [];

  // 2. Socket.IO DMS Setup
  useEffect(() => {
    if (!user || !token) return;

    const socket = initSocket(user._id || user.id);

    const handleDMS = (data) => {
      setDmsStatus(data);
    };

    socket.on('dms-sync', handleDMS);
    socket.on('dms-update', handleDMS);

    return () => {
      socket.off('dms-sync', handleDMS);
      socket.off('dms-update', handleDMS);
    };
  }, [user, token]);

  // 4. Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'from-green-400 to-emerald-500 ring-green-200';
      case 'warning': return 'from-yellow-400 to-orange-500 ring-yellow-200 animate-pulse';
      case 'triggered': return 'from-red-400 to-rose-500 ring-red-200 animate-pulse';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const priorityColors = {
    critical: 'from-red-500 to-rose-500',
    high: 'from-orange-500 to-yellow-500',
    medium: 'from-blue-500 to-indigo-500',
    low: 'from-gray-500 to-gray-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-6 md:p-8">
      {/* Guardian Protocol Panel */}
      <GuardianProtocolPanel 
        dmsStatus={dmsStatus}
        onPing={handlePing}
        isPremium={isPremium}
      />

      {/* Quick Access Cards */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Quick Access
          </h1>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/voice-messages')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Voice Messages</h3>
                <p className="text-sm text-gray-500">Create AI voice messages</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/life-timeline')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Life Timeline</h3>
                <p className="text-sm text-gray-500">Document your journey</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/memoir-ai')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Memoir AI</h3>
                <p className="text-sm text-gray-500">Write your life story</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/gamification')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Achievements</h3>
                <p className="text-sm text-gray-500">View your progress</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/emergency')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Emergency Access</h3>
                <p className="text-sm text-gray-500">Beneficiary portal</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/onboarding')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Onboarding</h3>
                <p className="text-sm text-gray-500">Setup guide</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Two Column Layout for AI Suggestions and Activity Feed */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* AI Suggestions - 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Smart Suggestions
            </h1>
          </div>

          {suggestionsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
              <span className="text-lg font-semibold text-gray-700">Analyzing your legacy...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <motion.div 
              className="text-center py-20 bg-white/70 rounded-2xl backdrop-blur-sm border border-white/50 shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Perfect Setup! 🎉</h3>
              <p className="text-gray-500">Your digital legacy is fully secured and optimized. No immediate AI suggestions.</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {suggestions.map((suggestion, index) => {
                const priorityStyle = `bg-gradient-to-r ${priorityColors[suggestion.priority] || 'bg-gray-500'} px-3 py-1 rounded-full text-white text-xs font-bold inline-block mb-3`;

                return (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/50 group hover:border-indigo-200 transition-all cursor-pointer"
                  >
                    {/* Priority Badge */}
                    <div className={`px-3 py-1 rounded-full text-white text-xs font-bold inline-block mb-3 ${priorityColors[suggestion.priority] || 'bg-gray-500'}`}>
                      {suggestion.priority.toUpperCase()}
                    </div>

                    {/* Icon + Title */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${priorityColors[suggestion.priority] || 'bg-gray-200'} shadow-md`}>
                        <IconDisplay iconName={suggestion.icon} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-indigo-600 transition">
                          {suggestion.title}
                        </h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                          {suggestion.category}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      {suggestion.description}
                    </p>

                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all hover:from-indigo-700 hover:to-purple-800"
                      onClick={() => navigate(suggestion.action)}
                    >
                      Take Action Now →
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed - 1 column */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
