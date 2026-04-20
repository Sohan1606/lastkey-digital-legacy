import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, CheckCircle, ArrowRight, Shield, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { encryptAssetData } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MigrationManager = ({ vaultPassword }) => {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [migratingAssets, setMigratingAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/migration/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setStatus(res.data.data);
        // Show modal if migration is needed
        if (res.data.data.needsMigration && !res.data.data.pendingReencryption) {
          setShowModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to check migration status:', err);
    }
  };

  const startMigration = async () => {
    if (!vaultPassword) {
      toast.error('Please unlock your vault first');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/migration/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMigratingAssets(res.data.data.assets);
        toast.success(`${res.data.data.success} assets ready for migration`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start migration');
    }
    setLoading(false);
  };

  const migrateAsset = async (asset) => {
    if (!vaultPassword) {
      toast.error('Vault password required');
      return;
    }

    setLoading(true);
    try {
      // Re-encrypt with client-side encryption
      const encryptedData = await encryptAssetData(
        JSON.stringify(asset.decryptedData),
        vaultPassword
      );

      // Complete migration
      await axios.post(`${API_BASE}/migration/complete/${asset.assetId}`,
        { encryptedData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Asset migrated successfully');
      
      // Remove from migrating list
      setMigratingAssets(prev => prev.filter(a => a.assetId !== asset.assetId));
      
      // Refresh status
      checkMigrationStatus();
    } catch (err) {
      toast.error('Failed to migrate asset');
    }
    setLoading(false);
  };

  const skipAsset = async (assetId) => {
    try {
      await axios.post(`${API_BASE}/migration/skip/${assetId}`,
        { reason: 'User skipped' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMigratingAssets(prev => prev.filter(a => a.assetId !== assetId));
      toast.success('Asset skipped');
    } catch (err) {
      toast.error('Failed to skip asset');
    }
  };

  // Don't show if no migration needed
  if (!status?.needsMigration && migratingAssets.length === 0) {
    return null;
  }

  return (
    <>
      {/* Migration Alert Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,184,48,0.15), rgba(255,120,48,0.15))',
          border: '1px solid rgba(255,184,48,0.3)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,184,48,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} style={{ color: '#ffb830' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Security Upgrade Required
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {status?.totalLegacyAssets} asset(s) need to be migrated to our new 
              client-side encryption for enhanced security.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,184,48,0.3)',
              background: 'rgba(255,184,48,0.1)',
              color: '#ffb830',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Migrate Now
          </motion.button>
        </div>
      </motion.div>

      {/* Migration Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 24
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--glass-1)',
                border: '1px solid var(--glass-border)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 600,
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Shield size={28} style={{ color: '#00e5a0' }} />
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Asset Migration</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {migratingAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(79,158,255,0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <Lock size={36} style={{ color: '#00e5a0' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                    Upgrade Your Asset Security
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>
                    We're upgrading to client-side encryption for maximum security. 
                    Your assets will be re-encrypted in your browser - our servers 
                    will never see your unencrypted data.
                  </p>
                  
                  <div style={{
                    background: 'var(--glass-2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                    textAlign: 'left'
                  }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      What will happen:
                    </h4>
                    <ul style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, paddingLeft: 20 }}>
                      <li>Assets will be decrypted temporarily</li>
                      <li>Re-encrypted with your vault password in your browser</li>
                      <li>Only encrypted data sent to server</li>
                      <li>Zero-knowledge security achieved</li>
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startMigration}
                    disabled={loading}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                      color: '#001a12',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Preparing...' : `Migrate ${status?.totalLegacyAssets} Assets`}
                  </motion.button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>
                    Click "Migrate" for each asset to re-encrypt it with client-side encryption.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {migratingAssets.map((asset, index) => (
                      <motion.div
                        key={asset.assetId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 16,
                          background: 'var(--glass-2)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'rgba(124,92,252,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Lock size={18} style={{ color: '#7c5cfc' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>
                              {asset.decryptedData?.name || `Asset ${index + 1}`}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              {asset.type}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => skipAsset(asset.assetId)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-3)',
                              fontSize: 13,
                              cursor: 'pointer'
                            }}
                          >
                            Skip
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => migrateAsset(asset)}
                            disabled={loading}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                              color: '#001a12',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            Migrate <ArrowRight size={14} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MigrationManager;
