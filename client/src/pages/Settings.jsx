import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Bell, User, LogOut, Save, Key, CheckCircle } from 'lucide-react';

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
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container-sm">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>Settings</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 36 }}>Manage your Guardian Protocol and notification preferences</p>

          {/* Profile */}
          <div style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <User size={16} color="var(--ion)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Profile</h2>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>Full Name</label>
                <input type="text" value={user?.name || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          {/* Guardian Protocol */}
          <div style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Shield size={16} color="var(--ion)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Guardian Protocol</h2>
            </div>
            <div>
              <label>Inactivity Period (minutes)</label>
              <input
                type="number"
                min="1"
                max="525600"
                value={settings.inactivityDuration}
                onChange={e => setSettings(prev => ({ ...prev, inactivityDuration: parseInt(e.target.value, 10) || 60 }))}
              />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Your beneficiaries are notified after {settings.inactivityDuration} minutes of inactivity. Recommended: 1440 (1 day) or 43200 (30 days).
              </p>
            </div>
          </div>

          {/* Emergency Recovery Passphrase */}
          <div style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Key size={16} color="var(--ion)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Emergency Recovery Passphrase
                {recoverySet && <CheckCircle size={14} color="#00e5a0" style={{ marginLeft: 8, verticalAlign: 'middle' }} />}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Set a passphrase your beneficiaries can use to decrypt your vault in an emergency.
              This is <strong>different from your account password</strong>. Write it down and share it safely.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input 
                type="password" 
                placeholder={recoverySet ? "Update recovery passphrase..." : "Set recovery passphrase..."}
                value={recoveryPassphrase}
                onChange={e => setRecoveryPassphrase(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
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
                  borderRadius: 12, 
                  border: 'none', 
                  background: recoverySet ? 'linear-gradient(135deg, #00e5a0, #4f9eff)' : 'linear-gradient(135deg, #4f9eff, #7c5cfc)', 
                  color: '#001a12', 
                  fontWeight: 700, 
                  fontSize: 14, 
                  cursor: (recoveryMutation.isPending || !recoveryPassphrase) ? 'not-allowed' : 'pointer',
                  opacity: (recoveryMutation.isPending || !recoveryPassphrase) ? 0.6 : 1
                }}
              >
                {recoveryMutation.isPending ? 'Saving...' : (recoverySet ? 'Update Passphrase' : 'Save Passphrase')}
              </motion.button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
              <span style={{ color: '#ffb830' }}>⚠️</span> We do not store this passphrase. If you lose it, your beneficiaries cannot decrypt your vault.
              {recoverySet && <span style={{ color: '#00e5a0', marginLeft: 8 }}>✓ Recovery passphrase is set</span>}
            </p>
          </div>

          {/* Notifications */}
          <div style={{ background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Bell size={16} color="var(--ion)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Alert Channels</h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {['email', 'whatsapp', 'telegram'].map(ch => (
                <div
                  key={ch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: settings.alertChannels.includes(ch) ? 'rgba(79,158,255,0.06)' : 'transparent',
                    border: `1px solid ${settings.alertChannels.includes(ch) ? 'rgba(79,158,255,0.2)' : 'var(--glass-border)'}`,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 2px', textTransform: 'capitalize' }}>{ch}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                      {ch === 'email'
                        ? 'Email alerts'
                        : ch === 'whatsapp'
                          ? 'Requires phone number + provider integration'
                          : 'Requires Telegram bot token'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleChannel(ch)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      background: settings.alertChannels.includes(ch) ? 'var(--ion)' : 'var(--glass-border)',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <motion.div
                      animate={{ x: settings.alertChannels.includes(ch) ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <label>Phone Number (for WhatsApp alerts)</label>
              <input type="tel" value={settings.phone} onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1234567890" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => settingsMutation.mutate(settings)}
              disabled={settingsMutation.isPending}
              style={{ flex: 1, padding: '14px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#4f9eff,#7c5cfc)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: settingsMutation.isPending ? 0.7 : 1 }}
            >
              <Save size={15} />
              {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              style={{ padding: '14px 24px', borderRadius: 12, background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', color: 'var(--danger)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;

