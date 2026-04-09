import { motion } from 'framer-motion';
import { Shield, Activity, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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

  // Enhanced ping sound
  const playPingSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Create a more pleasant ping sound
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  // Generate insights from scoreData
  const insights = scoreData ? [
    scoreData.stats?.beneficiaries === 0 && {
      message: 'No loved ones added - no one will receive your legacy',
      color: 'red', type: 'action'
    },
    scoreData.stats?.beneficiaries > 0 && {
      message: `${scoreData.stats.beneficiaries} loved one(s) protected`,
      color: 'emerald', type: 'status'
    },
    scoreData.stats?.capsules === 0 && {
      message: 'Create your first Time Letter - say what matters most',
      color: 'yellow', type: 'action'
    },
    scoreData.stats?.capsules > 0 && {
      message: `${scoreData.stats.capsules} time letter(s) ready to deliver`,
      color: 'blue', type: 'status'
    },
    scoreData.stats?.assets === 0 && {
      message: 'Vault is empty - secure your digital accounts',
      color: 'red', type: 'action'
    },
  ].filter(Boolean) : [];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Guardian Protocol Status */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}
      >
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.15),transparent)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.12),transparent)', filter: 'blur(30px)' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dmsStatus.status === 'warning' || dmsStatus.status === 'triggered' ? 'var(--danger)' : 'var(--pulse)', animation: dmsStatus.status === 'warning' || dmsStatus.status === 'triggered' ? 'dotPulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Guardian Protocol</span>
          </div>
          {isPremium && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: 10, padding: '3px 8px' }}>
              <Zap size={11} color="var(--pulse)" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pulse)' }}>Premium</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: dmsStatus.status === 'active' ? 'rgba(0,229,160,0.12)' : dmsStatus.status === 'warning' ? 'rgba(255,184,48,0.12)' : 'rgba(255,77,109,0.12)', border: dmsStatus.status === 'active' ? '1px solid rgba(0,229,160,0.25)' : dmsStatus.status === 'warning' ? '1px solid rgba(255,184,48,0.25)' : '1px solid rgba(255,77,109,0.25)', borderRadius: 12, padding: '8px 14px', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {getStatusIcon(dmsStatus.status)}
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: dmsStatus.status === 'active' ? 'var(--pulse)' : dmsStatus.status === 'warning' ? 'var(--amber)' : 'var(--danger)' }}>{dmsStatus.status}</span>
        </div>

        {/* Time */}
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 32, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f0f4ff', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {formatTime(Math.max(0, dmsStatus.remainingMinutes || 0))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {dmsStatus.status === 'active' ? 'until next check-in required' : 'until protocol activates'}
          </p>
        </div>

        {/* Button */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { onPing(); playPingSound(); }}
          style={{ width: '100%', background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', zIndex: 1, boxShadow: 'var(--glow-ion)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(79,158,255,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--glow-ion)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Activity size={16} />
          I'm Here — Reset Timer
        </motion.button>
      </motion.div>

      {/* Legacy Health Score */}
      {scoreData && !scoreLoading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Legacy Health Score</h3>
            <div style={{ padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: getScoreColor(scoreData.score).background, color: getScoreColor(scoreData.score).color }}>
              {scoreData.score}/100
            </div>
          </div>

          {/* Progress Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 128, height: 128 }}>
              <svg style={{ width: 128, height: 128, transform: 'rotate(-90deg)' }}>
                <circle cx="64" cy="64" r="56" stroke="var(--glass-border)" strokeWidth="12" fill="none" />
                <motion.circle cx="64" cy="64" r="56" stroke="url(#gradient)" strokeWidth="12" fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - scoreData.score / 100)}`}
                  initial={{ strokeDashoffset: `${2 * Math.PI * 56}` }}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 56 * (1 - scoreData.score / 100)}` }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f9eff" />
                    <stop offset="100%" stopColor="#7c5cfc" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{scoreData.score}</span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                style={{ background: insight.type === 'action' ? 'rgba(79,158,255,0.08)' : insight.color === 'emerald' ? 'rgba(0,229,160,0.08)' : insight.color === 'blue' ? 'rgba(79,158,255,0.08)' : insight.color === 'yellow' ? 'rgba(255,184,48,0.08)' : 'rgba(255,77,109,0.08)', border: insight.type === 'action' ? '1px solid rgba(79,158,255,0.25)' : insight.color === 'emerald' ? '1px solid rgba(0,229,160,0.25)' : insight.color === 'blue' ? '1px solid rgba(79,158,255,0.25)' : insight.color === 'yellow' ? '1px solid rgba(255,184,48,0.25)' : '1px solid rgba(255,77,109,0.25)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {insight.type === 'action' && <Activity size={14} color="#4f9eff" />}
                  <span style={{ fontSize: 12, color: insight.type === 'action' ? '#4f9eff' : insight.color === 'emerald' ? '#00e5a0' : insight.color === 'blue' ? '#4f9eff' : insight.color === 'yellow' ? '#ffb830' : '#ff4d6d' }}>{insight.message}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{scoreData.stats?.beneficiaries || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Loved Ones</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{scoreData.stats?.capsules || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Time Letters</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{scoreData.stats?.assets || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Vault Items</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GuardianProtocolPanel;
