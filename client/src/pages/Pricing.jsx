import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Zap, Shield, Crown, Sparkles, ArrowRight, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null);
  const [annual, setAnnual] = useState(false);

  const handleSubscribe = async (tier) => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoadingTier(tier);
    
    try {
      const response = await axios.post(
        `${API_BASE}/payment/create-checkout-session`,
        { tier },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment service unavailable. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: Shield,
      monthlyPrice: 0,
      desc: 'Get started with the essentials',
      color: '#8899bb',
      glow: 'rgba(136,153,187,0.15)',
      features: [
        { text: '2 Beneficiaries', included: true },
        { text: '3 Time Capsules', included: true },
        { text: '5 Vault Items', included: true },
        { text: 'Guardian Protocol', included: true },
        { text: 'Email Alerts', included: true },
        { text: 'AI Voice Messages', included: false },
        { text: 'Life Timeline', included: false },
        { text: 'Memoir AI', included: false },
        { text: 'WhatsApp Alerts', included: false },
        { text: 'Priority Support', included: false },
      ],
      cta: 'Start Free',
      action: () => navigate(user ? '/dashboard' : '/register'),
    },
    {
      id: 'guardian',
      name: 'Guardian',
      icon: Crown,
      monthlyPrice: 4.99,
      desc: 'For families who take legacy seriously',
      color: '#4f9eff',
      glow: 'rgba(79,158,255,0.2)',
      popular: true,
      features: [
        { text: '5 Beneficiaries', included: true },
        { text: '20 Time Capsules', included: true },
        { text: '50 Vault Items', included: true },
        { text: 'Advanced Guardian Protocol', included: true },
        { text: 'Email + WhatsApp Alerts', included: true },
        { text: 'AI Voice Messages', included: false },
        { text: 'Life Timeline', included: false },
        { text: 'Memoir AI', included: false },
        { text: 'Crypto Vault', included: true },
        { text: 'Priority Support', included: false },
      ],
      cta: user ? 'Upgrade Now' : 'Start Free Trial',
      action: () => handleSubscribe('guardian'),
    },
    {
      id: 'legacy_pro',
      name: 'Legacy Pro',
      icon: Sparkles,
      monthlyPrice: 12.99,
      desc: 'The complete digital legacy solution',
      color: '#7c5cfc',
      glow: 'rgba(124,92,252,0.25)',
      featured: true,
      features: [
        { text: 'Unlimited Beneficiaries', included: true },
        { text: 'Unlimited Capsules', included: true },
        { text: 'Unlimited Vault Items', included: true },
        { text: 'Advanced Guardian Protocol', included: true },
        { text: 'All Alert Channels', included: true },
        { text: 'AI Voice Messages', included: true },
        { text: 'Life Timeline', included: true },
        { text: 'Memoir AI', included: true },
        { text: 'Crypto Vault', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: user ? 'Go Pro' : 'Start Free Trial',
      action: () => handleSubscribe('legacy_pro'),
    },
  ];

  const getPrice = (plan) => {
    if (plan.monthlyPrice === 0) return { display: '$0', sub: 'forever free' };
    const price = annual ? (plan.monthlyPrice * 10 / 12).toFixed(2) : plan.monthlyPrice;
    return { display: `$${price}`, sub: annual ? '/mo, billed annually' : '/month' };
  };

  const faqs = [
    { q: 'Can I change or cancel my plan anytime?', a: 'Yes. Upgrade, downgrade, or cancel at any time from your account settings. No lock-in contracts.' },
    { q: 'What happens to my data if I cancel?', a: 'Your data is preserved for 30 days after cancellation. You can export everything or reactivate within that window.' },
    { q: 'Is my payment information secure?', a: 'All payments are processed by Stripe — we never store your card details. Your financial data never touches our servers.' },
    { q: 'Do you offer a refund?', a: 'Yes — 30-day money-back guarantee on all paid plans, no questions asked.' },
    { q: 'How does the Guardian Protocol work?', a: 'You set an inactivity period. If you don’t check in within that time, we send warning alerts, then notify your beneficiaries with access to your legacy.' },
    { q: 'Can I store cryptocurrency credentials?', a: 'Yes. The vault supports seed phrases, private keys, exchange credentials, and more — all encrypted with AES-256.' },
  ];

  const allFeatures = [
    'Beneficiaries',
    'Time Capsules',
    'Vault Items',
    'Guardian Protocol',
    'Alert Channels',
    'AI Voice Messages',
    'Life Timeline',
    'Memoir AI',
    'Crypto Vault',
    'Priority Support',
  ];

  const featureIncluded = (plan, label) => plan.features.find(f => f.text === label)?.included;

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ paddingTop: 60 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
            <Sparkles size={14} color="var(--plasma)" />
            <span style={{ fontSize: 12, color: 'var(--plasma)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pricing</span>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 14, background: 'linear-gradient(135deg,#f0f4ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Choose Your Legacy Plan
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Start free. Your love deserves to be preserved perfectly — upgrade when you're ready.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '8px 16px' }}>
            <span style={{ fontSize: 13, color: annual ? 'var(--text-3)' : 'var(--text-1)', fontWeight: annual ? 400 : 600 }}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)}
              style={{ width: 44, height: 24, borderRadius: 12, background: annual ? 'var(--plasma)' : 'var(--glass-border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 }}>
              <motion.div animate={{ x: annual ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? 'var(--text-1)' : 'var(--text-3)', fontWeight: annual ? 600 : 400 }}>
              Annual <span style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)', color: 'var(--pulse)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, marginLeft: 4 }}>Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40, alignItems: 'start' }}>
          {plans.map((plan, i) => {
            const { display, sub } = getPrice(plan);
            const Icon = plan.icon;
            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{
                  background: plan.featured ? `linear-gradient(145deg, rgba(124,92,252,0.08), rgba(79,158,255,0.04))` : 'var(--glass-1)',
                  backdropFilter: 'blur(24px)',
                  border: `1px solid ${plan.featured ? 'rgba(124,92,252,0.4)' : plan.popular ? 'rgba(79,158,255,0.3)' : 'var(--glass-border)'}`,
                  borderRadius: 24,
                  padding: 32,
                  position: 'relative',
                  boxShadow: plan.featured ? `0 0 40px ${plan.glow}` : 'none',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${plan.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = plan.featured ? `0 0 40px ${plan.glow}` : 'none'; }}
              >
                {(plan.popular || plan.featured) && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.featured ? 'linear-gradient(135deg,#7c5cfc,#4f9eff)' : 'linear-gradient(135deg,#4f9eff,#00e5a0)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Star size={10} /> {plan.featured ? 'Best Value' : 'Most Popular'}
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${plan.glow}`, border: `1px solid ${plan.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={22} color={plan.color} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{display}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{sub}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: feat.included ? 1 : 0.38 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: feat.included ? 'rgba(0,229,160,0.12)' : 'var(--glass-1)', border: `1px solid ${feat.included ? 'rgba(0,229,160,0.3)' : 'var(--glass-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {feat.included ? <Check size={10} color="var(--pulse)" /> : <X size={10} color="var(--text-3)" />}
                      </div>
                      <span style={{ fontSize: 13, color: feat.included ? 'var(--text-1)' : 'var(--text-3)', textDecoration: feat.included ? 'none' : 'line-through' }}>{feat.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={plan.action}
                  disabled={loadingTier === plan.id}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: 12, cursor: loadingTier === plan.id ? 'not-allowed' : 'pointer',
                    background: plan.featured ? 'linear-gradient(135deg,#7c5cfc,#4f9eff)' : plan.popular ? 'rgba(79,158,255,0.12)' : 'var(--glass-2)',
                    color: plan.featured ? 'white' : plan.popular ? 'var(--ion)' : 'var(--text-2)',
                    border: plan.featured ? 'none' : `1px solid ${plan.popular ? 'rgba(79,158,255,0.3)' : 'var(--glass-border)'}`,
                    fontWeight: 700, fontSize: 14, opacity: loadingTier === plan.id ? 0.6 : 1,
                    boxShadow: plan.featured ? '0 0 20px rgba(124,92,252,0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={e => { if (!plan.featured) { e.currentTarget.style.background = plan.popular ? 'rgba(79,158,255,0.2)' : 'var(--glass-3)'; } }}
                  onMouseLeave={e => { if (!plan.featured) { e.currentTarget.style.background = plan.popular ? 'rgba(79,158,255,0.12)' : 'var(--glass-2)'; } }}
                >
                  {loadingTier === plan.id ? 'Processing...' : plan.cta}
                  {!loadingTier && plan.featured && <ArrowRight size={14} style={{ marginLeft: 6, display: 'inline' }} />}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div style={{ marginBottom: 64, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="display" style={{ fontSize: 18 }}>Compare features</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Everything is encrypted. Upgrade any time.</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>✓ included • — not included</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: 'var(--text-3)', borderBottom: '1px solid var(--glass-border)' }}>Feature</th>
                  {plans.map(p => (
                    <th key={p.id} style={{ textAlign: 'center', padding: '14px 16px', fontSize: 12, color: 'var(--text-2)', borderBottom: '1px solid var(--glass-border)' }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((label, idx) => (
                  <tr key={label} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{label}</td>
                    {plans.map(p => (
                      <td key={p.id} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {featureIncluded(p, label) ? <Check size={14} color="var(--pulse)" /> : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 64, padding: '24px 32px', background: 'var(--glass-1)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
          {[
            { icon: '🔒', label: 'AES-256 Encryption' },
            { icon: '💳', label: 'Stripe Secure Payments' },
            { icon: '🔄', label: '30-Day Money Back' },
            { icon: '🚫', label: 'No Hidden Fees' },
            { icon: '📧', label: 'Cancel Anytime' },
          ].map(trust => (
            <div key={trust.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{trust.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{trust.label}</span>
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginBottom: 64 }}>
          <h2 className="display" style={{ fontSize: 28, textAlign: 'center', marginBottom: 32 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.07 }}
                style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ion)', marginBottom: 8 }}>Q: {faq.q}</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', background: 'linear-gradient(135deg,rgba(124,92,252,0.1),rgba(79,158,255,0.08))', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 24, padding: '48px 32px', marginBottom: 40 }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 12 }}>Ready to secure your digital legacy?</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 28, fontSize: 15 }}>Join thousands who trust LastKey. Start free — no credit card required.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate(user ? '/dashboard' : '/register')}
              style={{ background: 'linear-gradient(135deg,#7c5cfc,#4f9eff)', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: 'var(--glow-plasma)' }}>
              Get Started Free
            </button>
            <button onClick={() => handleSubscribe('guardian')}
              style={{ background: 'var(--glass-2)', border: '1px solid rgba(79,158,255,0.3)', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 600, color: 'var(--ion)', cursor: 'pointer' }}>
              Try Guardian Free →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
