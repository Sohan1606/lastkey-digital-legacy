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
    const colorMap = {
      blue: 'linear-gradient(135deg, #4f9eff, #0066cc)',
      green: 'linear-gradient(135deg, #00e5a0, #00b87a)',
      purple: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
      vault: 'linear-gradient(135deg, #4f9eff, #0066cc)',
      beneficiary: 'linear-gradient(135deg, #00e5a0, #00b87a)',
      capsule: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
    };
    const bg = colorMap[activity.color] || colorMap[activity.type] || 'linear-gradient(135deg, #8899bb, #445577)';

    return (
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: 'white' }} />
      </div>
    );
  };

  const removeActivity = (id) => {
    setLocalActivities(prev => prev.filter(activity => activity.id !== id));
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Recent Activity</p>
      <div style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No activity yet</p>
          </div>
        ) : activities.map((activity, i) => (
          <motion.div key={activity._id || i}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10, transition: 'background 0.18s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {getActivityIcon(activity)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
