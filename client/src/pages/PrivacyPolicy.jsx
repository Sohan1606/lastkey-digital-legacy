import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Trash2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container-sm" style={{ maxWidth: 980, paddingTop: 40 }}>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--bg-base)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Shield style={{ width: 28, height: 28, color: 'var(--plasma)' }} />
          </div>
          <h1 className="display" style={{ fontSize: 30, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>
            Your trust is our foundation. We're committed to protecting your digital legacy with transparency and security.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>Last updated: April 6, 2026</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Introduction */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye style={{ width: 18, height: 18, color: 'var(--ion)' }} />
              Our Commitment to Your Privacy
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', lineHeight: 1.8, fontSize: 13 }}>
              <p>
                LastKey is more than a service—it's a sacred trust. We understand that you're entrusting us with your most precious memories, final wishes, and digital legacy. This privacy policy outlines how we protect, use, and respect your data.
              </p>
              <p>
                We believe privacy is a fundamental right, especially when it comes to your digital afterlife. This policy is written in plain language because you deserve to know exactly how your data is handled.
              </p>
            </div>
          </section>

          {/* Data We Collect */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>Information We Collect</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {[
                {
                  title: 'Account Information',
                  items: ['Name and email address', 'Phone number (for alerts, optional)', 'Password (encrypted and salted)'],
                  accent: 'var(--accent-blue)',
                  border: 'var(--border-blue)',
                },
                {
                  title: 'Legacy Content',
                  items: ['Time letters and messages', 'Digital asset instructions', 'Beneficiary information', 'Life timeline events'],
                  accent: 'var(--accent-purple)',
                  border: 'var(--border-purple)',
                },
              ].map(card => (
                <div key={card.title} style={{ background: card.accent, border: `1px solid ${card.border}`, borderRadius: 16, padding: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 10px' }}>{card.title}</h3>
                  <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0, color: 'var(--text-2)', fontSize: 12, lineHeight: 1.7 }}>
                    {card.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* How We Protect Your Data */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock style={{ width: 18, height: 18, color: 'var(--amber)' }} />
              How We Protect Your Data
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-base)', borderRadius: 16, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 8px' }}>🔐 Zero-Knowledge Vault Encryption</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
                  Your Memory Vault passwords are encrypted <strong>client-side</strong> using AES-256 encryption before they ever leave your device. We cannot access, read, or reset your vault passwords. This is true zero-knowledge security.
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { t: 'Transport Security', d: 'All data transmitted uses TLS 1.3 encryption' },
                  { t: 'Storage Security', d: 'Database encryption at rest with regular security audits' },
                  { t: 'Access Controls', d: 'Strict role-based access and authentication' },
                  { t: 'Regular Backups', d: 'Encrypted backups with disaster recovery' },
                ].map(x => (
                  <div key={x.t} style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 6px' }}>{x.t}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.7 }}>{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>How We Use Your Information</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { n: '1', t: 'Service Operation', d: 'To provide the LastKey service, store your legacy content, and execute your Guardian Protocol' },
                { n: '2', t: 'Communication', d: 'To send account notifications, security alerts, and deliver your legacy to beneficiaries' },
                { n: '3', t: 'Service Improvement', d: 'To analyze usage patterns and improve our service (anonymized data only)' },
                { n: '4', t: 'Legal Compliance', d: 'To comply with legal obligations and protect our users’ rights' },
              ].map(row => (
                <div key={row.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--accent-blue)', border: '1px solid var(--border-blue)', color: 'var(--ion)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                    {row.n}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, color: 'var(--text-1)' }}>{row.t}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{row.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Third-Party Services */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>Third-Party Services</h2>
            <p style={{ color: 'var(--text-2)', margin: '0 0 14px', fontSize: 13, lineHeight: 1.8 }}>We use trusted third-party services to enhance your experience:</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { t: 'OpenAI', d: 'For AI-powered message generation and memoir creation. Your content is processed securely and not used for training.' },
                { t: 'Stripe', d: 'For secure payment processing. We never store your credit card information.' },
              ].map(x => (
                <div key={x.t} style={{ borderLeft: '3px solid var(--ion)', paddingLeft: 12, background: 'var(--bg-card)', borderRadius: 12, paddingTop: 10, paddingBottom: 10, paddingRight: 12 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 900, color: 'var(--text-1)' }}>{x.t}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Your Rights */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trash2 style={{ width: 18, height: 18, color: 'var(--danger)' }} />
              Your Data Rights
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {[
                { t: 'Access & Portability', d: 'You can export all your data at any time from your dashboard.' },
                { t: 'Correction', d: 'Update your information anytime through your account settings.' },
                { t: 'Deletion', d: 'Request permanent deletion of your account and all associated data.' },
                { t: 'Consent Withdrawal', d: 'Change your mind about data collection at any time.' },
              ].map(x => (
                <div key={x.t} style={{ background: 'var(--glass-2)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 14 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 900, color: 'var(--text-1)' }}>{x.t}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Data Retention */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>Data Retention</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <p>
                Your legacy content is stored indefinitely unless you choose to delete it. Even after account deletion, we may retain certain information:
              </p>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Legal compliance requirements</li>
                <li>Fraud prevention</li>
                <li>Security analysis</li>
                <li>Anonymized service improvement data</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section style={{ background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', border: '1px solid var(--border-base)', borderRadius: 20, padding: 24 }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail style={{ width: 18, height: 18, color: 'var(--plasma)' }} />
              Questions About Your Privacy?
            </h2>
            <p style={{ marginBottom: 14, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              We're here to answer any questions about how we protect your data. Your privacy is not just policy—it's our promise.
            </p>
            <div style={{ display: 'grid', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Email:</strong> privacy@lastkey.com</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Response Time:</strong> Within 48 hours</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Data Requests:</strong> We'll respond within 30 days as required by GDPR</p>
            </div>
          </section>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '26px 0 0', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              This privacy policy is part of our commitment to transparency and trust. 
              By using LastKey, you agree to the practices described here.
            </p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/terms" style={{ color: 'var(--ion)', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Terms of Service
              </Link>
              <span style={{ color: 'var(--text-3)' }}>•</span>
              <Link to="/" style={{ color: 'var(--ion)', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
