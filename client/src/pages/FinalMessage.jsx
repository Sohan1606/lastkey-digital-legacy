import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Users, Lock, Clock, ChevronRight, ChevronLeft, 
  Check, Calendar, Shield, Mail, Plus, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const FinalMessage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [message, setMessage] = useState('');
  const [attachVaultItems, setAttachVaultItems] = useState(false);
  const [attachCapsules, setAttachCapsules] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedCapsules, setSelectedCapsules] = useState([]);
  const [triggerType, setTriggerType] = useState('inactivity');
  const [triggerDate, setTriggerDate] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [benRes, assetRes, capRes] = await Promise.all([
          axios.get(`${API_BASE}/beneficiaries`),
          axios.get(`${API_BASE}/assets`),
          axios.get(`${API_BASE}/capsules`)
        ]);
        
        // Ensure data is always an array - handle different API response structures
        const benData = Array.isArray(benRes.data?.data?.beneficiaries) ? benRes.data.data.beneficiaries :
                       Array.isArray(benRes.data?.data) ? benRes.data.data :
                       Array.isArray(benRes.data) ? benRes.data : [];
        const assetData = Array.isArray(assetRes.data?.data) ? assetRes.data.data :
                         Array.isArray(assetRes.data) ? assetRes.data : [];
        const capData = Array.isArray(capRes.data?.data?.capsules) ? capRes.data.data.capsules :
                       Array.isArray(capRes.data?.data) ? capRes.data.data :
                       Array.isArray(capRes.data) ? capRes.data : [];
        
        setBeneficiaries(benData);
        setAssets(assetData);
        setCapsules(capData);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBeneficiary || !message.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post(`${API_BASE}/final-message`, {
        beneficiaryId: selectedBeneficiary,
        message: message,
        attachedAssetIds: attachVaultItems ? selectedAssets : [],
        attachedCapsuleIds: attachCapsules ? selectedCapsules : [],
        triggerType: triggerType,
        triggerDate: triggerType === 'date' ? triggerDate : null
      });
      
      toast.success('Final message created successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create final message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAsset = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleCapsule = (capsuleId) => {
    setSelectedCapsules(prev => 
      prev.includes(capsuleId) 
        ? prev.filter(id => id !== capsuleId)
        : [...prev, capsuleId]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedBeneficiary !== null;
      case 2: return message.trim().length > 0;
      case 3: return triggerType === 'inactivity' || (triggerType === 'date' && triggerDate);
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stars" />
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-2)', marginTop: 16 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ maxWidth: 800, padding: '40px 24px' }}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <div style={{ 
            width: 64, height: 64, borderRadius: 20, 
            background: 'linear-gradient(135deg, rgba(255,77,109,0.2), rgba(124,92,252,0.2))', 
            border: '1px solid rgba(255,77,109,0.3)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <MessageSquare style={{ width: 28, height: 28, color: '#ff4d6d' }} />
          </div>
          <h1 className="display" style={{ fontSize: 32, marginBottom: 8 }}>Send Final Message</h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)' }}>Your last words to loved ones</p>
        </motion.div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step >= s ? 'linear-gradient(135deg, #ff4d6d, #7c5cfc)' : 'var(--glass-2)',
                border: `1px solid ${step >= s ? 'rgba(255,77,109,0.5)' : 'var(--glass-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: step >= s ? 'white' : 'var(--text-3)'
              }}>
                {step > s ? <Check size={18} /> : s}
              </div>
              {s < 3 && (
                <div style={{
                  width: 60, height: 2,
                  background: step > s ? 'linear-gradient(90deg, #ff4d6d, #7c5cfc)' : 'var(--glass-border)'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--glass-1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 24,
            padding: 32,
            minHeight: 400
          }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Select Beneficiary */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={22} color="#4f9eff" /> Select Beneficiary
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
                  Choose who will receive your final message
                </p>

                {beneficiaries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>No beneficiaries added yet</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/beneficiaries')}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Plus size={16} /> Add Beneficiary
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {beneficiaries.map((b) => (
                      <motion.div
                        key={b._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedBeneficiary(b._id)}
                        style={{
                          padding: 20,
                          borderRadius: 16,
                          border: `2px solid ${selectedBeneficiary === b._id ? '#4f9eff' : 'var(--glass-border)'}`,
                          background: selectedBeneficiary === b._id ? 'rgba(79,158,255,0.1)' : 'var(--glass-2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 700, color: 'white'
                          }}>
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{b.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.relationship}</p>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{b.email}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Compose Message */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={22} color="#ff4d6d" /> Compose Message
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
                  Write your final words and attach any relevant items
                </p>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Your Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-2)',
                      color: 'var(--text-1)',
                      fontSize: 14,
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Attach Vault Items Toggle */}
                <div style={{ marginBottom: 16 }}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setAttachVaultItems(!attachVaultItems)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${attachVaultItems ? 'rgba(0,229,160,0.5)' : 'var(--glass-border)'}`,
                      background: attachVaultItems ? 'rgba(0,229,160,0.1)' : 'var(--glass-2)',
                      cursor: 'pointer'
                    }}
                  >
                    <Lock size={20} color={attachVaultItems ? '#00e5a0' : 'var(--text-3)'} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>Attach vault items</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Include selected digital assets</p>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: attachVaultItems ? '#00e5a0' : 'transparent',
                      border: `2px solid ${attachVaultItems ? '#00e5a0' : 'var(--text-3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {attachVaultItems && <Check size={14} color="white" />}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {attachVaultItems && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 12, paddingLeft: 28 }}
                      >
                        {assets.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No vault items available</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {assets.map((asset) => (
                              <div
                                key={asset._id}
                                onClick={() => toggleAsset(asset._id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: 10,
                                  borderRadius: 8,
                                  border: `1px solid ${selectedAssets.includes(asset._id) ? 'rgba(79,158,255,0.5)' : 'var(--glass-border)'}`,
                                  background: selectedAssets.includes(asset._id) ? 'rgba(79,158,255,0.1)' : 'transparent',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{
                                  width: 16, height: 16, borderRadius: 4,
                                  background: selectedAssets.includes(asset._id) ? '#4f9eff' : 'transparent',
                                  border: `2px solid ${selectedAssets.includes(asset._id) ? '#4f9eff' : 'var(--text-3)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {selectedAssets.includes(asset._id) && <Check size={10} color="white" />}
                                </div>
                                <span style={{ fontSize: 13 }}>{asset.platform}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Attach Capsules Toggle */}
                <div>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setAttachCapsules(!attachCapsules)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${attachCapsules ? 'rgba(124,92,252,0.5)' : 'var(--glass-border)'}`,
                      background: attachCapsules ? 'rgba(124,92,252,0.1)' : 'var(--glass-2)',
                      cursor: 'pointer'
                    }}
                  >
                    <Clock size={20} color={attachCapsules ? '#7c5cfc' : 'var(--text-3)'} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>Attach time capsules</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Include selected time capsules</p>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: attachCapsules ? '#7c5cfc' : 'transparent',
                      border: `2px solid ${attachCapsules ? '#7c5cfc' : 'var(--text-3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {attachCapsules && <Check size={14} color="white" />}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {attachCapsules && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 12, paddingLeft: 28 }}
                      >
                        {capsules.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No capsules available</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {capsules.map((capsule) => (
                              <div
                                key={capsule._id}
                                onClick={() => toggleCapsule(capsule._id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: 10,
                                  borderRadius: 8,
                                  border: `1px solid ${selectedCapsules.includes(capsule._id) ? 'rgba(124,92,252,0.5)' : 'var(--glass-border)'}`,
                                  background: selectedCapsules.includes(capsule._id) ? 'rgba(124,92,252,0.1)' : 'transparent',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{
                                  width: 16, height: 16, borderRadius: 4,
                                  background: selectedCapsules.includes(capsule._id) ? '#7c5cfc' : 'transparent',
                                  border: `2px solid ${selectedCapsules.includes(capsule._id) ? '#7c5cfc' : 'var(--text-3)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {selectedCapsules.includes(capsule._id) && <Check size={10} color="white" />}
                                </div>
                                <span style={{ fontSize: 13 }}>{capsule.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Step 3: Choose Trigger */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={22} color="#00e5a0" /> Choose Trigger
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
                  When should this message be delivered?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Inactivity Option */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setTriggerType('inactivity')}
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      border: `2px solid ${triggerType === 'inactivity' ? '#00e5a0' : 'var(--glass-border)'}`,
                      background: triggerType === 'inactivity' ? 'rgba(0,229,160,0.1)' : 'var(--glass-2)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: triggerType === 'inactivity' ? 'rgba(0,229,160,0.2)' : 'var(--glass-1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Shield size={24} color={triggerType === 'inactivity' ? '#00e5a0' : 'var(--text-3)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 16 }}>After Inactivity</p>
                          {triggerType === 'inactivity' && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(0,229,160,0.2)',
                              color: '#00e5a0', fontSize: 11, fontWeight: 600
                            }}>
                              Selected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                          Uses your Guardian Protocol settings. The message will be delivered 
                          if you don't check in for the specified inactivity period.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Date Option */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setTriggerType('date')}
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      border: `2px solid ${triggerType === 'date' ? '#4f9eff' : 'var(--glass-border)'}`,
                      background: triggerType === 'date' ? 'rgba(79,158,255,0.1)' : 'var(--glass-2)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: triggerType === 'date' ? 'rgba(79,158,255,0.2)' : 'var(--glass-1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Calendar size={24} color={triggerType === 'date' ? '#4f9eff' : 'var(--text-3)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 16 }}>On a Specific Date</p>
                          {triggerType === 'date' && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(79,158,255,0.2)',
                              color: '#4f9eff', fontSize: 11, fontWeight: 600
                            }}>
                              Selected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
                          Choose a specific date when this message should be delivered.
                        </p>
                        {triggerType === 'date' && (
                          <input
                            type="date"
                            value={triggerDate}
                            onChange={(e) => setTriggerDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: '1px solid var(--glass-border)',
                              background: 'var(--glass-1)',
                              color: 'var(--text-1)',
                              fontSize: 14
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-1)',
              color: 'var(--text-2)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <ChevronLeft size={18} />
            {step === 1 ? 'Cancel' : 'Back'}
          </motion.button>

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.02 : 1 }}
              whileTap={{ scale: canProceed() ? 0.98 : 1 }}
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: canProceed() ? 'linear-gradient(135deg, #4f9eff, #7c5cfc)' : 'var(--glass-2)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                opacity: canProceed() ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              Next
              <ChevronRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.02 : 1 }}
              whileTap={{ scale: canProceed() ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: canProceed() && !isSubmitting ? 'linear-gradient(135deg, #ff4d6d, #7c5cfc)' : 'var(--glass-2)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: canProceed() && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: canProceed() && !isSubmitting ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {isSubmitting ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Creating...</>
              ) : (
                <><MessageSquare size={18} /> Create Final Message</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalMessage;
