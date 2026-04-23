import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper to format time ago
const formatTimeAgo = (date) => {
  if (!date) return 'Unknown';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return 'Just now';
};

const GuardianProtocolPanel = ({ onPing, dmsStatus, isPremium, lastActive }) => {
  const [displayTime, setDisplayTime] = useState('');
  const [lastActiveText, setLastActiveText] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0); // 0=idle, 1=warning, 2=triggered, 3=done

  // Real-time countdown
  useEffect(() => {
    if (!dmsStatus.remainingMinutes && dmsStatus.remainingMinutes !== 0) return;
    
    let remaining = dmsStatus.remainingMinutes * 60; // convert to seconds
    
    const tick = () => {
      if (remaining <= 0) {
        setDisplayTime('Activating...');
        return;
      }
      const d = Math.floor(remaining / 86400);
      const h = Math.floor((remaining % 86400) / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      
      if (d > 0) setDisplayTime(`${d}d ${h}h ${m}m`);
      else if (h > 0) setDisplayTime(`${h}h ${m}m ${String(s).padStart(2,'0')}s`);
      else setDisplayTime(`${m}m ${String(s).padStart(2,'0')}s`);
      
      remaining--;
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dmsStatus.remainingMinutes]);

  // Update last active text
  useEffect(() => {
    if (lastActive) {
      setLastActiveText(formatTimeAgo(lastActive));
      const interval = setInterval(() => {
        setLastActiveText(formatTimeAgo(lastActive));
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [lastActive]);

  // Fetch legacy score data
  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['legacyScore'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/ai/legacy-score`);
      return data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Simulate inactivity demo
  const simulateInactivity = async () => {
    setSimulating(true);
    setSimStep(1);
    toast('⚠️ SIMULATION: Warning state triggered', { 
      duration: 3000, 
      style: { border: '1px solid #ffb830', background: 'rgba(255,184,48,0.1)' } 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    setSimStep(2);
    toast('🚨 SIMULATION: Protocol triggered — beneficiaries would be notified', { 
      duration: 4000, 
      style: { border: '1px solid #ff4d6d', background: 'rgba(255,77,109,0.1)' } 
    });
    
    await new Promise(r => setTimeout(r, 4000));
    setSimStep(3);
    toast('✅ SIMULATION COMPLETE — No real data was changed', { 
      duration: 3000, 
      style: { border: '1px solid #00e5a0', background: 'rgba(0,229,160,0.1)' } 
    });
    
    await new Promise(r => setTimeout(r, 2000));
    setSimulating(false);
    setSimStep(0);
  };

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
      return;
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'triggered': return <Shield className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { color: 'var(--pulse)', background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' };
    if (score >= 60) return { color: 'var(--ion)', background: 'rgba(79,158,255,0.12)', border: '1px solid rgba(79,158,255,0.25)' };
    if (score >= 40) return { color: 'var(--amber)', background: 'rgba(255,184,48,0.12)', border: '1px solid rgba(255,184,48,0.25)' };
    return { color: 'var(--danger)', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.25)' };
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
        style={{ 
          background: 'var(--glass-2)', 
          backdropFilter: 'blur(32px)', 
          border: simStep === 1 ? '2px solid #ffb830' : simStep === 2 ? '2px solid #ff4d6d' : '1px solid var(--glass-border)', 
          borderRadius: 20, 
          padding: 20, 
          position: 'relative', 
          overflow: 'hidden',
          transition: 'border-color 0.3s ease'
        }}
      >
        {/* Glow effects */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.15),transparent)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.12),transparent)', filter: 'blur(30px)' }} />

        {/* Simulation Overlay */}
        <AnimatePresence>
          {simStep > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: simStep === 1 ? 'rgba(255,184,48,0.15)' : simStep === 2 ? 'rgba(255,77,109,0.15)' : 'rgba(0,229,160,0.15)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: 20
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  textAlign: 'center',
                  padding: '20px 30px',
                  background: 'var(--glass-1)',
                  borderRadius: 16,
                  border: `2px solid ${simStep === 1 ? '#ffb830' : simStep === 2 ? '#ff4d6d' : '#00e5a0'}`
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {simStep === 1 ? '⚠️' : simStep === 2 ? '🚨' : '✅'}
                </div>
                <p style={{ 
                  fontSize: 14, 
                  fontWeight: 700, 
                  color: simStep === 1 ? '#ffb830' : simStep === 2 ? '#ff4d6d' : '#00e5a0',
                  margin: 0
                }}>
                  {simStep === 1 ? 'Warning: Inactivity detected' : simStep === 2 ? 'Triggered: Beneficiaries being notified...' : 'Simulation complete'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
            {displayTime || formatTime(Math.max(0, dmsStatus.remainingMinutes || 0))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {dmsStatus.status === 'active' ? 'until next check-in required' : 'until protocol activates'}
          </p>
          {lastActiveText && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Last active: {lastActiveText}
            </p>
          )}
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

        {/* Simulate Inactivity Button */}
        <motion.button 
          onClick={simulateInactivity} 
          disabled={simulating}
          whileHover={{ scale: simulating ? 1 : 1.02 }}
          whileTap={{ scale: simulating ? 1 : 0.98 }}
          style={{ 
            width: '100%', 
            marginTop: 10, 
            padding: '10px', 
            borderRadius: 12,
            border: '1px solid rgba(255,184,48,0.3)', 
            background: simulating ? 'rgba(255,184,48,0.15)' : 'rgba(255,184,48,0.08)',
            color: '#ffb830', 
            fontSize: 13, 
            fontWeight: 600, 
            cursor: simulating ? 'not-allowed' : 'pointer',
            opacity: simulating ? 0.7 : 1,
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: 1
          }}
        >
          {simulating ? '⏳ Simulating...' : '🧪 Simulate Inactivity (Demo)'}
        </motion.button>
        <p style={{ 
          fontSize: 10, 
          color: 'var(--text-3)', 
          textAlign: 'center', 
          margin: '8px 0 0 0',
          position: 'relative',
          zIndex: 1
        }}>
          Demo only — does not affect your real data or notify anyone.
        </p>
      </motion.div>

      {/* Legacy Health Score */}
      {scoreData && !scoreLoading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Legacy Health Score</h3>
            <div style={{ padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: getScoreColor(scoreData.score).background, color: getScoreColor(scoreData.score).color, border: getScoreColor(scoreData.score).border }}>
              {scoreData.score}/100
            </div>
          </div>

          {/* Progress Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 128, height: 128 }}>
              <svg style={{ width: 128, height: 128, transform: 'rotate(-90deg)' }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f9eff" />
                    <stop offset="100%" stopColor="#7c5cfc" />
                  </linearGradient>
                </defs>

                {/* Background circle */}
                <circle cx="64" cy="64" r="56" stroke="var(--glass-border)" strokeWidth="12" fill="none" />

                {/* Progress circle */}
                <circle 
                  cx="64" cy="64" r="56"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 56 * 
                    (1 - (scoreData?.score || 0) / 100)
                  }`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
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
