import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Users, Clock, Mic, Calendar, BookOpen, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const searchCategories = [
    { name: 'Vault Items', icon: FileText, path: '/vault', color: 'blue' },
    { name: 'Beneficiaries', icon: Users, path: '/beneficiaries', color: 'green' },
    { name: 'Time Capsules', icon: Clock, path: '/capsules', color: 'purple' },
    { name: 'Voice Messages', icon: Mic, path: '/voice-messages', color: 'pink' },
    { name: 'Life Timeline', icon: Calendar, path: '/life-timeline', color: 'orange' },
    { name: 'Memoir Chapters', icon: BookOpen, path: '/memoir-ai', color: 'indigo' },
    { name: 'Achievements', icon: Trophy, path: '/gamification', color: 'yellow' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (isOpen && e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchCategories.length);
      }
      if (isOpen && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchCategories.length) % searchCategories.length);
      }
      if (isOpen && e.key === 'Enter') {
        e.preventDefault();
        const selected = searchCategories[selectedIndex];
        navigate(selected.path);
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, navigate]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        const filtered = searchCategories.filter(category =>
          category.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(searchCategories);
      setIsLoading(false);
    }
  }, [query]);

  const handleSelect = (category) => {
    navigate(category.path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Search Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Search className="w-5 h-5" />
      </motion.button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className={`p-4 border-b ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Search className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search features, navigate quickly... (⌘K)"
                    className={`flex-1 bg-transparent border-none outline-none text-lg ${
                      theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className={`p-1 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </motion.button>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                        <div className={`w-10 h-10 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                        }`} />
                        <div className="flex-1 space-y-2">
                          <div className={`h-4 rounded ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          }`} />
                          <div className={`h-3 w-3/4 rounded ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2">
                    {results.map((category, index) => {
                      const Icon = category.icon;
                      const isSelected = index === selectedIndex;
                      return (
                        <motion.button
                          key={category.name}
                          whileHover={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}
                          onClick={() => handleSelect(category)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            isSelected 
                              ? theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                              : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${
                            category.color === 'blue' ? 'from-blue-500 to-blue-600' :
                            category.color === 'green' ? 'from-green-500 to-green-600' :
                            category.color === 'purple' ? 'from-purple-500 to-purple-600' :
                            category.color === 'pink' ? 'from-pink-500 to-pink-600' :
                            category.color === 'orange' ? 'from-orange-500 to-orange-600' :
                            category.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                            category.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                            'from-gray-500 to-gray-600'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {category.name}
                            </div>
                            <div className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Navigate to {category.name.toLowerCase()}
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            ⌘{index + 1}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`p-3 border-t text-xs ${
                theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
              }`}>
                Press ⌘K to open • ESC to close • ↑↓ to navigate • ENTER to select
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
