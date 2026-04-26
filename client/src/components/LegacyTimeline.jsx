import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    step: 1,
    icon: '😴',
    title: 'Inactivity Detected',
    desc: 'No check-in after your set duration',
    color: '#4f9eff',
    status: 'active'
  },
  {
    step: 2,
    icon: '⚠️',
    title: 'Warning Sent',
    desc: 'You receive an email & app notification',
    color: '#ffb830',
    status: 'warning'
  },
  {
    step: 3,
    icon: '🚨',
    title: 'Protocol Activated',
    desc: 'Guardian Protocol triggers automatically',
    color: '#ff4d6d',
    status: 'triggered'
  },
  {
    step: 4,
    icon: '💌',
    title: 'Legacy Delivered',
    desc: 'Your messages & vault reach your loved ones',
    color: '#00e5a0',
    status: 'delivered'
  }
];

const LegacyTimeline = ({ dmsStatus }) => {
  // Determine current step based on dmsStatus
  const getCurrentStep = () => {
    if (!dmsStatus) return 0;
    switch (dmsStatus.status) {
      case 'active': return 1;
      case 'warning': return 2;
      case 'triggered': return 3;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div style={{ width: '100%' }}>
      {/* Desktop: Horizontal layout */}
      <div className="desktop-timeline" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        '@media (max-width: 768px)': { display: 'none' }
      }}>
        {steps.map((step, index) => {
          const isActive = currentStep === index + 1;
          const isPast = currentStep > index + 1;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.step} style={{ display: 'flex', alignItems: 'stretch' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                style={{
                  flex: 1,
                  background: 'var(--glass-1)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isActive ? step.color : 'var(--glass-border)'}`,
                  borderRadius: 16,
                  padding: 16,
                  position: 'relative',
                  boxShadow: isActive ? `0 0 20px ${step.color}20` : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Step number */}
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isActive || isPast ? step.color : 'var(--glass-2)',
                  border: `2px solid ${isActive || isPast ? step.color : 'var(--glass-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: isActive || isPast ? '#001a12' : 'var(--text-3)'
                }}>
                  {step.step}
                </div>

                {/* Icon */}
                <div style={{ fontSize: 28, marginBottom: 12, marginTop: 4 }}>{step.icon}</div>

                {/* Title */}
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? step.color : 'var(--text-1)',
                  margin: '0 0 6px 0'
                }}>
                  {step.title}
                </h4>

                {/* Description */}
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-2)',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {step.desc}
                </p>

                {/* Status indicator */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: step.color,
                    boxShadow: `0 0 10px ${step.color}`,
                    animation: 'pulse 2s infinite'
                  }} />
                )}
                {isPast && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 12,
                    color: '#00e5a0'
                  }}>
                    ✓
                  </div>
                )}
              </motion.div>

              {/* Connector arrow (not on last item) */}
              {!isLast && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  color: 'var(--text-3)',
                  fontSize: 14
                }}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical layout */}
      <div className="mobile-timeline" style={{
        display: 'none',
        flexDirection: 'column',
        gap: 12,
        '@media (max-width: 768px)': { display: 'flex' }
      }}>
        {steps.map((step, index) => {
          const isActive = currentStep === index + 1;
          const isPast = currentStep > index + 1;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.step} style={{ display: 'flex', gap: 12 }}>
              {/* Connector line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 24
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isActive || isPast ? step.color : 'var(--glass-2)',
                  border: `2px solid ${isActive || isPast ? step.color : 'var(--glass-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive || isPast ? '#001a12' : 'var(--text-3)',
                  flexShrink: 0
                }}>
                  {step.step}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2,
                    flex: 1,
                    background: isPast ? step.color : 'var(--glass-border)',
                    marginTop: 8,
                    marginBottom: 4,
                    minHeight: 20
                  }} />
                )}
              </div>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                style={{
                  flex: 1,
                  background: 'var(--glass-1)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isActive ? step.color : 'var(--glass-border)'}`,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: isLast ? 0 : 8,
                  boxShadow: isActive ? `0 0 20px ${step.color}20` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{step.icon}</span>
                  <h4 style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isActive ? step.color : 'var(--text-1)',
                    margin: 0
                  }}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: step.color,
                      boxShadow: `0 0 10px ${step.color}`,
                      animation: 'pulse 2s infinite',
                      marginLeft: 'auto'
                    }} />
                  )}
                  {isPast && (
                    <span style={{ fontSize: 12, color: '#00e5a0', marginLeft: 'auto' }}>✓</span>
                  )}
                </div>
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-2)',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {step.desc}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-timeline { display: none !important; }
          .mobile-timeline { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-timeline { display: grid !important; }
          .mobile-timeline { display: none !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LegacyTimeline;
