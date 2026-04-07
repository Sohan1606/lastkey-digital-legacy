import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Shield, 
  Heart, 
  Clock, 
  CheckCircle, 
  Users, 
  Lock, 
  Zap,
  Award,
  Mail,
  Phone,
  Plus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Onboarding = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Welcome
    // Step 2: Personal Info
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Step 3: Guardian Protocol
    inactivityDuration: 60,
    alertChannels: ['email'],
    // Step 4: Beneficiaries
    beneficiaries: [],
    // Step 5: First Message
    firstMessageTitle: '',
    firstMessageContent: '',
    firstMessageRecipient: '',
    // Step 6: Vault Setup
    vaultItems: []
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
      console.error('Onboarding error:', error);
      toast.error('Failed to complete onboarding');
    }
  });

  const steps = [
    {
      id: 0,
      title: 'Welcome to LastKey',
      description: 'Your love deserves to live forever. Let us guide you through setting up your digital legacy.',
      icon: Heart,
      color: 'pink'
    },
    {
      id: 1,
      title: 'Personal Information',
      description: 'Let\'s confirm your details and set up your account preferences.',
      icon: User,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Guardian Protocol',
      description: 'Configure your inactivity monitoring and alert preferences to protect your legacy.',
      icon: Shield,
      color: 'green'
    },
    {
      id: 3,
      title: 'Loved Ones',
      description: 'Add the people who will receive your legacy and carry forward your love.',
      icon: Users,
      color: 'purple'
    },
    {
      id: 4,
      title: 'First Message',
      description: 'Create your first time capsule - a message that will be shared when the time is right.',
      icon: Mail,
      color: 'orange'
    },
    {
      id: 5,
      title: 'Digital Vault',
      description: 'Secure important accounts, documents, and passwords for your loved ones.',
      icon: Lock,
      color: 'indigo'
    },
    {
      id: 6,
      title: 'Complete Setup',
      description: 'Review your settings and start building your lasting digital legacy.',
      icon: CheckCircle,
      color: 'emerald'
    }
  ];

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 0) {
      // Welcome step - no validation needed
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Personal info validation
      if (!formData.name.trim() || !formData.email.trim()) {
        toast.error('Please fill in your name and email');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Guardian protocol validation
      if (!formData.inactivityDuration || formData.inactivityDuration < 30) {
        toast.error('Please set a valid inactivity duration (minimum 30 minutes)');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Beneficiaries validation
      if (formData.beneficiaries.length === 0) {
        toast.error('Please add at least one beneficiary');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // First message validation
      if (!formData.firstMessageTitle.trim() || !formData.firstMessageContent.trim()) {
        toast.error('Please add a title and content for your first message');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Vault setup validation
      setCurrentStep(6);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddBeneficiary = () => {
    setFormData({
      ...formData,
      beneficiaries: [...formData.beneficiaries, { name: '', email: '', relationship: '' }]
    });
  };

  const handleRemoveBeneficiary = (index) => {
    setFormData({
      ...formData,
      beneficiaries: formData.beneficiaries.filter((_, i) => i !== index)
    });
  };

  const handleCompleteOnboarding = () => {
    const onboardingData = {
      ...formData,
      onboardingComplete: true,
      completedAt: new Date()
    };
    
    completeOnboardingMutation.mutate(onboardingData);
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / (steps.length + 1)) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 pt-20 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Setting Up Your Legacy</h2>
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Start: Welcome</span>
          <span>Complete: Legacy Ready</span>
        </div>
      </div>

      {/* Onboarding Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50"
      >
        {/* Step Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            className={`p-2 rounded-lg transition-colors ${
              currentStep === 0 ? 'invisible' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${steps[currentStep].color}`}>
              {React.createElement(steps[currentStep].icon, { className: 'w-6 h-6 text-white' })}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
          </div>
          
          {currentStep < steps.length - 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>{currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LastKey</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Your love deserves to live forever. LastKey helps you create a beautiful digital legacy that will be treasured by generations to come.
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-2">🌟 Premium Features</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span>AI Voice Messages</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span>Life Timeline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span>Emergency Access Portal</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">🛡️ Security First</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span>Zero-Knowledge Encryption</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span>Guardian Protocol Monitoring</span>
                    </li>
                  </ul>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Begin Your Journey
              </motion.button>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inactivity Duration (minutes)
                </label>
                <select
                  value={formData.inactivityDuration}
                  onChange={(e) => setFormData({ ...formData, inactivityDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>2 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Channels</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.alertChannels.includes('email')}
                      onChange={(e) => {
                        const channels = e.target.checked 
                          ? [...formData.alertChannels, 'email']
                          : formData.alertChannels.filter(ch => ch !== 'email');
                        setFormData({ ...formData, alertChannels: channels });
                      }}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-gray-700">Email Notifications</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.alertChannels.includes('whatsapp')}
                      onChange={(e) => {
                        const channels = e.target.checked 
                          ? [...formData.alertChannels, 'whatsapp']
                          : formData.alertChannels.filter(ch => ch !== 'whatsapp');
                        setFormData({ ...formData, alertChannels: channels });
                      }}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-gray-700">WhatsApp Alerts</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loved Ones</h3>
                <p className="text-gray-600 mb-4">Add the people who will receive your legacy and carry forward your love.</p>
                
                {formData.beneficiaries.map((beneficiary, index) => (
  <React.Fragment key={index}>
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          value={beneficiary.name}
          onChange={(e) => {
            const updated = [...formData.beneficiaries];
            updated[index] = { ...updated[index], name: e.target.value };
            setFormData({ ...formData, beneficiaries: updated });
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Full name"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleRemoveBeneficiary(index)}
          className="text-red-500 hover:text-red-700 p-1"
        >
          ×
        </motion.button>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        value={beneficiary.email}
        onChange={(e) => {
          const updated = [...formData.beneficiaries];
          updated[index] = { ...updated[index], email: e.target.value };
          setFormData({ ...formData, beneficiaries: updated });
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        placeholder="Email address"
      />
      <input
        type="text"
        value={beneficiary.relationship}
        onChange={(e) => {
          const updated = [...formData.beneficiaries];
          updated[index] = { ...updated[index], relationship: e.target.value };
          setFormData({ ...formData, beneficiaries: updated });
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        placeholder="Relationship (e.g., Spouse, Child, Friend)"
      />
    </div>
  </React.Fragment>
))}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddBeneficiary}
                  className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Beneficiary
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Title</label>
                <input
                  type="text"
                  value={formData.firstMessageTitle}
                  onChange={(e) => setFormData({ ...formData, firstMessageTitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., My First Message to My Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                <textarea
                  value={formData.firstMessageContent}
                  onChange={(e) => setFormData({ ...formData, firstMessageContent: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-32 resize-none"
                  placeholder="Write a heartfelt message to your loved ones..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                <input
                  type="text"
                  value={formData.firstMessageRecipient}
                  onChange={(e) => setFormData({ ...formData, firstMessageRecipient: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Who is this message for?"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Vault Setup</h3>
                <p className="text-gray-600 mb-4">Secure important accounts and information for your loved ones.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={formData.vaultItems[0]?.platform || ''}
                      onChange={(e) => {
                        const updated = [...formData.vaultItems];
                        updated[0] = { ...updated[0], platform: e.target.value };
                        setFormData({ ...formData, vaultItems: updated });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Google, Facebook, Bank"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.vaultItems[0]?.username || ''}
                      onChange={(e) => {
                        const updated = [...formData.vaultItems];
                        updated[0] = { ...updated[0], username: e.target.value };
                        setFormData({ ...formData, vaultItems: updated });
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Username or email"
                    />
                    <input
                      type="password"
                      value={formData.vaultItems[0]?.password || ''}
                      onChange={(e) => {
                        const updated = [...formData.vaultItems];
                        updated[0] = { ...updated[0], password: e.target.value };
                        setFormData({ ...formData, vaultItems: updated });
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Password or key"
                    />
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({
                    ...formData,
                    vaultItems: [...formData.vaultItems, { platform: '', username: '', password: '' }]
                  })}
                  className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Item
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Begin!</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                You've completed the setup! Your digital legacy is now ready to be preserved and shared with your loved ones.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompleteOnboarding}
                className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-800 transition-all shadow-xl"
              >
                Complete Setup
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
