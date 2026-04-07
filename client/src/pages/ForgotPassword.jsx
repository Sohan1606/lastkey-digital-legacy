import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      
      if (response.data.status === 'success') {
        setIsSubmitted(true);
        toast.success('If an account exists, you will receive a reset link');
      } else {
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
          
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={handleBackToLogin}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Login</span>
          </motion.button>

          {!isSubmitted ? (
            <>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-16 h-16 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-indigo-600" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-2 text-center"
              >
                Forgot Your Password?
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8 text-center leading-relaxed"
              >
                No worries! Enter your email address and we'll send you a link to reset your password.
              </motion.p>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </motion.button>
              </motion.form>
            </>
          ) : (
            <>
              {/* Success State */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-4 text-center"
              >
                Check Your Email
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8 text-center leading-relaxed"
              >
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 1 hour.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm text-center">
                    <strong>Didn't receive the email?</strong> Check your spam folder or 
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="text-indigo-600 hover:text-indigo-700 underline ml-1"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBackToLogin}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Back to Login
                </motion.button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
