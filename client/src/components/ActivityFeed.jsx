import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const { theme } = useTheme();

  // Mock activities - in real app, this would come from API
  useEffect(() => {
    const mockActivities = [
      {
        id: 1,
        type: 'achievement',
        title: 'Guardian Protocol Activated',
        description: 'Your Guardian Protocol is now active and monitoring',
        icon: Shield,
        color: 'green',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        action: 'View Status'
      },
      {
        id: 2,
        type: 'creation',
        title: 'New Voice Message Created',
        description: 'Created a voice message for Sarah',
        icon: Mic,
        color: 'purple',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        action: 'Listen Now'
      },
      {
        id: 3,
        type: 'milestone',
        title: '7-Day Streak Achieved!',
        description: 'You\'ve maintained a 7-day login streak',
        icon: Trophy,
        color: 'yellow',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        action: 'View Achievements'
      },
      {
        id: 4,
        type: 'reminder',
        title: 'Time Capsule Released',
        description: 'Your "Future Self" capsule is now available',
        icon: Clock,
        color: 'blue',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        action: 'Open Capsule'
      },
      {
        id: 5,
        type: 'social',
        title: 'New Beneficiary Added',
        description: 'Added John Doe as a beneficiary',
        icon: Users,
        color: 'indigo',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        action: 'View Beneficiaries'
      }
    ];
    setActivities(mockActivities);
  }, []);

  const getActivityIcon = (activity) => {
    const Icon = activity.icon;
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
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl p-6 shadow-lg border ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Recent Activity
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`text-sm px-3 py-1 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          View All
        </motion.button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {getActivityIcon(activity)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium text-sm ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activity.title}
                  </h4>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeActivity(activity.id)}
                    className={`p-1 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </motion.button>
                </div>
                
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                } mb-2`}>
                  {activity.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {activity.action}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Zap className={`w-8 h-8 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          </div>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No recent activity
          </p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Start building your legacy to see updates here
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
