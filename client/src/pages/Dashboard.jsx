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
import LegacyTimeline from '../components/LegacyTimeline';
import LegacyReadinessScore from '../components/LegacyReadinessScore';
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
  const [dmsStatus, setDmsStatus] = useState({ status: 'active', remainingMinutes: 30 });
  const [isPremium, setIsPremium] = useState(false);

  // Fetch user stats and premium status
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/user/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Derive real DMS status from stats
  const [lastActive, setLastActive] = useState(null);
  
  useEffect(() => {
    if (stats?.data) {
      const { triggerStatus, inactivityDuration, lastActive: lastActiveRaw, isPremium: premium } = stats.data;
      const lastActiveDate = new Date(lastActiveRaw || Date.now());
      setLastActive(lastActiveRaw);
      const inactiveMs = Date.now() - lastActiveDate.getTime();
      const inactiveMinutes = Math.floor(inactiveMs / (1000 * 60));
      const remainingMinutes = Math.max(0, inactivityDuration - inactiveMinutes);

      setDmsStatus({ status: triggerStatus || 'active', remainingMinutes });
      setIsPremium(premium || false);
    }
  }, [stats]);

  // Fetch AI suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/ai/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch assets count
  const { data: assetsData } = useQuery({
    queryKey: ['assets-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch beneficiaries
  const { data: beneficiariesData } = useQuery({
    queryKey: ['beneficiaries-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/beneficiaries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch capsules count
  const { data: capsulesData } = useQuery({
    queryKey: ['capsules-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/capsules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch documents count
  const { data: documentsData } = useQuery({
    queryKey: ['documents-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/legal-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Extract suggestions array from data
  const suggestions = suggestionsData?.data || [];

  // Initialize socket and listen for DMS updates
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

  // Handle ping to reset DMS timer
  const handlePing = async () => {
    try {
      const res = await axios.post(`${API_BASE}/user/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDmsStatus({ status: res.data.user?.triggerStatus || 'active', remainingMinutes: res.data.user?.inactivityDuration || 30 });
      toast.success('✋ I\'m Here — Timer Reset', {
        icon: '👋',
        style: {
          background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
          color: 'white',
          border: 'none',
        }
      });
      
      // Play ping sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); 
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.35);
      } catch (_e) {
        return;
      }
    } catch (error) {
      toast.error('Failed to reset timer');
    }
  };

  const priorityColors = {
    critical: 'from-red-500 to-rose-500',
    high: 'from-orange-500 to-yellow-500',
    medium: 'from-blue-500 to-indigo-500',
    low: 'from-gray-500 to-gray-700'
  };

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="dashboard-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: 'clamp(240px, 25vw, 300px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── SIDEBAR ── */}
        <div className="dashboard-sidebar" style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <GuardianProtocolPanel dmsStatus={dmsStatus} onPing={handlePing} isPremium={isPremium} lastActive={lastActive} />
        </div>

        {/* ── MAIN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Welcome back</p>
            <h1 className="display" style={{ fontSize: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
              {user?.name?.split(' ')[0]}'s Legacy Hub
              {(user?.streak >= 3) && <span style={{ fontSize: 20, animation: 'float 3s ease-in-out infinite' }}>🔥</span>}
            </h1>
          </motion.div>

          {/* Legacy Readiness Score */}
          <LegacyReadinessScore 
            assetCount={assetsData?.data?.length || 0}
            beneficiaryCount={beneficiariesData?.data?.beneficiaries?.length || 0}
            enrolledBeneficiaryCount={beneficiariesData?.data?.beneficiaries?.filter(b => b.enrollmentStatus === 'enrolled').length || 0}
            capsuleCount={capsulesData?.data?.capsules?.length || 0}
            documentCount={documentsData?.data?.length || 0}
            vaultUnlocked={false}
          />

          {/* PRIMARY CTA — Send Final Message */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,109,0.12), rgba(124,92,252,0.12))',
              border: '1px solid rgba(255,77,109,0.25)',
              borderRadius: 20,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/final-message')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,77,109,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                Your most important action
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', margin: 0 }}>
                💌 Send Your Final Message
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>
                Write to your loved ones. Choose when they receive it.
              </p>
            </div>
            <div style={{ flexShrink: 0, background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#ff4d6d' }}>
              Start →
            </div>
          </motion.div>

          {/* Quick Access */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Quick Access</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Voice Messages', sub: 'AI-narrated farewell', path: '/voice-messages', color: '#7c5cfc', icon: '🎤' },
                { label: 'Life Timeline', sub: 'Your visual story', path: '/life-timeline', color: '#4f9eff', icon: '📅' },
                { label: 'Memoir AI', sub: 'Write your chapters', path: '/memoir-ai', color: '#00e5a0', icon: '📖' },
                { label: 'Emergency Access', sub: 'Beneficiary portal', path: '/emergency', color: '#ff4d6d', icon: '🛡️' },
                { label: 'Setup Guide', sub: 'Complete onboarding', path: '/onboarding', color: '#a78bfa', icon: '⚡' },
                { label: 'Activity Logs', sub: 'View your activity', path: '/activity-logs', color: '#4f9eff', icon: '📋' },
              ].map((item, i) => (
                <motion.button key={item.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.path)}
                  style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 15, padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + '45'; e.currentTarget.style.background = item.color + '08'; e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.35), 0 0 18px ${item.color}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.sub}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* What happens if I'm gone */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              What happens when you're gone
            </p>
            <LegacyTimeline dmsStatus={dmsStatus} />
          </div>

          {/* AI Suggestions + Activity Feed */}
          <div className="suggestions-feed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>AI Smart Suggestions</p>
              {suggestionsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.14)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pulse)', margin: '0 0 4px' }}>Perfect Setup!</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Your digital legacy is fully optimized.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map((s, i) => {
                    const c = { critical: '#ff4d6d', high: '#ffb830', medium: '#4f9eff', low: '#8899bb' }[s.priority] || '#8899bb';
                    return (
                      <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        whileHover={{ x: 4 }}
                        style={{ background: 'var(--glass-1)', backdropFilter: 'blur(20px)', borderRadius: 14, borderLeft: `3px solid ${c}`, border: `1px solid var(--glass-border)`, borderLeftColor: c, padding: '15px 18px', cursor: 'pointer', transition: 'all 0.22s' }}
                        onClick={() => navigate('/' + s.action)}
                        onMouseEnter={e => { e.currentTarget.style.background = c + '08'; e.currentTarget.style.borderColor = c + '35'; e.currentTarget.style.borderLeftColor = c; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass-1)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.borderLeftColor = c; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{s.title}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c, background: c + '18', border: `1px solid ${c}28`, borderRadius: 6, padding: '2px 7px', flexShrink: 0, marginLeft: 8 }}>{s.priority}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 10px', lineHeight: 1.55 }}>{s.description}</p>
                        <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>Take action →</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
