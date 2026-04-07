import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300"
    >
      <motion.div
        animate={{ x: theme === 'dark' ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative w-5 h-5 bg-white rounded-full shadow-md"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {theme === 'dark' ? (
            <Moon className="w-3 h-3 text-indigo-600" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-500" />
          )}
        </div>
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
