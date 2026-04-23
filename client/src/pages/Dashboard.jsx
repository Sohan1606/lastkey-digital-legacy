import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { initSocket } from '../socket';
import GuardianProtocolPanel from '../components/GuardianProtocolPanel';
import ActivityFeed from '../components/ActivityFeed';
import LegacyTimeline from '../components/LegacyTimeline';
import LegacyReadinessScore from '../components/LegacyReadinessScore';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, Lock, Clock, Sparkles, Zap, Award, BarChart3,
  Loader2, Mic, Calendar, BookOpen, Trophy, Heart, Package, FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const IconDisplay = ({ iconName }) => {
  const icons = {
    users: Users,
    lock: Lock,
    clock: Clock,
    sparkles: Sparkles,
    zap: Zap,
    award: Award,
    chart: BarChart3
  };
  const Icon = icons[iconName] || Users;
  return <Icon className="w-5 h-5" />;
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dmsStatus, setDmsStatus] = useState({ status: 'active', remainingMinutes: 30 });
  const [isPremium, setIsPremium] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await axios.post(
        `${API_BASE}/auth/check-in`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Check-in recorded successfully!');
      setLastActive(new Date());
      queryClient.invalidateQueries(['user-stats']);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  // Fetch user stats and premium status
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/user/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Derive real DMS status from stats
  const [lastActive, setLastActive] = useState(null);
  
  useEffect(() => {
    if (stats?.data) {
      const { triggerStatus, inactivityDuration, lastActive: lastActiveRaw, isPremium: premium } = stats.data;
      const lastActiveDate = new Date(lastActiveRaw || Date.now());
      setLastActive(lastActiveRaw);
      const inactiveMs = Date.now() - lastActiveDate.getTime();
      const inactiveMinutes = Math.floor(inactiveMs / (1000 * 60));
      const remainingMinutes = Math.max(0, inactivityDuration - inactiveMinutes);

      setDmsStatus({ status: triggerStatus || 'active', remainingMinutes });
      setIsPremium(premium || false);
    }
  }, [stats]);

  // Fetch AI suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/ai/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch assets count
  const { data: assetsData } = useQuery({
    queryKey: ['assets-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch beneficiaries
  const { data: beneficiariesData } = useQuery({
    queryKey: ['beneficiaries-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/beneficiaries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch portal status for each beneficiary
  const { data: portalStatuses } = useQuery({
    queryKey: ['portal-statuses', beneficiariesData?.data?.beneficiaries],
    queryFn: async () => {
      if (!beneficiariesData?.data?.beneficiaries || beneficiariesData.data.beneficiaries.length === 0) return {};
      const statuses = {};
      await Promise.all(
        beneficiariesData.data.beneficiaries.map(async (b) => {
          try {
            const res = await axios.get(`${API_BASE}/beneficiaries/${b._id}/portal-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            statuses[b._id] = res.data.data;
          } catch {
            statuses[b._id] = null;
          }
        })
      );
      return statuses;
    },
    enabled: !!beneficiariesData?.data?.beneficiaries && beneficiariesData.data.beneficiaries.length > 0
  });

  // Fetch capsules count
  const { data: capsulesData } = useQuery({
    queryKey: ['capsules-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/capsules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch documents count
  const { data: documentsData } = useQuery({
    queryKey: ['documents-count'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/legal-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Extract suggestions array from data
  const suggestions = suggestionsData?.data || [];

  // Initialize socket and listen for DMS updates
  useEffect(() => {
    if (!user || !token) return;
    
    const socket = initSocket(token);
    
    const handleDMS = (data) => {
      setDmsStatus(data);
    };

    socket.on('dms-sync', handleDMS);
    socket.on('dms-update', handleDMS);

    return () => {
      socket.off('dms-sync', handleDMS);
      socket.off('dms-update', handleDMS);
    };
  }, [user, token]);

  // Handle ping to reset DMS timer
  const handlePing = async () => {
    try {
      const res = await axios.post(`${API_BASE}/user/ping`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDmsStatus({ status: res.data.user?.triggerStatus || 'active', remainingMinutes: res.data.user?.inactivityDuration || 30 });
      toast.success('â I\'m Here â Timer Reset', {
        icon: 'ð',
        style: {
          background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
          color: 'var(--text-primary)',
          border: 'none',
        }
      });
      
      // Play ping sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); 
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.35);
      } catch (_e) {
        return;
      }
    } catch (error) {
      toast.error('Failed to reset timer');
    }
  };

  const priorityColors = {
    critical: 'from-red-500 to-rose-500',
    high: 'from-orange-500 to-yellow-500',
    medium: 'from-blue-500 to-indigo-500',
    low: 'from-gray-500 to-gray-700'
  };

  // Get time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        flex: 1,
        padding: '32px'
      }}>
        {/* TOP - Header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '80px 16px 20px 16px' : '32px 32px 24px 32px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {getTimeOfDay()}, {firstName} ð
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} · Your vault is secure
            </p>
          </div>
          <button 
            onClick={handleCheckIn}
            disabled={checkingIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--green-dim)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--green)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: checkingIn ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
              opacity: checkingIn ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!checkingIn) {
                e.target.style.background = 'rgba(34, 197, 94, 0.15)';
                e.target.style.borderColor = 'rgba(34, 197, 94, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(34, 197, 94, 0.1)';
              e.target.style.borderColor = 'rgba(34, 197, 94, 0.2)';
            }}
          >
            {checkingIn ? 'Checking in...' : 'Check In'}
          </button>
        </div>

        {/* MIDDLE - Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '24px 32px'
        }}>
          {/* Vault Items */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Vault Items
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--blue-dim)',
                border: '1px solid var(--blue-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
              </div>
            </div>
            <p style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 4px 0'
            }}>
              {assetsData?.data?.length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              encrypted & secured
            </p>
          </div>

          {/* Beneficiaries */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Beneficiaries
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--purple-dim)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
              </div>
            </div>
            <p style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 4px 0'
            }}>
              {beneficiariesData?.data?.beneficiaries?.length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              designated contacts
            </p>
          </div>

          {/* Active Triggers */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Active Triggers
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap style={{ width: '16px', height: '16px', color: '#22c55e' }} />
              </div>
            </div>
            <p style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 4px 0'
            }}>
              {dmsStatus.status === 'active' ? '1' : '0'}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              monitoring your account
            </p>
          </div>

          {/* Documents */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Documents
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(251, 146, 60, 0.1)',
                border: '1px solid rgba(251, 146, 60, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText style={{ width: '16px', height: '16px', color: '#fb923c' }} />
              </div>
            </div>
            <p style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 4px 0'
            }}>
              {documentsData?.data?.length || 0}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              verified documents
            </p>
          </div>
        </div>

        {/* BOTTOM - 2 column layout */}
        <div style={{
          display: 'flex',
          gap: '24px',
          padding: '0 32px 32px 32px'
        }}>
          {/* Left Column (60%) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Recent Activity */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Recent Activity
              </h3>
              <ActivityFeed />
            </div>

            {/* Guardian Protocol Panel */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Guardian Protocol
              </h3>
              <GuardianProtocolPanel dmsStatus={dmsStatus} onPing={handlePing} isPremium={isPremium} lastActive={lastActive} />
            </div>

            {/* Legacy Readiness Score */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Legacy Readiness
              </h3>
              <LegacyReadinessScore 
                assetCount={assetsData?.data?.length || 0}
                beneficiaryCount={beneficiariesData?.data?.beneficiaries?.length || 0}
                capsuleCount={capsulesData?.data?.capsules?.length || 0}
                documentCount={documentsData?.data?.length || 0}
                vaultUnlocked={false}
              />
            </div>
          </div>

          {/* Right Column (40%) */}
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Security Status */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Security Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>Email Verified</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>Vault Encrypted</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }}></div>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>2FA Not Enabled</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>
                    Last Check-in: {lastActive 
                      ? (Date.now() - new Date(lastActive).getTime() < 60000 
                          ? 'just now' 
                          : new Date(lastActive).toLocaleDateString())
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legacy Delivery Status */}
            {beneficiariesData?.data?.beneficiaries && beneficiariesData.data.beneficiaries.length > 0 && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '16px'
                }}>
                  Legacy Delivery Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {beneficiariesData.data.beneficiaries.map(beneficiary => {
                    const status = portalStatuses?.[beneficiary._id];
                    let statusColor = '#64748b';
                    let statusText = 'Pending';
                    
                    if (status?.isClaimed) {
                      statusColor = '#22c55e';
                      statusText = 'Claimed';
                    } else if (status?.hasAccess) {
                      statusColor = '#f59e0b';
                      statusText = 'Accessed';
                    } else if (status?.hasAccess === false && status?.message) {
                      statusColor = '#3b82f6';
                      statusText = 'Email Sent';
                    }
                    
                    return (
                      <div key={beneficiary._id} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0' }}>
                            {beneficiary.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: statusColor,
                            background: `${statusColor}15`,
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {statusText}
                          </span>
                        </div>
                        {status?.lastAccessed && (
                          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                            Last accessed: {new Date(status.lastAccessed).toLocaleDateString()}
                          </p>
                        )}
                        {status?.isClaimed && (
                          <p style={{ fontSize: '11px', color: '#22c55e', margin: '4px 0 0 0' }}>
                            ✓ Legacy transferred to their account
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => navigate('/vault')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--blue)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  }}
                >
                  + Add Vault Item
                </button>
                <button 
                  onClick={() => navigate('/beneficiaries')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--purple)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  }}
                >
                  + Add Beneficiary
                </button>
                <button 
                  onClick={() => navigate('/final-message')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                  }}
                >
                  Configure Trigger
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                AI Smart Suggestions
              </h3>
              {suggestionsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1,2].map(i => (
                    <div key={i} style={{
                      height: '64px',
                      background: '#1e293b',
                      borderRadius: 'var(--radius-md)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 0'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>â¨</div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--green)',
                    marginBottom: '4px'
                  }}>
                    Perfect Setup!
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: 0
                  }}>
                    Your digital legacy is fully optimized.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {suggestions.slice(0, 3).map((s, i) => {
                    const colors = {
                      critical: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
                      high: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' },
                      medium: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
                      low: { border: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b' }
                    };
                    const color = colors[s.priority] || colors.low;
                    
                    return (
                      <div 
                        key={s.id}
                        onClick={() => navigate('/' + s.action)}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${color.border}`,
                          background: color.bg,
                          color: color.text,
                          cursor: 'pointer',
                          transition: 'opacity 150ms'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                          }}>
                            {s.priority}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          marginBottom: '4px',
                          margin: 0
                        }}>
                          {s.title}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          opacity: 0.75,
                          margin: 0,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {s.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
