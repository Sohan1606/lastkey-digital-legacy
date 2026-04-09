import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Users, Clock, Mic, Calendar, BookOpen, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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
        style={{
          padding: 8,
          borderRadius: 10,
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-1)',
          color: 'var(--text-2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--glass-2)';
          e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
          e.currentTarget.style.color = 'var(--text-1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--glass-1)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.color = 'var(--text-2)';
        }}
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 80,
              paddingLeft: 16,
              paddingRight: 16,
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: '100%',
                maxWidth: 720,
                borderRadius: 18,
                overflow: 'hidden',
                background: 'rgba(7,14,27,0.96)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(24px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Search className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search features, navigate quickly... (Ctrl+K)"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 18,
                      color: 'var(--text-1)',
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: 6,
                      borderRadius: 10,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-1)',
                      cursor: 'pointer',
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-2)' }} />
                  </motion.button>
                </div>
              </div>

              {/* Search Results */}
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 10 }}>
                    {results.map((category, index) => {
                      const Icon = category.icon;
                      const isSelected = index === selectedIndex;
                      const gradient =
                        category.color === 'blue' ? 'linear-gradient(135deg,#4f9eff,#0066cc)' :
                        category.color === 'green' ? 'linear-gradient(135deg,#00e5a0,#00b87a)' :
                        category.color === 'purple' ? 'linear-gradient(135deg,#7c5cfc,#a855f7)' :
                        category.color === 'pink' ? 'linear-gradient(135deg,#ff4d6d,#ff6b8a)' :
                        category.color === 'orange' ? 'linear-gradient(135deg,#ffb830,#ff8c00)' :
                        category.color === 'indigo' ? 'linear-gradient(135deg,#7c5cfc,#4f9eff)' :
                        category.color === 'yellow' ? 'linear-gradient(135deg,#ffb830,#00e5a0)' :
                        'linear-gradient(135deg,#8899bb,#445577)';
                      return (
                        <motion.button
                          key={category.name}
                          onClick={() => handleSelect(category)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            borderRadius: 14,
                            textAlign: 'left',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? 'rgba(79,158,255,0.25)' : 'transparent'}`,
                            background: isSelected ? 'rgba(79,158,255,0.08)' : 'transparent',
                            transition: 'background 0.16s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isSelected ? 'rgba(79,158,255,0.08)' : 'transparent';
                          }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: gradient, flexShrink: 0 }}>
                            <Icon className="w-5 h-5" style={{ color: 'white' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{category.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Navigate to {category.name.toLowerCase()}</div>
                          </div>
                          <div style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-2)' }}>
                            Ctrl+{index + 1}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'var(--text-3)' }}>
                Press Ctrl+K to open • ESC to close • ↑↓ to navigate • ENTER to select
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
