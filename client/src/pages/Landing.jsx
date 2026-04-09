import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Shield, Clock, Sparkles, Zap, Award, 
  Mic, Calendar, BookOpen, Trophy, Users,
  ArrowRight, CheckCircle, Star, MessageSquare, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 40 }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23,1,0.32,1] }}
          style={{ textAlign: 'center', maxWidth: 800, zIndex: 1 }}>
          
          {/* Floating Orbs */}
          <div style={{ position: 'absolute', top: -120, left: -80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.08),transparent)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: -100, right: -60, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.06),transparent)', filter: 'blur(50px)', animation: 'float 8s ease-in-out infinite' }} />

          <div style={{ marginBottom: 24 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ width: 60, height: 60, borderRadius: 15, background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-ion)' }}>
              <Shield size={24} color="white" />
            </motion.div>
          </div>

          <h1 className="display" style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, background: 'linear-gradient(135deg,#4f9eff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Your love, outliving you.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6, maxWidth: 540, margin: '0 auto 32px' }}>
            LastKey is your Digital Afterlife Platform. Preserve memories, protect assets, and send time‑locked messages to the people you love most.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleGetStarted}
              style={{ background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: 'var(--glow-ion)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(79,158,255,0.55)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--glow-ion)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get Started Free
              <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </motion.button>
            <Link to="/login" style={{ padding: '16px 24px', fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>Sign In</Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section style={{ padding: '40px 24px', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { number: '10,000+', label: 'Legacies Protected' },
            { number: '98.9%', label: 'Uptime Reliability' },
            { number: 'AES-256', label: 'Encryption Standard' },
            { number: '50+', label: 'Countries' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="display" style={{ fontSize: 28, color: 'var(--ion)', marginBottom: 4 }}>{stat.number}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="display" style={{ fontSize: 32, marginBottom: 12 }}>Everything you'd want them to remember</h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)' }}>One platform for your complete digital legacy</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {[
            { icon: MessageSquare, title: 'Time Capsules', desc: 'Send messages to the future. Your voice, wisdom, and love delivered exactly when they\'re needed most.' },
            { icon: Shield, title: 'Guardian Protocol', desc: 'Our dead‑man\'s switch ensures your loved ones are notified if you\'re inactive. Peace of mind for everyone.' },
            { icon: Heart, title: 'Beneficiary Vault', desc: 'Securely store passwords, documents, and digital assets. Your loved ones get access when the time comes.' },
            { icon: Mic, title: 'AI Voice Messages', desc: 'Create ultra‑realistic voice messages in your own tone. Surprise them with your voice, even when you\'re not here.' },
            { icon: BookOpen, title: 'Memoir AI', desc: 'Let AI help you write your life story. Beautiful chapters that capture your journey and legacy.' },
            { icon: Trophy, title: 'Legacy Score', desc: 'Gamified encouragement to build your legacy. Earn achievements and see your impact grow over time.' },
          ].map((feat, i) => (
            <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ion)'; e.currentTarget.style.background = 'rgba(79,158,255,0.08)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Glow effect */}
              <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.12),transparent)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              
              <feat.icon size={32} color="var(--ion)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff', marginBottom: 12 }}>{feat.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
          style={{ background: 'var(--glass-2)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '48px 32px', maxWidth: 600, margin: '0 auto' }}>
          <h2 className="display" style={{ fontSize: 28, marginBottom: 16 }}>Ready to preserve your legacy?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.5 }}>
            Join thousands who trust LastKey to protect what matters most. Start free, upgrade when you need more.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleGetStarted}
              style={{ background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: 'var(--glow-ion)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(79,158,255,0.55)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--glow-ion)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Your Legacy
              <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </motion.button>
            <Link to="/pricing" style={{ padding: '16px 24px', fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>View Plans</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;
