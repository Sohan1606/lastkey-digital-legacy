import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, Target, Zap, Award, Calendar, Lock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GamificationPanel = () => {
  const { user, token } = useAuth();

  // Fetch user gamification data
  const { data: gameData, isLoading } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/user/gamification`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token
  });

  const badges = [
    { id: 'first_beneficiary', name: 'Guardian', description: 'Added first beneficiary', icon: '🛡️', color: 'blue' },
    { id: 'first_capsule', name: 'Time Keeper', description: 'Created first time capsule', icon: '⏰', color: 'purple' },
    { id: 'week_streak', name: 'Consistent', description: '7-day login streak', icon: '🔥', color: 'orange' },
    { id: 'month_streak', name: 'Dedicated', description: '30-day login streak', icon: '💎', color: 'green' },
    { id: 'voice_pioneer', name: 'Voice Sage', description: 'Created 5 voice messages', icon: '🎤', color: 'indigo' },
    { id: 'memoir_author', name: 'Storyteller', description: 'Completed memoir chapter', icon: '📖', color: 'pink' },
    { id: 'vault_master', name: 'Vault Guardian', description: 'Secured 10+ vault items', icon: '🔐', color: 'yellow' },
    { id: 'legacy_builder', name: 'Legacy Architect', description: 'Legacy score above 80', icon: '🏛️', color: 'emerald' },
    { id: 'early_adopter', name: 'Innovator', description: 'Used all feature categories', icon: '🚀', color: 'purple' },
    { id: 'guardian_angel', name: 'Protection Angel', description: 'Emergency access used successfully', icon: '👼', color: 'cyan' }
  ];

  const getStreakColor = (days) => {
    if (days >= 30) return 'text-emerald-600 bg-emerald-100';
    if (days >= 14) return 'text-blue-600 bg-blue-100';
    if (days >= 7) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getProgressPercentage = (current, max) => {
    return Math.min((current / max) * 100, 100);
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'from-gray-400 to-gray-600',
      2: 'from-green-400 to-green-600', 
      3: 'from-blue-400 to-blue-600',
      4: 'from-purple-400 to-purple-600',
      5: 'from-orange-400 to-orange-600'
    };
    return colors[level] || colors[1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Achievement Center
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Celebrate your progress and unlock achievements as you build your digital legacy.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStreakColor(gameData?.streak || 0)}`}>
                <Flame className="w-6 h-6" />
                <div>
                  <div className="text-3xl font-bold">{gameData?.streak || 0}</div>
                  <div className="text-sm font-medium">day streak</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Keep it Going!</h3>
              <p className="text-gray-600">
                {gameData?.streak >= 7 
                  ? "Amazing consistency! You're on fire! 🔥" 
                  : gameData?.streak >= 3 
                    ? "Great job! Keep building your streak! 💪" 
                    : "Check in daily to maintain your streak! 📅"}
              </p>
            </div>
          </motion.div>

          {/* User Level */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legacy Builder Level</h3>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Level {gameData?.level || 1}</span>
                <span className="text-sm text-gray-500">{gameData?.experience || 0}/{gameData?.nextLevelExp || 100} XP</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-full bg-gradient-to-r ${getLevelColor(gameData?.level || 1)} rounded-full transition-all duration-500`}
                  style={{ width: `${getProgressPercentage(gameData?.experience || 0, gameData?.nextLevelExp || 100)}%` }}
                ></div>
              </div>
              
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-gray-900">{gameData?.level || 1}</span>
                <p className="text-sm text-gray-500">
                  {gameData?.level === 1 ? 'Legacy Novice' :
                   gameData?.level === 2 ? 'Guardian in Training' :
                   gameData?.level === 3 ? 'Legacy Protector' :
                   gameData?.level === 4 ? 'Master of Memories' :
                   gameData?.level === 5 ? 'Legacy Legend' : 'Digital Sage'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {badges.map((badge, index) => {
                const isUnlocked = gameData?.badges?.includes(badge.id);
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-gray-50 to-white border-gray-300 hover:shadow-lg hover:scale-105' 
                        : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`text-center ${!isUnlocked && 'grayscale'}`}>
                      <div className={`text-4xl mb-2 ${isUnlocked ? '' : 'filter blur-sm'}`}>
                        {badge.icon}
                      </div>
                      <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {badge.name}
                      </h4>
                      <p className={`text-xs ${isUnlocked ? 'text-gray-700' : 'text-gray-400'} mt-1`}>
                        {badge.description}
                      </p>
                    </div>
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
                        <div className="text-center text-white p-4">
                          <Lock className="w-8 h-8 mb-2" />
                          <p className="text-sm font-medium">Complete tasks to unlock</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Legacy Stats</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>Member Since</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {new Date(gameData?.memberSince || Date.now()).toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Target className="w-5 h-5" />
                  <span>Total Actions</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {gameData?.totalActions || 0}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Award className="w-5 h-5" />
                  <span>Legacy Score</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {gameData?.legacyScore || 0}/100
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Zap className="w-5 h-5" />
                  <span>Impact Points</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {gameData?.impactPoints || 0}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
