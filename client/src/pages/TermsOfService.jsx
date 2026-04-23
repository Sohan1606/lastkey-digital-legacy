import { motion } from 'framer-motion';
import { FileText, Shield, Heart, AlertTriangle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <FileText style={{ width: 28, height: 28, color: 'var(--ion)' }} />
          </div>
          <h1 className="display" style={{ fontSize: 30, marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>
            The legal foundation for protecting your digital legacy and ensuring your wishes are honored.
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
          {/* Agreement */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>1. Agreement to Terms</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', lineHeight: 1.8, fontSize: 13 }}>
              <p>
                By accessing and using LastKey ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, then you may not access the Service.
              </p>
              <p>
                LastKey is a digital legacy platform designed to help you preserve memories, protect digital assets, 
                and communicate with loved ones after you're gone. This is a sacred responsibility we take seriously.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart style={{ width: 18, height: 18, color: 'var(--plasma)' }} />
              2. Service Description
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <p>
                LastKey provides a comprehensive digital afterlife platform including:
              </p>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Time-locked message delivery ("Time Letters")</li>
                <li>Guardian Protocol (inactivity monitoring)</li>
                <li>Memory Vault for digital asset instructions</li>
                <li>Life Timeline and memory preservation</li>
                <li>AI-powered message generation</li>
                <li>Voice message creation and storage</li>
              </ul>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, marginTop: 6 }}>
                <p style={{ color: 'var(--amber)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  <strong>Important:</strong> LastKey is a planning tool, not a legal service. 
                  For estate planning, please consult with qualified legal professionals.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>3. User Responsibilities</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>You agree to:</h3>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Update beneficiary information regularly</li>
                <li>Test your Guardian Protocol settings periodically</li>
                <li>Ensure consent from beneficiaries before adding them</li>
                <li>Not use the service for illegal or harmful purposes</li>
              </ul>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>You acknowledge that:</h3>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>You are solely responsible for the content you store</li>
                <li>Beneficiary contact information must be accurate</li>
                <li>Regular account activity is essential for Guardian Protocol</li>
                <li>Digital asset instructions should be kept current</li>
              </ul>
            </div>
          </section>

          {/* Guardian Protocol */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield style={{ width: 18, height: 18, color: 'var(--ion)' }} />
              4. Guardian Protocol (Digital Legacy Activation)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <p>
                The Guardian Protocol is our core feature that monitors your account activity and activates your legacy 
                distribution when triggered by prolonged inactivity.
              </p>
              
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 10px' }}>Protocol Activation</h4>
                <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0, fontSize: 12, color: 'var(--text-2)' }}>
                  <li>Warning phase after your configured inactivity period</li>
                  <li>Final activation after double the inactivity period</li>
                  <li>Email alerts to beneficiaries</li>
                  <li>Release of Time Letters and asset instructions</li>
                </ul>
              </div>
              
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
                <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  <strong>Critical:</strong> Once the Guardian Protocol is activated, certain actions cannot be undone. 
                  Please maintain regular account activity and keep your information current.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>5. Subscription & Payment Terms</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Subscription Tiers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { name: 'Free', color: 'var(--bg-card)', border: 'var(--border)', items: ['2 Loved Ones', '3 Time Letters', '5 Memory Items'] },
                  { name: 'Guardian ($4.99/mo)', color: 'var(--bg-card)', border: 'var(--border)', items: ['5 Loved Ones', '20 Time Letters', '50 Memory Items'] },
                  { name: 'Legacy Pro ($12.99/mo)', color: 'var(--bg-card)', border: 'var(--border)', items: ['Unlimited Everything', 'AI Voice Messages', 'Memoir AI', 'Life Timeline'] },
                ].map(tier => (
                  <div key={tier.name} style={{ background: tier.color, border: `1px solid ${tier.border}`, borderRadius: 16, padding: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>{tier.name}</h4>
                    <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: '10px 0 0', fontSize: 12 }}>
                      {tier.items.map(i => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>Billing Terms</h3>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Subscriptions renew automatically unless canceled</li>
                <li>Cancel anytime—access continues until period end</li>
                <li>30-day money-back guarantee for new subscribers</li>
                <li>Prices may change with 30-day notice</li>
                <li>All payments processed securely through Stripe</li>
              </ul>
            </div>
          </section>

          {/* Content & Intellectual Property */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>6. Content & Intellectual Property</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Your Content</h3>
              <p>
                You retain full ownership and rights to all content you create and store on LastKey, including:
              </p>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Time Letters and messages</li>
                <li>Voice recordings</li>
                <li>Life timeline events</li>
                <li>Digital asset instructions</li>
                <li>AI-generated memoirs</li>
              </ul>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>Our License</h3>
              <p>
                You grant LastKey a limited, worldwide license to store, process, and deliver your content 
                solely for the purpose of providing the Service. We never sell or license your content to third parties.
              </p>
            </div>
          </section>

          {/* Limitations & Disclaimers */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: 'var(--amber)' }} />
              7. Limitations & Disclaimers
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 8px' }}>Service Limitations</h4>
                <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0 }}>
                  LastKey cannot guarantee delivery of your legacy in all circumstances, including but not limited to:
                </p>
                <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: '10px 0 0', fontSize: 12, color: 'var(--danger)' }}>
                  <li>Extended internet outages</li>
                  <li>Company closure or bankruptcy</li>
                  <li>Force majeure events</li>
                  <li>Illegal or harmful content requests</li>
                  <li>Inaccurate beneficiary information</li>
                </ul>
              </div>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>No Legal Advice</h3>
              <p>
                LastKey is not a legal service and does not provide legal, financial, or estate planning advice. 
                Consult qualified professionals for legal and financial planning.
              </p>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>Service Availability</h3>
              <p>
                We strive for 99.9% uptime but cannot guarantee uninterrupted service. 
                Regular maintenance may cause temporary disruptions.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>8. Account Termination</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>By You</h3>
              <p>
                You may terminate your account at any time. Upon termination:
              </p>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>You can export all your data before deletion</li>
                <li>Account will be deleted within 30 days</li>
                <li>Subscription benefits end immediately</li>
                <li>No refunds for partial subscription periods</li>
              </ul>
              
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', margin: '6px 0 0' }}>By LastKey</h3>
              <p>
                We may terminate accounts for violations of these Terms, including:
              </p>
              <ul style={{ display: 'grid', gap: 8, paddingLeft: 18, margin: 0 }}>
                <li>Illegal or harmful use of the service</li>
                <li>Fraudulent activity</li>
                <li>Violation of privacy or rights of others</li>
                <li>Extended non-payment</li>
              </ul>
            </div>
          </section>

          {/* Privacy */}
          <section style={{ background: 'var(--glass-1)', backdropFilter: 'blur(24px)', borderRadius: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10 }}>9. Privacy</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              Your privacy is fundamental to our service. Our use of your data is governed by our 
              <Link to="/privacy" style={{ color: 'var(--ion)', fontWeight: 800, marginLeft: 6, textDecoration: 'none' }}>
                Privacy Policy
              </Link>, 
              which explains how we collect, use, and protect your information.
            </p>
          </section>

          {/* Contact */}
          <section style={{ background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
            <h2 className="display" style={{ fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users style={{ width: 18, height: 18, color: 'var(--ion)' }} />
              Questions About These Terms?
            </h2>
            <p style={{ marginBottom: 14, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.8 }}>
              We believe in transparency and are happy to explain any aspect of these terms.
            </p>
            <div style={{ display: 'grid', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Email:</strong> legal@lastkey.com</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Response Time:</strong> Within 48 hours</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-1)' }}>Disputes:</strong> We'll work in good faith to resolve any issues</p>
            </div>
          </section>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '26px 0 0', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              These Terms of Service create a legal agreement between you and LastKey Digital Legacy, Inc. 
              By using our service, you acknowledge that you have read, understood, and agree to be bound by these terms.
            </p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/privacy" style={{ color: 'var(--ion)', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Privacy Policy
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

export default TermsOfService;
