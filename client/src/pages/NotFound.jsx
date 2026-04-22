import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileQuestion, 
  Compass,
  Shield,
  Star,
  Zap,
  Heart
} from 'lucide-react';

/**
 * NotFound Page - 404 Error Page
 * 
 * A premium 404 page with command center styling that provides
 * helpful navigation options when users land on non-existent routes.
 */
const NotFound = () => {
  const quickActions = [
    {
      icon: Home,
      label: 'Dashboard',
      description: 'Return to your main dashboard',
      to: '/dashboard',
      color: '#00e5a0'
    },
    {
      icon: Shield,
      label: 'Vault',
      description: 'Access your secure vault',
      to: '/vault',
      color: '#4f9eff'
    },
    {
      icon: Heart,
      label: 'Beneficiaries',
      description: 'Manage your trusted circle',
      to: '/beneficiaries',
      color: '#ff4d6d'
    },
    {
      icon: FileQuestion,
      label: 'Documents',
      description: 'View legal documents',
      to: '/legal-documents',
      color: '#ffb830'
    }
  ];

  const helpfulLinks = [
    { label: 'Getting Started Guide', to: '/help' },
    { label: 'Contact Support', to: '/support' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030508',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(79, 158, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124, 92, 252, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Floating elements */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(0,229,160,0.1))',
          border: '1px solid rgba(0,229,160,0.3)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Star size={24} style={{ color: '#00e5a0' }} />
      </motion.div>

      <motion.div
        animate={{
          y: [20, -20, 20],
          x: [10, -10, 10]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, rgba(79,158,255,0.2), rgba(79,158,255,0.1))',
          border: '1px solid rgba(79,158,255,0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Compass size={20} style={{ color: '#4f9eff' }} />
      </motion.div>

      <motion.div
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          position: 'absolute',
          top: '10%',
          right: '20%',
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, rgba(255,184,48,0.2), rgba(255,184,48,0.1))',
          border: '1px solid rgba(255,184,48,0.3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Zap size={16} style={{ color: '#ffb830' }} />
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%',
          maxWidth: '800px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* 404 Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,77,109,0.2), rgba(255,77,109,0.1))',
              border: '1px solid rgba(255,77,109,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileQuestion size={36} style={{ color: '#ff4d6d' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                fontSize: '64px',
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: '8px',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #ff4d6d, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                404
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#64748b',
                fontWeight: 600
              }}>
                Page Not Found
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ marginBottom: '48px' }}
        >
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            Lost in the Digital Legacy?
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.6,
            maxWidth: '500px',
            margin: '0 auto 32px'
          }}>
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to securing your digital legacy.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ marginBottom: '48px' }}
        >
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '24px'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={action.to}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '24px',
                      borderRadius: '16px',
                      background: '#050d1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      textDecoration: 'none',
                      color: '#ffffff',
                      transition: 'all 150ms',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = action.color;
                      e.target.style.background = `${action.color}10`;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = `0 10px 25px -5px ${action.color}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.background = '#050d1a';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${action.color}20`,
                      border: `1px solid ${action.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ActionIcon size={24} style={{ color: action.color }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        {action.label}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: 1.4
                      }}>
                        {action.description}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          style={{ marginBottom: '48px' }}
        >
          <div style={{
            display: 'flex',
            gap: '12px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{
              flex: 1,
              position: 'relative'
            }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} />
              <input
                type="text"
                placeholder="Search for anything..."
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#050d1a',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4f9eff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Handle search
                    console.log('Search for:', e.target.value);
                  }
                }}
              />
            </div>
            <button
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 158, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Search
            </button>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 150ms',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = '#4f9eff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.05)';
              e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          style={{
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '16px'
          }}>
            Looking for something specific?
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {helpfulLinks.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: '#4f9eff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#7c5cfc';
                  e.target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#4f9eff';
                  e.target.style.textDecoration = 'none';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
