import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  Shield, 
  Clock, 
  Mic, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ActivityFeed = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [localActivities, setLocalActivities] = useState([]);

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/user/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    enabled: !!user && !!token,
  });

  // Fall back to API data, or use local state if available
  const activities = activityData || localActivities;

  const getActivityIcon = (activity) => {
    const iconMap = {
      vault: Shield,
      beneficiary: Users,
      capsule: Clock,
    };
    const Icon = iconMap[activity.type] || Heart;
    const colorClasses = {
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-pink-500',
      yellow: 'from-yellow-500 to-orange-500',
      blue: 'from-blue-500 to-indigo-500',
      indigo: 'from-indigo-500 to-purple-500'
    };

    return (
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[activity.color]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    );
  };

  const removeActivity = (id) => {
    setLocalActivities(prev => prev.filter(activity => activity.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Recent Activity</h3>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ion)'; e.currentTarget.style.background = 'rgba(79,158,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-1)'; }}
        >
          View All
        </motion.button>
      </div>

      {/* Activity List */}
      <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {activities.map((activity, i) => (
            <motion.div key={activity._id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, cursor: 'pointer', transition: 'all 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-1)'; }}
            >
              {getActivityIcon(activity)}
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{activity.title}</h4>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeActivity(activity._id)}
                    style={{ padding: 2, borderRadius: 6, cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <X size={12} color="var(--text-3)" />
                  </motion.button>
                </div>
                
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4 }}>{activity.title}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ion)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ion)'; e.currentTarget.style.background = 'rgba(79,158,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-1)'; }}
                  >
                    {activity.type}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--glass-1)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="var(--text-3)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 4px' }}>No recent activity</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Start building your legacy to see updates here</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
