import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay to not interrupt initial page load
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleDecline}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Cookie Notice</h3>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          We use essential cookies only to provide our services and remember your preferences. 
          No tracking or advertising cookies are used.
        </p>

        {/* Links */}
        <div className="text-xs text-gray-500 mb-4 space-x-2">
          <Link 
            to="/privacy" 
            className="text-indigo-600 hover:text-indigo-700 underline"
            onClick={() => setIsVisible(false)}
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link 
            to="/terms" 
            className="text-indigo-600 hover:text-indigo-700 underline"
            onClick={() => setIsVisible(false)}
          >
            Terms of Service
          </Link>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
          >
            Accept Essential Cookies
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDecline}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Decline
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CookieBanner;
