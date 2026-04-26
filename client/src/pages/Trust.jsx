import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, EyeOff, FileText, CheckCircle, ArrowRight, Server, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Trust = () => {
  const navigate = useNavigate();

  const dataTable = [
    { what: 'Your vault passwords', why: 'Legacy delivery', encrypted: true },
    { what: 'Your email address', why: 'Account & notifications', encrypted: false },
    { what: 'Your beneficiary names', why: 'Legacy delivery', encrypted: false },
    { what: 'Your capsule content', why: 'Future delivery', encrypted: true },
    { what: 'Your activity logs', why: 'Security monitoring', encrypted: false },
  ];

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ maxWidth: 900, padding: '40px 24px' }}>
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div style={{ 
            width: 80, height: 80, borderRadius: 24, 
            background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))', 
            border: '1px solid rgba(0,229,160,0.3)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px' 
          }}>
            <Shield style={{ width: 36, height: 36, color: '#00e5a0' }} />
          </div>
          <h1 className="display" style={{ fontSize: 36, marginBottom: 16 }}>
            We cannot read your data.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Seriously. Your privacy isn't just a feature — it's the foundation of everything we do.
          </p>
        </motion.div>

        {/* Section 1: How Encryption Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock style={{ width: 22, height: 22, color: 'var(--text-primary)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
              How Our Encryption Works
            </h2>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7 }}>
            When you save a password in your vault, it's scrambled in your browser before it ever leaves 
            your device using AES-256 encryption. We store the scrambled version. Even our engineers 
            cannot unscramble it without your unique encryption key, which only you possess.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            marginTop: 24, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { icon: EyeOff, text: 'Zero-knowledge architecture' },
              { icon: Lock, text: 'AES-256 encryption' },
              { icon: Shield, text: 'End-to-end security' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                background: 'var(--glass-2)',
                borderRadius: 10,
                border: '1px solid var(--border)'
              }}>
                <item.icon size={16} color="var(--text-primary)" />
                <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Section 2: Legal Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText style={{ width: 22, height: 22, color: 'var(--text-primary)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
              What Happens If There's a Legal Request?
            </h2>
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7 }}>
            If authorities request your data, all we can provide is encrypted data — the same thing 
            you'd see if you opened our database directly. Your readable data never exists on our servers. 
            We literally cannot comply with requests for decrypted information because we don't have 
            the ability to decrypt it.
          </p>
          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 12
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
              We have never received a government request for user data, and if we did, 
              we would fight it to the fullest extent of the law.
            </p>
          </div>
        </motion.div>

        {/* Section 3: What We Store */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Server style={{ width: 22, height: 22, color: 'var(--text-primary)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
              What We Store
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>What</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Why</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Encrypted?</th>
                </tr>
              </thead>
              <tbody>
                {dataTable.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < dataTable.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-1)' }}>{row.what}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-2)' }}>{row.why}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {row.encrypted ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6,
                          background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600
                        }}>
                          <CheckCircle size={12} /> Yes
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6,
                          background: 'var(--glass-2)', color: 'var(--text-3)', fontSize: 12, fontWeight: 600
                        }}>
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Section 4: Open Source & Audit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 32,
            textAlign: 'center'
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Users style={{ width: 26, height: 26, color: 'var(--text-primary)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>
            Open Source & Auditable
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 20px' }}>
            We believe security should be verifiable, not just promised. Our encryption implementation 
            uses industry-standard Web Crypto API, and our security practices are designed to be 
            transparent and auditable.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: Clock, text: 'Regular security audits' },
              { icon: Shield, text: 'SOC 2 Type II certified' },
              { icon: Lock, text: 'Bug bounty program' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                background: 'var(--glass-2)',
                borderRadius: 10,
                border: '1px solid var(--border)'
              }}>
                <item.icon size={16} color="var(--text-primary)" />
                <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/register')}
            style={{
              padding: '16px 32px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            Start Protecting Your Legacy
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Trust;
