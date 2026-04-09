import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  User,
  Shield,
  Users,
  Mail,
  Lock,
  CheckCircle,
  Plus,
  X,
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Onboarding = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    inactivityDuration: 60,
    alertChannels: ['email'],
    beneficiaries: [],
    firstMessageTitle: '',
    firstMessageContent: '',
    firstMessageRecipient: ''
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (onboardingData) => {
      const { data } = await axios.post(`${API_BASE}/user/onboarding-complete`, onboardingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('Welcome to LastKey! Your digital legacy journey begins.');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to complete onboarding');
    }
  });

  const steps = [
    { id: 0, title: 'Welcome', icon: Heart, color: '#ff4d6d' },
    { id: 1, title: 'Profile', icon: User, color: '#4f9eff' },
    { id: 2, title: 'Guardian', icon: Shield, color: '#00e5a0' },
    { id: 3, title: 'Loved Ones', icon: Users, color: '#a78bfa' },
    { id: 4, title: 'First Message', icon: Mail, color: '#ffb830' },
    { id: 5, title: 'Complete', icon: CheckCircle, color: '#00e5a0' }
  ];

  const handleNext = () => {
    if (currentStep === 1 && (!formData.name.trim() || !formData.email.trim())) {
      toast.error('Please fill in your name and email');
      return;
    }
    if (currentStep === 2 && formData.inactivityDuration < 30) {
      toast.error('Please set a valid inactivity duration');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleAddBeneficiary = () => {
    setFormData({
      ...formData,
      beneficiaries: [...formData.beneficiaries, { name: '', email: '', relationship: 'other' }]
    });
  };

  const handleRemoveBeneficiary = (index) => {
    setFormData({
      ...formData,
      beneficiaries: formData.beneficiaries.filter((_, i) => i !== index)
    });
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate({
      inactivityDuration: formData.inactivityDuration,
      phone: formData.phone,
      alertChannels: formData.alertChannels
    });
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
  };

  return (
    <div className="page spatial-bg">
      <div className="stars" />
      <div className="container" style={{ paddingTop: 40, maxWidth: 800 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <h1 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
            Setup Your Legacy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
            Step {currentStep + 1} of {steps.length} — {steps[currentStep].title}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {steps.map((step, i) => (
              <div
                key={step.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= currentStep
                    ? `linear-gradient(90deg, ${step.color}, ${step.color}aa)`
                    : 'var(--glass-border)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                animate={{
                  scale: i === currentStep ? 1.2 : 1,
                  opacity: i <= currentStep ? 1 : 0.4
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: i <= currentStep ? `${step.color}20` : 'var(--glass-1)',
                  border: `2px solid ${i <= currentStep ? step.color : 'var(--glass-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon size={20} color={i <= currentStep ? step.color : 'var(--text-3)'} />
              </motion.div>
            );
          })}
        </div>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--glass-2)',
            backdropFilter: 'blur(32px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 28,
            padding: 40,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Glow Effects */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,158,255,0.1),transparent)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.08),transparent)', filter: 'blur(50px)' }} />

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: currentStep === 0 ? 'transparent' : 'var(--glass-1)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                color: currentStep === 0 ? 'var(--text-3)' : 'var(--text-1)',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <ChevronLeft size={16} />
              Back
            </motion.button>

            <div style={{ fontSize: 14, fontWeight: 600, color: steps[currentStep].color }}>
              {steps[currentStep].title}
            </div>

            {currentStep < steps.length - 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #4f9eff, #7c5cfc)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: 'var(--glow-ion)'
                }}
              >
                Continue
                <ChevronRight size={16} />
              </motion.button>
            )}

            {currentStep === steps.length - 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                disabled={completeOnboardingMutation.isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #00e5a0, #4f9eff)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: 'var(--glow-pulse)'
                }}
              >
                {completeOnboardingMutation.isPending ? 'Processing...' : 'Complete Setup'}
                <CheckCircle size={16} />
              </motion.button>
            )}
          </div>

          {/* Step Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait" custom={currentStep}>
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center', padding: '20px 0' }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ marginBottom: 24 }}
                  >
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#ff4d6d,#ff6b8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 40px rgba(255,77,109,0.4)' }}>
                      <Heart size={36} color="white" />
                    </div>
                  </motion.div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f4ff', marginBottom: 12 }}>Welcome to LastKey</h2>
                  <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    Your love deserves to live forever. Let's set up your digital legacy in just a few steps.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto' }}>
                    {[
                      { icon: Shield, title: 'Secure', desc: 'AES-256 Encryption', color: '#00e5a0' },
                      { icon: Clock, title: 'Guardian', desc: 'Auto Protection', color: '#4f9eff' },
                      { icon: Heart, title: 'Legacy', desc: 'For Your Loved Ones', color: '#ff4d6d' }
                    ].map((feat, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -4 }}
                        style={{
                          padding: 16,
                          background: 'var(--glass-1)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 16
                        }}
                      >
                        <feat.icon size={24} color={feat.color} style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{feat.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{feat.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Profile */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ padding: '20px 0' }}
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 24, textAlign: 'center' }}>Your Profile</h2>
                  <div style={{ display: 'grid', gap: 20, maxWidth: 500, margin: '0 auto' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com"
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone (Optional)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="For WhatsApp alerts"
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Guardian Protocol */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ padding: '20px 0' }}
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 24, textAlign: 'center' }}>Guardian Protocol</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 32 }}>
                    How long should we wait before alerting your loved ones?
                  </p>
                  <div style={{ maxWidth: 400, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactivity Duration</label>
                      <select
                        value={formData.inactivityDuration}
                        onChange={(e) => setFormData({ ...formData, inactivityDuration: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15 }}
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={240}>4 hours</option>
                        <option value={720}>12 hours</option>
                        <option value={1440}>24 hours</option>
                        <option value={10080}>7 days</option>
                      </select>
                    </div>
                    <div style={{ padding: 20, background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <Shield size={20} color="#00e5a0" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#00e5a0' }}>Guardian Protocol Active</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        After {formData.inactivityDuration >= 60 ? `${formData.inactivityDuration / 60} hour${formData.inactivityDuration >= 120 ? 's' : ''}` : `${formData.inactivityDuration} minutes`} of inactivity, we'll send alerts to your designated beneficiaries.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Beneficiaries */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ padding: '20px 0' }}
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 8, textAlign: 'center' }}>Your Loved Ones</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 24 }}>
                    Add people who will receive your legacy
                  </p>
                  <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    {formData.beneficiaries.map((b, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 16, padding: 16, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 16 }}
                      >
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                          <input
                            type="text"
                            value={b.name}
                            onChange={(e) => {
                              const updated = [...formData.beneficiaries];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setFormData({ ...formData, beneficiaries: updated });
                            }}
                            placeholder="Full name"
                            style={{ flex: 1, padding: '10px 12px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 10, color: '#f0f4ff', fontSize: 13 }}
                          />
                          <button onClick={() => handleRemoveBeneficiary(i)} style={{ padding: 10, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 10, cursor: 'pointer' }}>
                            <X size={16} color="#ff4d6d" />
                          </button>
                        </div>
                        <input
                          type="email"
                          value={b.email}
                          onChange={(e) => {
                            const updated = [...formData.beneficiaries];
                            updated[i] = { ...updated[i], email: e.target.value };
                            setFormData({ ...formData, beneficiaries: updated });
                          }}
                          placeholder="Email address"
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 10, color: '#f0f4ff', fontSize: 13, marginBottom: 12 }}
                        />
                        <select
                          value={b.relationship}
                          onChange={(e) => {
                            const updated = [...formData.beneficiaries];
                            updated[i] = { ...updated[i], relationship: e.target.value };
                            setFormData({ ...formData, beneficiaries: updated });
                          }}
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 10, color: '#f0f4ff', fontSize: 13 }}
                        >
                          <option value="spouse">Spouse</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="friend">Friend</option>
                          <option value="lawyer">Lawyer</option>
                          <option value="other">Other</option>
                        </select>
                      </motion.div>
                    ))}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddBeneficiary}
                      style={{
                        width: '100%',
                        padding: 14,
                        background: 'var(--glass-1)',
                        border: '1px dashed var(--glass-border)',
                        borderRadius: 12,
                        color: 'var(--text-2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      <Plus size={16} />
                      Add Beneficiary
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: First Message */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ padding: '20px 0' }}
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 8, textAlign: 'center' }}>Leave a Message</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 24 }}>
                    Write a heartfelt message for your loved ones (optional)
                  </p>
                  <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
                      <input
                        type="text"
                        value={formData.firstMessageTitle}
                        onChange={(e) => setFormData({ ...formData, firstMessageTitle: e.target.value })}
                        placeholder="e.g., For my family's future"
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15 }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                      <textarea
                        value={formData.firstMessageContent}
                        onChange={(e) => setFormData({ ...formData, firstMessageContent: e.target.value })}
                        placeholder="Write your message here..."
                        rows={5}
                        style={{ width: '100%', padding: '14px 16px', background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#f0f4ff', fontSize: 15, resize: 'none' }}
                      />
                    </div>
                    <div style={{ padding: 16, background: 'rgba(255,184,48,0.08)', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Sparkles size={16} color="#ffb830" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#ffb830' }}>Pro Tip</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        You can also create time capsules later to schedule messages for specific dates.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Complete */}
              {currentStep === 5 && (
                <motion.div
                  key="step-5"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center', padding: '20px 0' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ marginBottom: 24 }}
                  >
                    <div style={{ width: 100, height: 100, borderRadius: 28, background: 'linear-gradient(135deg,#00e5a0,#4f9eff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 60px rgba(0,229,160,0.4)' }}>
                      <CheckCircle size={48} color="white" />
                    </div>
                  </motion.div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f4ff', marginBottom: 12 }}>You're All Set!</h2>
                  <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    Your digital legacy is ready to be built. Start adding vault items, create time capsules, and preserve your memories.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto' }}>
                    {[
                      { label: 'Vault Items', value: 0, color: '#4f9eff' },
                      { label: 'Loved Ones', value: formData.beneficiaries.length, color: '#a78bfa' },
                      { label: 'Time Capsules', value: 0, color: '#ffb830' }
                    ].map((stat, i) => (
                      <div key={i} style={{ padding: 16, background: 'var(--glass-1)', border: '1px solid var(--glass-border)', borderRadius: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
