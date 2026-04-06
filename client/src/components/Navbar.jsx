import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navItems = user ? [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Vault', path: '/vault' },
    { name: 'Beneficiaries', path: '/beneficiaries' },
    { name: 'Capsules', path: '/capsules' },
    { name: 'AI', path: '/ai' },
  ] : [];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="bg-white/80 backdrop-blur-xl shadow-lg fixed top-0 left-0 right-0 z-50 border-b border-white/50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            LastKey
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md font-medium transition-colors text-lg"
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <span className="text-gray-700 ml-4 font-medium text-lg">Hi, {user.name}</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-purple-600 font-medium text-lg transition-colors">Login</Link>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-purple-600 focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white/90 backdrop-blur-xl border-t border-white/50 pb-4"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:bg-purple-50 hover:text-purple-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <button 
                onClick={handleLogout}
                className="block w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:bg-purple-50 hover:text-purple-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsOpen(false)}
                  className="block bg-purple-600 text-white px-3 py-2 rounded-md text-base font-medium text-center hover:bg-purple-700 transition-colors mt-2"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
