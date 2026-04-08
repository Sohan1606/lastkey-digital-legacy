import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Mail, Phone, User, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EmergencyAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [legacyData, setLegacyData] = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const code = searchParams.get('code');

  const handleAccessRequest = async (e) => {
    e.preventDefault();
    
    if (!accessCode) {
      toast.error('Please enter the access code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE}/emergency/access`, {
        code: accessCode
      });

      if (response.data.success) {
        setLegacyData(response.data.data);
        setBeneficiary(response.data.data.beneficiary); // Fix: it's inside .data
        setIsAuthenticated(true);
        toast.success('Access granted. Loading legacy information...');
      }
    } catch (error) {
      console.error('Access error:', error);
      toast.error(error.response?.data?.message || 'Invalid access code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAsset = async (asset) => {
    try {
      const response = await axios.get(`${API_BASE}/emergency/download/${asset._id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${asset.platform}-credentials.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${asset.platform} credentials`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download credentials');
    }
  };

  const handleSendMessage = async () => {
    if (!beneficiary?.email) return;
    
    try {
      await axios.post(`${API_BASE}/emergency/notify`, {
        beneficiaryId: beneficiary._id,
        message: 'Emergency access confirmed. Legacy information has been reviewed.'
      });
      
      toast.success('Notification sent to estate administrator');
    } catch (error) {
      console.error('Notify error:', error);
      toast.error('Failed to send notification');
    }
  };

  if (isAuthenticated && legacyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Access Granted</h1>
            <p className="text-gray-600">
              You have been granted access to <span className="font-semibold">{legacyData.user.name}</span>'s digital legacy.
            </p>
          </motion.div>

          {/* Legacy Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Account Owner
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Name</span>
                  <p className="font-semibold text-gray-900">{legacyData.user.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-semibold text-gray-900">{legacyData.user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Guardian Protocol Status</span>
                  <p className={`font-semibold ${
                    legacyData.user.triggerStatus === 'triggered' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {legacyData.user.triggerStatus === 'triggered' ? '🚨 Activated' : '✅ Active'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Beneficiary Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Your Access
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Your Name</span>
                  <p className="font-semibold text-gray-900">{beneficiary.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Relationship</span>
                  <p className="font-semibold text-gray-900">{beneficiary.relationship}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Access Granted</span>
                  <p className="font-semibold text-gray-900">
                    {new Date(beneficiary.accessGrantedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Digital Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Digital Assets ({legacyData.assets.length})
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyData.assets.map((asset, index) => (
                <motion.div
                  key={asset._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                >
                  <h3 className="font-bold text-gray-900 mb-2">{asset.platform}</h3>
                  <p className="text-sm text-gray-600 mb-3">{asset.username}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Password:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                          {showPassword[asset._id] ? asset.password : '••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPassword(prev => ({ ...prev, [asset._id]: !prev[asset._id] }))}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          {showPassword[asset._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {asset.instruction && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Instruction:</span> {asset.instruction}
                      </div>
                    )}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownloadAsset(asset)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors mt-3"
                  >
                    Download Credentials
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Time Letters */}
          {legacyData.capsules && legacyData.capsules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mt-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Time Letters ({legacyData.capsules.length})
              </h2>
              
              <div className="space-y-4">
                {legacyData.capsules.map((capsule, index) => (
                  <motion.div
                    key={capsule._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{capsule.title}</h3>
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        {capsule.recipient}
                      </span>
                    </div>
                    
                    <div className="text-gray-700 leading-relaxed mb-3">
                      {capsule.content}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Delivered: {new Date(capsule.releaseDate).toLocaleDateString()}</span>
                      {capsule.emotion && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          {capsule.emotion}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendMessage}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              Confirm Access Received
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              Exit Portal
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page spatial-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="stars" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Legacy Access</h1>
            <p className="text-gray-600 text-sm">
              Enter the access code provided to access the digital legacy
            </p>
          </div>

          {/* Access Form */}
          <form onSubmit={handleAccessRequest} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Access Code
              </label>
              <div className="relative">
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter the 8-character access code"
                  className="w-full px-4 py-3 text-lg font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  required
                  maxLength={8}
                />
                {code && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                )}
              </div>
              {code && (
                <p className="text-sm text-amber-600 mt-2">
                  Access code detected in URL. Please verify and submit.
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !accessCode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Access...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Access Digital Legacy</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Contact the estate administrator for access code</p>
              <p>• Access codes are case-sensitive and 8 characters long</p>
              <p>• This portal is for emergency use only</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EmergencyAccess;
