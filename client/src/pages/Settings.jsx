import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Bell, User, LogOut, Save, Key, CheckCircle, Settings as SettingsIcon, Lock, Smartphone, Mail, Globe, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    inactivityDuration: user?.inactivityDuration || 60,
    phone: user?.phone || '',
    alertChannels: user?.alertChannels || ['email'],
  });
  const [recoveryPassphrase, setRecoveryPassphrase] = useState('');
  const [recoverySet, setRecoverySet] = useState(user?.recoveryPassphraseSet || false);

  useEffect(() => {
    if (user) {
      setSettings({
        inactivityDuration: user.inactivityDuration || 60,
        phone: user.phone || '',
        alertChannels: user.alertChannels || ['email'],
      });
      setRecoverySet(user.recoveryPassphraseSet || false);
    }
  }, [user]);

  const settingsMutation = useMutation({
    mutationFn: (data) => axios.put(`${API_BASE}/user/settings`, data, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Settings saved!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const recoveryMutation = useMutation({
    mutationFn: (passphrase) => axios.put(`${API_BASE}/user/recovery-passphrase`, { passphrase }, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Recovery passphrase saved!');
      setRecoveryPassphrase('');
      setRecoverySet(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => toast.error('Failed to save recovery passphrase'),
  });

  const toggleChannel = (channel) => {
    setSettings(prev => ({
      ...prev,
      alertChannels: prev.alertChannels.includes(channel)
        ? prev.alertChannels.filter(c => c !== channel)
        : [...prev.alertChannels, channel],
    }));
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{
        marginLeft: '240px',
        minHeight: '100vh',
        background: '#030508',
        flex: 1,
        padding: '32px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(79, 158, 255, 0.2), rgba(124, 92, 252, 0.2))',
                border: '1px solid rgba(79, 158, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SettingsIcon style={{ width: '28px', height: '28px', color: '#4f9eff' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '8px'
                }}>
                  Settings
                </h1>
                <p style={{ fontSize: '16px', color: '#64748b' }}>
                  Manage your Guardian Protocol and notification preferences
                </p>
              </div>
            </div>
          </motion.div>

          {/* Profile Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#050d1a',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <User style={{ width: '20px', height: '20px', color: '#4f9eff' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Profile Information
              </h2>
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#e2e8f0',
                  marginBottom: '8px'
                }}>Full Name</label>
                <input 
                  type="text" 
                  value={user?.name || ''} 
                  disabled 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#030508',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '14px',
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#e2e8f0',
                  marginBottom: '8px'
                }}>Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#030508',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '14px',
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Guardian Protocol Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#050d1a',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Shield style={{ width: '20px', height: '20px', color: '#00e5a0' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Guardian Protocol
              </h2>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#e2e8f0',
                marginBottom: '8px'
              }}>Inactivity Period (minutes)</label>
              <input
                type="number"
                min="1"
                max="525600"
                value={settings.inactivityDuration}
                onChange={e => setSettings(prev => ({ ...prev, inactivityDuration: parseInt(e.target.value, 10) || 60 }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#030508',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                Your beneficiaries are notified after {settings.inactivityDuration} minutes of inactivity. 
                Recommended: 1440 (1 day) or 43200 (30 days).
              </p>
            </div>
          </motion.div>

          {/* Emergency Recovery Passphrase Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: '#050d1a',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Key style={{ width: '20px', height: '20px', color: '#ffb830' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Emergency Recovery Passphrase
                {recoverySet && <CheckCircle size={16} style={{ marginLeft: '8px', color: '#00e5a0' }} />}
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Set a passphrase your beneficiaries can use to decrypt your vault in an emergency.
              This is <strong>different from your account password</strong>. Write it down and share it safely.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <input 
                type="password" 
                placeholder={recoverySet ? "Update recovery passphrase..." : "Set recovery passphrase..."}
                value={recoveryPassphrase}
                onChange={e => setRecoveryPassphrase(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 16px',
                  background: '#030508',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (recoveryPassphrase.length < 8) {
                    toast.error('Passphrase must be at least 8 characters');
                    return;
                  }
                  recoveryMutation.mutate(recoveryPassphrase);
                }}
                disabled={recoveryMutation.isPending || !recoveryPassphrase}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: recoverySet ? 'linear-gradient(135deg, #00e5a0, #4f9eff)' : 'linear-gradient(135deg, #4f9eff, #7c5cfc)', 
                  color: '#001a12', 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  cursor: (recoveryMutation.isPending || !recoveryPassphrase) ? 'not-allowed' : 'pointer',
                  opacity: (recoveryMutation.isPending || !recoveryPassphrase) ? 0.6 : 1,
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  if (!(recoveryMutation.isPending || !recoveryPassphrase)) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 158, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(recoveryMutation.isPending || !recoveryPassphrase)) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {recoveryMutation.isPending ? 'Saving...' : (recoverySet ? 'Update Passphrase' : 'Save Passphrase')}
              </motion.button>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#64748b', 
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#ffb830'
              }}>
                <AlertTriangle size={12} />
                We do not store this passphrase. If you lose it, your beneficiaries cannot decrypt your vault.
              </span>
              {recoverySet && (
                <span style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#00e5a0'
                }}>
                  <CheckCircle size={12} />
                  Recovery passphrase is set
                </span>
              )}
            </div>
          </motion.div>

          {/* Notifications Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: '#050d1a',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Bell style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Alert Channels
              </h2>
            </div>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {[
                { id: 'email', name: 'Email', icon: Mail, description: 'Email alerts', enabled: true },
                { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone, description: 'Requires phone number + provider integration', enabled: false },
                { id: 'telegram', name: 'Telegram', icon: Globe, description: 'Requires Telegram bot token', enabled: false }
              ].map(channel => {
                const Icon = channel.icon;
                const isEnabled = settings.alertChannels.includes(channel.id);
                return (
                  <div
                    key={channel.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: isEnabled ? 'rgba(79,158,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isEnabled ? 'rgba(79,158,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = isEnabled ? 'rgba(79,158,255,0.08)' : 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = isEnabled ? 'rgba(79,158,255,0.06)' : 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isEnabled ? 'rgba(79,158,255,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isEnabled ? 'rgba(79,158,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ width: '20px', height: '20px', color: isEnabled ? '#4f9eff' : '#64748b' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px' }}>
                          {channel.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          {channel.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      disabled={!channel.enabled}
                      style={{
                        width: '48px',
                        height: '24px',
                        borderRadius: '12px',
                        background: isEnabled ? '#4f9eff' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: channel.enabled ? 'pointer' : 'not-allowed',
                        position: 'relative',
                        transition: 'background 0.2s',
                        padding: 0,
                        flexShrink: 0,
                        opacity: channel.enabled ? 1 : 0.5
                      }}
                    >
                      <motion.div
                        animate={{ x: isEnabled ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          background: 'white', 
                          position: 'absolute', 
                          top: 4,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#e2e8f0',
                marginBottom: '8px'
              }}>Phone Number (for WhatsApp alerts)</label>
              <input 
                type="tel" 
                value={settings.phone} 
                onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} 
                placeholder="+1234567890"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#030508',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 150ms'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: '16px' }}
          >
            <button
              onClick={() => settingsMutation.mutate(settings)}
              disabled={settingsMutation.isPending}
              style={{ 
                flex: 1, 
                padding: '14px 24px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)', 
                border: 'none', 
                color: '#ffffff', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: settingsMutation.isPending ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                opacity: settingsMutation.isPending ? 0.7 : 1,
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                if (!settingsMutation.isPending) {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #6d28d9)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 158, 255, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!settingsMutation.isPending) {
                  e.target.style.background = 'linear-gradient(135deg, #4f9eff, #7c5cfc)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <Save size={16} />
              {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              style={{ 
                padding: '14px 24px', 
                borderRadius: '8px', 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#ef4444', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

