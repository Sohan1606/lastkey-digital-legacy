import { motion } from 'framer-motion';
import { Shield, Activity, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GuardianProtocolPanel = ({ onPing, dmsStatus, isPremium }) => {
  // Fetch legacy score data
  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['legacyScore'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/ai/legacy-score`);
      return data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'from-emerald-400 to-green-500 ring-emerald-200';
      case 'warning': return 'from-yellow-400 to-orange-500 ring-yellow-200 animate-pulse';
      case 'triggered': return 'from-red-400 to-rose-500 ring-red-200 animate-pulse';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'triggered': return <Shield className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTime = (minutes) => {
    if (minutes <= 0) return '0m';
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Guardian Protocol Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white"
      >
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                dmsStatus.status === 'warning' || dmsStatus.status === 'triggered' ? 'animate-ping' : ''
              } bg-current`} />
              <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Guardian Protocol
              </h2>
            </div>
            {isPremium && (
              <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Premium</span>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${getStatusColor(dmsStatus.status)} px-3 py-2 rounded-xl mb-4`}>
            {getStatusIcon(dmsStatus.status)}
            <span className="font-semibold capitalize">{dmsStatus.status}</span>
          </div>

          {/* Time Remaining */}
          <div className="mb-6">
            <div className="text-5xl font-black font-mono tabular-nums">
              {formatTime(Math.max(0, dmsStatus.remainingMinutes || 0))}
            </div>
            <p className="text-slate-400 text-sm">
              {dmsStatus.status === 'active' ? 'until next check-in required' : 'until protocol activates'}
            </p>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <Activity className="w-5 h-5" />
            I'm Here — Reset Timer
          </motion.button>
        </div>
      </motion.div>

      {/* Legacy Health Score */}
      {scoreData && !scoreLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Legacy Health Score</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(scoreData.score)}`}>
              {scoreData.score}/100
            </div>
          </div>

          {/* Progress Ring */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - scoreData.score / 100)}`}
                  initial={{ strokeDashoffset: `${2 * Math.PI * 56}` }}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 56 * (1 - scoreData.score / 100)}` }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{scoreData.score}</span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {scoreData.insights?.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`p-3 rounded-xl border ${
                  insight.type === 'action' ? 'border-indigo-200 bg-indigo-50' : 
                  insight.color === 'emerald' ? 'border-emerald-200 bg-emerald-50' :
                  insight.color === 'blue' ? 'border-blue-200 bg-blue-50' :
                  insight.color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                  'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {insight.type === 'action' && <Activity className="w-4 h-4 text-indigo-600" />}
                  <span className={`text-sm ${
                    insight.type === 'action' ? 'text-indigo-700' :
                    insight.color === 'emerald' ? 'text-emerald-700' :
                    insight.color === 'blue' ? 'text-blue-700' :
                    insight.color === 'yellow' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {insight.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{scoreData.stats?.beneficiaries || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Loved Ones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{scoreData.stats?.capsules || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Time Letters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{scoreData.stats?.assets || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Vault Items</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GuardianProtocolPanel;
