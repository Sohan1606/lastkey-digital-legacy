import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: 'var(--bg-base)',
      color: '#f0f4ff',
      overflowX: 'hidden',
      paddingTop: '64px'
    }}>

      {/* ═══════════════════════════════════
          SECTION 1 — HERO
          Full viewport, dark, confident
      ═══════════════════════════════════ */}
      <section id="hero" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        textAlign: 'center'
      }}>
        
        {/* Subtle background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(
              ellipse 80% 50% at 50% -10%,
              rgba(79,158,255,0.12),
              transparent
            )
          `,
          pointerEvents: 'none'
        }} />

        {/* Small top badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: 'rgba(79,158,255,0.08)',
          border: '1px solid rgba(79,158,255,0.18)',
          borderRadius: 100,
          fontSize: 13,
          color: '#93b4d4',
          marginBottom: 40,
          position: 'relative'
        }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#4f9eff',
            display: 'inline-block'
          }} />
          Your family deserves to know
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          maxWidth: 820,
          margin: '0 auto 24px',
          color: '#ffffff'
        }}>
          What happens to your
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #4f9eff 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            digital life
          </span>
          {' '}after you?
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(16px, 2.2vw, 20px)',
          color: '#7a90b0',
          maxWidth: 560,
          margin: '0 auto 48px',
          lineHeight: 1.7,
          fontWeight: 400
        }}>
          LastKey encrypts your most important accounts, 
          documents, and messages — and delivers them to 
          the right people at the right time.
          <br />
          <span style={{ color: '#a0b4c8' }}>
            Automatically. Privately. Securely.
          </span>
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 64
        }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '14px 32px',
              background: '#4f9eff',
              border: 'none',
              borderRadius: 10,
              color: '#060a14',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#6aabff'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#4f9eff'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Protect my legacy — it is free
          </button>

          <button
            onClick={() => {
              document.getElementById('how-it-works')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              padding: '14px 32px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#a0b4c8',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.color = '#f0f4ff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = '#a0b4c8'
            }}
          >
            See how it works
          </button>
        </div>

        {/* Trust indicators */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 32px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {[
            { icon: '🔐', text: 'AES-256 Encrypted' },
            { icon: '👁', text: 'Zero Knowledge' },
            { icon: '🛡️', text: 'GDPR Compliant' },
            { icon: '⚡', text: '99.9% Uptime' }
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#4a6080'
            }}>
              <span style={{ fontSize: 14 }}>
                {item.icon}
              </span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: 0.3
        }}>
          <div style={{
            width: 1,
            height: 40,
            background: 'linear-gradient(to bottom, transparent, #4f9eff)'
          }} />
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 2 — THE PROBLEM
          Make them feel understood
      ═══════════════════════════════════ */}
      <section style={{
        padding: '100px 24px',
        background: 'var(--bg-base)',
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4f9eff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            The Problem
          </p>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 60,
            color: '#ffffff'
          }}>
            Your family will not know your 
            passwords, accounts, or wishes.
            <span style={{ color: '#4a6080' }}>
              {' '}Most people never plan for this.
            </span>
          </h2>

          {/* 3 problem statements */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 
              'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24
          }}>
            {[
              {
                number: '73%',
                text: 'of families cannot access their loved one\'s online accounts after death'
              },
              {
                number: '6 months',
                text: 'average time families spend trying to recover digital accounts and assets'
              },
              {
                number: '$0',
                text: 'of digital assets successfully transferred without prior planning'
              }
            ].map(stat => (
              <div key={stat.number} style={{
                padding: '28px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  marginBottom: 10,
                  lineHeight: 1
                }}>
                  {stat.number}
                </p>
                <p style={{
                  fontSize: 13,
                  color: '#4a6080',
                  lineHeight: 1.6
                }}>
                  {stat.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 3 — HOW IT WORKS
          Simple numbered steps
      ═══════════════════════════════════ */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4f9eff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            How it works
          </p>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 72,
            color: '#ffffff'
          }}>
            Set up once.
            <span style={{ color: '#4a6080' }}>
              {' '}Works forever.
            </span>
          </h2>

          {/* Steps */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0
          }}>
            {[
              {
                step: '01',
                title: 'Store what matters',
                description: 'Add your passwords, bank accounts, insurance policies, final messages, and any other important information. Everything is encrypted before it leaves your device.',
                detail: 'Military-grade AES-256 encryption. We cannot read your data even if we wanted to.'
              },
              {
                step: '02',
                title: 'Choose who receives what',
                description: 'Designate specific people for specific items. Your wife gets everything. Your lawyer gets only the will. Your son gets the investment account. You decide exactly.',
                detail: 'Granular access control. Each beneficiary sees only what you assign them.'
              },
              {
                step: '03',
                title: 'Set your conditions',
                description: 'Choose when the transfer happens. Set an inactivity timer — if you stop checking in, the system activates automatically. Or activate it manually when you choose.',
                detail: 'Inactivity triggers, manual activation, or legal event triggers. Your call.'
              },
              {
                step: '04',
                title: 'Your family receives everything',
                description: 'When the time comes, each beneficiary receives a secure email with their own private portal. They verify their identity and access exactly what you left for them.',
                detail: 'No shared passwords. No confusion. No family disputes over who gets what.'
              }
            ].map((step, i) => (
              <div key={step.step} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 32,
                paddingBottom: 48,
                marginBottom: i < 3 ? 0 : 0,
                position: 'relative'
              }}>
                {/* Connecting line */}
                {i < 3 && (
                  <div style={{
                    position: 'absolute',
                    left: 39,
                    top: 52,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(79,158,255,0.12)'
                  }} />
                )}

                {/* Step number */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(79,158,255,0.08)',
                  border: '1px solid rgba(79,158,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#4f9eff',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                  zIndex: 1,
                  background: '#080d1a'
                }}>
                  {step.step}
                </div>

                {/* Content */}
                <div style={{ paddingTop: 10 }}>
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: 10,
                    letterSpacing: '-0.01em'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontSize: 15,
                    color: '#5a7090',
                    lineHeight: 1.7,
                    marginBottom: 12
                  }}>
                    {step.description}
                  </p>
                  <p style={{
                    fontSize: 13,
                    color: '#3a5060',
                    lineHeight: 1.6,
                    padding: '10px 14px',
                    background: 'rgba(79,158,255,0.04)',
                    borderLeft: '2px solid rgba(79,158,255,0.25)',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 4 — FEATURES
      ═══════════════════════════════════ */}
      <section id="features" style={{
        padding: '100px 24px',
        background: 'var(--bg-base)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4f9eff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            Features
          </p>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 64,
            color: '#ffffff'
          }}>
            Everything in one secure place
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}>
            {[
              {
                icon: '🔒',
                title: 'Encrypted Vault',
                description: 'Store passwords, accounts, documents and notes. Encrypted with AES-256 before upload. We store ciphertext only.',
                color: '#4f9eff'
              },
              {
                icon: '👥',
                title: 'Beneficiary Control',
                description: 'Assign specific vault items to specific people. Granular control over who sees what. Each person gets their own secure portal.',
                color: '#a78bfa'
              },
              {
                icon: '⚡',
                title: 'Smart Triggers',
                description: 'Inactivity timer checks if you have logged in recently. Set it to 30, 60, or 90 days. Miss your check-in and beneficiaries are notified.',
                color: '#f59e0b'
              },
              {
                icon: '📄',
                title: 'Legal Documents',
                description: 'Upload your will, insurance policies, property documents. AI-powered OCR extracts and indexes the text for verification.',
                color: '#34d399'
              },
              {
                icon: '✉️',
                title: 'Final Messages',
                description: 'Write letters to your loved ones. Record voice messages. Create a life timeline. Leave more than passwords — leave your story.',
                color: '#f472b6'
              },
              {
                icon: '🛡️',
                title: 'Zero Knowledge',
                description: 'Your encryption key is derived from your password on your device. We store only ciphertext. A court order cannot reveal your data.',
                color: '#00e5a0'
              }
            ].map(feature => (
              <div
                key={feature.title}
                style={{
                  padding: '28px 24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 
                    'rgba(255,255,255,0.035)'
                  e.currentTarget.style.borderColor = 
                    `${feature.color}25` 
                  e.currentTarget.style.transform = 
                    'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 
                    'rgba(255,255,255,0.02)'
                  e.currentTarget.style.borderColor = 
                    'rgba(255,255,255,0.05)'
                  e.currentTarget.style.transform = 
                    'translateY(0)'
                }}
              >
                <div style={{
                  fontSize: 28,
                  marginBottom: 16,
                  display: 'block'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 10,
                  letterSpacing: '-0.01em'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#4a6080',
                  lineHeight: 1.7
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 5 — SECURITY
      ═══════════════════════════════════ */}
      <section id="security" style={{
        padding: '100px 24px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4f9eff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            Security
          </p>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 16,
            color: '#ffffff'
          }}>
            We cannot read your data.
            <br />
            <span style={{ color: '#4a6080' }}>
              Nobody can. That is the point.
            </span>
          </h2>

          <p style={{
            fontSize: 16,
            color: '#4a6080',
            textAlign: 'center',
            maxWidth: 540,
            margin: '0 auto 64px',
            lineHeight: 1.7
          }}>
            True zero-knowledge architecture means 
            your encryption key never leaves your device. 
            We store ciphertext. Even we cannot decrypt it.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}>
            {[
              {
                title: 'AES-256-GCM',
                desc: 'The same encryption used by banks and governments. Your data is encrypted before upload.',
                color: '#4f9eff'
              },
              {
                title: 'Client-Side Keys',
                desc: 'Your master key is derived from your password on your device. Never transmitted to our servers.',
                color: '#a78bfa'
              },
              {
                title: 'Account Lockout',
                desc: 'Five failed login attempts locks the account for 30 minutes. Brute force is impossible.',
                color: '#f59e0b'
              },
              {
                title: 'Full Audit Trail',
                desc: 'Every action on your account is logged with timestamp and IP. You see everything.',
                color: '#34d399'
              }
            ].map(item => (
              <div key={item.title} style={{
                padding: '24px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: item.color,
                  marginBottom: 16
                }} />
                <h4 style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 8
                }}>
                  {item.title}
                </h4>
                <p style={{
                  fontSize: 13,
                  color: '#3a5060',
                  lineHeight: 1.7
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 6 — PRICING
      ═══════════════════════════════════ */}
      <section id="pricing" style={{
        padding: '100px 24px',
        background: 'var(--bg-base)'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#4f9eff',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            Pricing
          </p>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 16,
            color: '#ffffff'
          }}>
            Start free. Upgrade when ready.
          </h2>

          <p style={{
            fontSize: 16,
            color: '#4a6080',
            textAlign: 'center',
            marginBottom: 64
          }}>
            No credit card required to start.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 
              'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            alignItems: 'start'
          }}>
            {[
              {
                name: 'Free',
                price: '0',
                tagline: 'For individuals getting started',
                features: [
                  '10 vault items',
                  '2 beneficiaries',
                  'Inactivity trigger',
                  'Email notifications',
                  'AES-256 encryption',
                  'Basic audit log'
                ],
                cta: 'Start for free',
                highlight: false
              },
              {
                name: 'Pro',
                price: '9',
                tagline: 'For those who want full protection',
                features: [
                  'Unlimited vault items',
                  'Unlimited beneficiaries',
                  'Advanced trigger conditions',
                  '25 OCR document scans/mo',
                  'Voice messages (10 min)',
                  'AI memoir writing',
                  'Life timeline',
                  'Priority support',
                  'Complete audit logs'
                ],
                cta: 'Start Pro trial',
                highlight: true
              },
              {
                name: 'Family',
                price: '19',
                tagline: 'For families who plan together',
                features: [
                  'Everything in Pro',
                  'Up to 5 family members',
                  'Shared document storage',
                  'Unlimited OCR scans',
                  'Unlimited voice messages',
                  'Custom trigger logic',
                  'Dedicated support',
                  'Advanced audit trail'
                ],
                cta: 'Start Family trial',
                highlight: false
              }
            ].map(plan => (
              <div key={plan.name} style={{
                padding: '32px 28px',
                background: plan.highlight 
                  ? 'rgba(79,158,255,0.06)' 
                  : 'rgba(255,255,255,0.02)',
                border: plan.highlight 
                  ? '1px solid rgba(79,158,255,0.25)' 
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 20,
                position: 'relative'
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 14px',
                    background: '#4f9eff',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#060a14',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em'
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#4a6080',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  {plan.name}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                  marginBottom: 8
                }}>
                  <span style={{
                    fontSize: 14,
                    color: '#4a6080',
                    marginTop: 8
                  }}>
                    $
                  </span>
                  <span style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1
                  }}>
                    {plan.price}
                  </span>
                  {plan.price !== '0' && (
                    <span style={{
                      fontSize: 14,
                      color: '#4a6080'
                    }}>
                      /mo
                    </span>
                  )}
                </div>

                <p style={{
                  fontSize: 13,
                  color: '#3a5060',
                  marginBottom: 28,
                  lineHeight: 1.5
                }}>
                  {plan.tagline}
                </p>

                <button
                  onClick={() => navigate('/register')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: plan.highlight 
                      ? '#4f9eff' 
                      : 'transparent',
                    border: plan.highlight 
                      ? 'none' 
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: plan.highlight 
                      ? '#060a14' 
                      : '#a0b4c8',
                    fontSize: 14,
                    fontWeight: plan.highlight ? 700 : 500,
                    cursor: 'pointer',
                    marginBottom: 28,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {plan.cta}
                </button>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  {plan.features.map(feature => (
                    <div key={feature} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      color: '#5a7090'
                    }}>
                      <span style={{
                        color: '#4f9eff',
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        ✓
                      </span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 7 — FINAL CTA
      ═══════════════════════════════════ */}
      <section style={{
        padding: '100px 24px',
        background: '#080d1a',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 20,
            color: '#ffffff',
            lineHeight: 1.1
          }}>
            The best time to protect
            <br />
            your legacy is today.
          </h2>
          <p style={{
            fontSize: 16,
            color: '#4a6080',
            marginBottom: 40,
            lineHeight: 1.7
          }}>
            Takes 10 minutes to set up.
            Gives your family a lifetime of clarity.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '16px 40px',
              background: '#4f9eff',
              border: 'none',
              borderRadius: 12,
              color: '#060a14',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em'
            }}
          >
            Create your vault — free forever
          </button>
          <p style={{
            fontSize: 13,
            color: '#2a3a4a',
            marginTop: 16
          }}>
            No credit card. No setup fee. 
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER
      ═══════════════════════════════════ */}
      <footer style={{
        padding: '48px 24px',
        background: '#060a14',
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 40
        }}>
          <div>
            <Logo size="sm" darkMode={true} />
            <p style={{
              fontSize: 13,
              color: '#2a3a4a',
              marginTop: 16,
              lineHeight: 1.7
            }}>
              Protecting digital legacies
              for families worldwide.
            </p>
          </div>

          {[
            {
              title: 'Product',
              links: ['Vault', 'Beneficiaries', 
                'Triggers', 'Legal Documents', 'Pricing']
            },
            {
              title: 'Legal',
              links: ['Privacy Policy', 
                'Terms of Service', 'Security']
            },
            {
              title: 'Company',
              links: ['About', 'Contact', 'Support']
            }
          ].map(col => (
            <div key={col.title}>
              <p style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#2a3a4a',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>
                {col.title}
              </p>
              {col.links.map(link => (
                <p key={link} style={{
                  fontSize: 14,
                  color: '#2a3a4a',
                  marginBottom: 10,
                  cursor: 'pointer',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={e => 
                  e.currentTarget.style.color = '#5a7090'}
                onMouseLeave={e => 
                  e.currentTarget.style.color = '#2a3a4a'}
                >
                  {link}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          maxWidth: 1000,
          margin: '40px auto 0',
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <p style={{ fontSize: 13, color: '#1a2a3a' }}>
            © 2024 LastKey Digital Legacy. 
            All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: '#1a2a3a' }}>
            Built with care for the ones you love.
          </p>
        </div>
      </footer>

    </div>
  )
}
