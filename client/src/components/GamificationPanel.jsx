import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, Target, Zap, Award, Calendar, Lock, Shield, Clock, BookOpen, Mic, Heart } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const GamificationPanel = () => {
  const { user, token } = useAuth();

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

  const allBadges = [
    { id: 'first_asset', name: 'First Asset', description: 'Added your first vault item', icon: Shield, color: '#4f9eff' },
    { id: 'first_beneficiary', name: 'Guardian', description: 'Added your first loved one', icon: Heart, color: '#00e5a0' },
    { id: 'first_capsule', name: 'Time Keeper', description: 'Created your first time capsule', icon: Clock, color: '#a78bfa' },
    { id: 'vault_master', name: 'Vault Master', description: 'Secured 5+ vault items', icon: Lock, color: '#ffb830' },
    { id: 'legacy_builder', name: 'Legacy Builder', description: 'Reached 500+ legacy score', icon: Trophy, color: '#ff4d6d' },
    { id: 'week_streak', name: 'Week Warrior', description: '7-day login streak', icon: Flame, color: '#ff6b6b' },
    { id: 'month_streak', name: 'Month Master', description: '30-day login streak', icon: Star, color: '#ffd93d' },
    { id: 'storyteller', name: 'Storyteller', description: 'Created memoir chapters', icon: BookOpen, color: '#6bcb77' },
    { id: 'voice_artist', name: 'Voice Artist', description: 'Created voice messages', icon: Mic, color: '#4d96ff' },
    { id: 'collector', name: 'Collector', description: 'Collected all achievements', icon: Award, color: '#9b59b6' },
  ];

  const getStreakColor = (days) => {
    if (days >= 30) return { bg: 'rgba(0,229,160,0.15)', border: 'rgba(0,229,160,0.3)', text: '#00e5a0' };
    if (days >= 14) return { bg: 'rgba(79,158,255,0.15)', border: 'rgba(79,158,255,0.3)', text: '#4f9eff' };
    if (days >= 7) return { bg: 'rgba(255,184,48,0.15)', border: 'rgba(255,184,48,0.3)', text: '#ffb830' };
    return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#8899bb' };
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: 'Legacy Novice',
      2: 'Guardian in Training',
      3: 'Legacy Protector',
      4: 'Memory Keeper',
      5: 'Legacy Legend'
    };
    return titles[level] || 'Digital Sage';
  };

  const getLevelGradientStyle = (level) => {
  const gradients = {
    1: 'linear-gradient(135deg, #8899bb, #556688)',
    2: 'linear-gradient(135deg, #00e5a0, #00b87a)',
    3: 'linear-gradient(135deg, #4f9eff, #0066cc)',
    4: 'linear-gradient(135deg, #7c5cfc, #5b3fc5)',
    5: 'linear-gradient(135deg, #ffb830, #ff8c00)',
  };
  return gradients[level] || gradients[1];
};

  if (isLoading) {
    return (
      <div className="page spatial-bg">
        <div className="stars" />
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(79,158,255,0.2)', borderTopColor: '#4f9eff' }}
          />
        </div>
      </div>
    );
  }

  const streakStyle = getStreakColor(gameData?.streak || 0);

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#ffb830,#ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,184,48,0.4)' }}>
              <Trophy size={22} color="white" />
            </div>
          </div>
          <h1 className="display" style={{ fontSize: 36, marginBottom: 12, background: 'linear-gradient(135deg,#ffb830,#ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Achievement Center
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto' }}>
            Track your legacy-building journey and unlock achievements
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {/* Legacy Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, gridColumn: 'span 1' }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legacy Score
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <svg style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" stroke="var(--glass-border)" strokeWidth="8" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="42"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - (gameData?.score || 0) / 100)}`}
                    initial={{ strokeDashoffset: `${2 * Math.PI * 42}` }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 42 * (1 - (gameData?.score || 0) / 100)}` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f9eff" />
                      <stop offset="100%" stopColor="#ffb830" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#f0f4ff' }}>{gameData?.score || 0}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 4 }}>of 100 points</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>{getLevelTitle(gameData?.level || 1)}</div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--glass-1)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Level {gameData?.level || 1}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{gameData?.progressToNextLevel || 0}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gameData?.progressToNextLevel || 0}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #4f9eff, #a78bfa)', borderRadius: 3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: `1px solid ${streakStyle.border}`, borderRadius: 24, padding: 28 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daily Streak
            </h3>
            
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: streakStyle.bg, border: `1px solid ${streakStyle.border}`, borderRadius: 16 }}>
                <Flame size={32} color={streakStyle.text} />
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: streakStyle.text, lineHeight: 1 }}>{gameData?.streak || 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>day streak</div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5 }}>
              {(gameData?.streak || 0) >= 7 
                ? "You're on fire! Keep the momentum going! 🔥"
                : (gameData?.streak || 0) >= 3
                  ? "Great progress! Stay consistent! 💪"
                  : "Check in daily to build your streak! 📅"
              }
            </p>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Stats
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Vault Items', value: gameData?.stats?.assets || 0, color: '#4f9eff', icon: Lock },
                { label: 'Loved Ones', value: gameData?.stats?.beneficiaries || 0, color: '#00e5a0', icon: Shield },
                { label: 'Time Capsules', value: gameData?.stats?.capsules || 0, color: '#a78bfa', icon: Clock },
              ].map((stat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--glass-1)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={18} color={stat.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ gridColumn: 'span 3', background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Trophy size={20} color="#ffb830" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff' }}>Achievements</h3>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)', background: 'var(--glass-1)', padding: '4px 10px', borderRadius: 8 }}>
                {gameData?.badges?.length || 0}/{allBadges.length} Unlocked
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {allBadges.map((badge, i) => {
                const isUnlocked = gameData?.badges?.includes(badge.id);
                const Icon = badge.icon;
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: isUnlocked ? `${badge.color}10` : 'var(--glass-1)',
                      border: `1px solid ${isUnlocked ? `${badge.color}30` : 'var(--glass-border)'}`,
                      opacity: isUnlocked ? 1 : 0.5,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {!isUnlocked && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,14,27,0.7)', borderRadius: 16 }}>
                        <Lock size={20} color="var(--text-3)" />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: 14, 
                        background: isUnlocked ? `${badge.color}20` : 'var(--glass-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isUnlocked ? `0 0 20px ${badge.color}30` : 'none'
                      }}>
                        <Icon size={24} color={isUnlocked ? badge.color : 'var(--text-3)'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isUnlocked ? '#f0f4ff' : 'var(--text-3)', marginBottom: 4 }}>
                          {badge.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>
                          {badge.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
