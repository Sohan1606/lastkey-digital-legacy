import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { initSocket } from '../socket';
import { 
  Users, Lock, Clock, Sparkles, Zap, Award, BarChart3,
  Loader2 
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
    message: user?.triggerStatus === 'active' ? '✅ Active & Secure' : 'DMS Status Update'
  });

  // Sync initial state when user loads
  useEffect(() => {
    if (user) {
      setDmsStatus({
        status: user.triggerStatus,
        remainingMinutes: user.inactivityDuration, // Simple fallback
        message: user.triggerStatus === 'active' ? '✅ Active & Secure' : 'DMS Status Update'
      });
    }
  }, [user]);

  const isPremium = !!user?.isPremium;

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
      {/* DMS Status Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm bg-white/70 mb-8 max-w-2xl mx-auto text-center ${
          isPremium ? 'ring-4 ring-emerald-200' : ''
        }`}
      >
        <div className={`bg-gradient-to-r ${getStatusStyle(dmsStatus.status)} p-4 rounded-xl mb-4 inline-flex items-center gap-2`}>
          <div className={`w-3 h-3 rounded-full ${dmsStatus.status === 'warning' || dmsStatus.status === 'triggered' ? 'animate-ping' : ''}`} />
          <h2 className="font-bold text-xl text-white capitalize">{dmsStatus.status} Status</h2>
        </div>
        <div className="space-y-2">
          <p className="text-5xl font-mono font-bold text-gray-800">
            {dmsStatus.remainingMinutes > 0 ? dmsStatus.remainingMinutes : 0} <span className="text-3xl">min</span>
          </p>
          <p className="text-sm text-gray-600">{dmsStatus.message}</p>
          {isPremium && (
            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
              <Award className="w-4 h-4" />
              Premium Member
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Suggestions Grid */}
      <div className="max-w-6xl mx-auto">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};

export default Dashboard;
