import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Shield, Lock, Activity, AlertTriangle, Mail, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Event type icons + labels mapping (ENFORCEMENT 5)
const EVENT_LABELS = {
  login:              { label: 'Signed In',             icon: '🔑', color: '#4f9eff' },
  logout:             { label: 'Signed Out',            icon: '🚪', color: '#8899bb' },
  vault_access:       { label: 'Vault Accessed',        icon: '🔐', color: '#ffb830' },
  ping:               { label: 'Guardian Check-in',     icon: '🏓', color: '#00e5a0' },
  trigger_fired:      { label: 'Protocol Triggered',    icon: '🚨', color: '#ff4d6d' },
  email_sent:         { label: 'Email Sent',            icon: '📧', color: '#7c5cfc' },
  beneficiary_access: { label: 'Beneficiary Accessed',  icon: '👤', color: '#a78bfa' },
  capsule_release:    { label: 'Capsule Released',      icon: '📦', color: '#00e5a0' },
  asset_created:      { label: 'Vault Item Added',      icon: '➕', color: '#4f9eff' },
  asset_updated:      { label: 'Vault Item Updated',    icon: '✏️', color: '#4f9eff' },
};

// Severity badge styles (ENFORCEMENT 5)
const SEVERITY_STYLE = {
  info:     { background: 'rgba(79,158,255,0.1)',  color: '#4f9eff',  border: 'rgba(79,158,255,0.25)'  },
  warning:  { background: 'rgba(255,184,48,0.1)',  color: '#ffb830',  border: 'rgba(255,184,48,0.25)'  },
  critical: { background: 'rgba(255,77,109,0.1)',  color: '#ff4d6d',  border: 'rgba(255,77,109,0.25)'  },
};

// Filter categories (ENFORCEMENT 5)
const FILTERS = [
  { key: 'All', label: 'All', events: null },
  { key: 'Security', label: 'Security', events: ['login', 'logout', 'trigger_fired', 'beneficiary_access'] },
  { key: 'Vault', label: 'Vault', events: ['vault_access', 'asset_created', 'asset_updated'] },
  { key: 'Guardian', label: 'Guardian', events: ['ping', 'trigger_fired'] },
  { key: 'Email', label: 'Email', events: ['email_sent', 'capsule_release'] },
];

// Helper to format time ago (ENFORCEMENT 5)
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// Format absolute date for hover
const formatAbsoluteDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE}/user/logs`);
        setLogs(response.data.data || []);
      } catch (error) {
        toast.error('Failed to load activity logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getEventConfig = (event) => {
    return EVENT_LABELS[event] || { label: event, icon: '📋', color: '#8899bb' };
  };

  const getSeverityStyle = (severity) => {
    return SEVERITY_STYLE[severity] || SEVERITY_STYLE.info;
  };

  // Filter logs based on active filter
  const filteredLogs = activeFilter === 'All' 
    ? logs 
    : logs.filter(log => {
        const filterConfig = FILTERS.find(f => f.key === activeFilter);
        if (!filterConfig || !filterConfig.events) return true;
        return filterConfig.events.includes(log.event);
      });

  if (isLoading) {
    return (
      <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stars" />
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-2)', marginTop: 16 }}>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="page spatial-bg">
        <div className="stars" />
        <div className="container" style={{ maxWidth: 900, padding: '40px 24px' }}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div style={{ 
            width: 64, height: 64, borderRadius: 20, 
            background: 'var(--bg-base)', 
            border: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <ClipboardList style={{ width: 28, height: 28, color: '#4f9eff' }} />
          </div>
          <h1 className="display" style={{ fontSize: 32, marginBottom: 8 }}>Activity Logs</h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)' }}>Track your account activity and security events</p>
        </motion.div>

        {/* Filter Bar (ENFORCEMENT 5) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: activeFilter === filter.key ? '#4f9eff' : 'var(--border)',
                background: activeFilter === filter.key ? 'rgba(79,158,255,0.15)' : 'var(--bg-base)',
                color: activeFilter === filter.key ? '#4f9eff' : 'var(--text-2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-base)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 24,
            padding: 24,
            minHeight: 300
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-base)',
              border: '1px solid var(--glass-border)',
              borderRadius: 24,
              marginTop: 24
            }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>
                📋
              </div>
              <h3 style={{ 
                fontSize: 20, fontWeight: 700, 
                color: 'var(--text-primary)', marginBottom: 8 
              }}>
                No activity recorded yet
              </h3>
              <p style={{ 
                fontSize: 14, color: 'var(--text-2)', 
                maxWidth: 340, margin: '0 auto'
              }}>
                Your security activity will 
                appear here as you use LastKey.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredLogs.map((log, index) => {
                const evt = getEventConfig(log.event);
                const sev = getSeverityStyle(log.severity);
                
                return (
                  <motion.div
                    key={log._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      padding: 16,
                      borderRadius: 16,
                      background: 'var(--bg-base)',
                      border: 'none',
                      borderLeft: `3px solid ${sev.color}`
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${evt.color}20`,
                      border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0
                    }}>
                      {evt.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>
                          {evt.label}
                        </span>
                        {/* Severity Badge (ENFORCEMENT 5) */}
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: 6,
                          background: sev.background, 
                          color: 'var(--text-primary)', 
                          border: 'none'
                        }}>
                          {log.severity}
                        </span>
                      </div>
                      
                      {log.details && (
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '4px 0', lineHeight: 1.5 }}>
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </p>
                      )}
                      
                      {/* Timestamp with hover tooltip (ENFORCEMENT 5) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span 
                          style={{ fontSize: 12, color: 'var(--text-3)' }}
                          title={formatAbsoluteDate(log.timestamp)}
                        >
                          {timeAgo(log.timestamp)}
                        </span>
                        {log.ip && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                            • IP: {log.ip}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Info Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ 
            textAlign: 'center', 
            fontSize: 12, 
            color: 'var(--text-3)', 
            marginTop: 24 
          }}
        >
          Showing {filteredLogs.length} of {logs.length} events • Hover over timestamps for exact dates
        </motion.p>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;
