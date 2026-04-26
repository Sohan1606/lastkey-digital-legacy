import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Users, Lock, Clock, ChevronRight, ChevronLeft, 
  Check, Calendar, Shield, Mail, Plus, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

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
  const [subject, setSubject] = useState('');
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
        subject: subject,
        message: message,
        attachedAssetIds: attachVaultItems ? selectedAssets : [],
        attachedCapsuleIds: attachCapsules ? selectedCapsules : [],
        triggerType: triggerType,
        triggerDate: triggerType === 'date' ? triggerDate : null
      });
      
      toast.success('Final message saved successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save final message');
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
    <DashboardLayout>
      <div style={{
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--bg-base)'
      }}>
        {/* PAGE HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79,158,255,0.15), rgba(167,139,250,0.15))',
              border: '1px solid rgba(79,158,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              ✉️
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Final Message
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0'
              }}>
                Write your last words to the people you love
              </p>
            </div>
          </div>
        </div>

        {/* TOP INFO BANNER */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(79,158,255,0.06)',
          border: '1px solid rgba(79,158,255,0.15)',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>💙</span>
          <div>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.6'
            }}>
              This message will be delivered to your loved ones 
              when your legacy is activated. Write freely — 
              only your designated beneficiaries will ever read this.
            </p>
          </div>
        </div>

        {/* RECIPIENT SELECTOR CARD */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Who receives this message?
          </h2>

          {beneficiaries.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: '16px'
            }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}>
                No beneficiaries added yet
              </p>
              <button
                onClick={() => navigate('/beneficiaries')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Beneficiary
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {beneficiaries.map((b) => (
                <button
                  key={b._id}
                  onClick={() => setSelectedBeneficiary(b._id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedBeneficiary === b._id
                      ? '1px solid rgba(79,158,255,0.5)'
                      : '1px solid var(--border)',
                    background: selectedBeneficiary === b._id
                      ? 'rgba(79,158,255,0.1)'
                      : 'var(--bg-elevated)',
                    color: selectedBeneficiary === b._id
                      ? 'var(--blue)'
                      : 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  👤 {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MESSAGE EDITOR CARD */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Your Message
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-hover)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write what is in your heart..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-hover)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6',
                minHeight: '300px'
              }}
            />
          </div>
        </div>

        {/* PREVIEW CARD */}
        {message && (
          <div style={{
            background: 'rgba(79,158,255,0.03)',
            border: '1px solid rgba(79,158,255,0.1)',
            borderRadius: '16px',
            padding: '32px',
            fontFamily: 'Georgia, serif',
            lineHeight: '1.9',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Preview
            </h3>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message}</p>
          </div>
        )}

        {/* SAVE/STATUS SECTION */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px'
        }}>
          <div>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              Auto-saved
            </p>
            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              margin: '4px 0 0 0'
            }}>
              {new Date().toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedBeneficiary || !message.trim()}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSubmitting || !selectedBeneficiary || !message.trim()
                ? 'not-allowed'
                : 'pointer',
              opacity: isSubmitting || !selectedBeneficiary || !message.trim() ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Message'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FinalMessage;
