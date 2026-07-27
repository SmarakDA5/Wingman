import { motion } from 'framer-motion';

interface ThemeSwitcherProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export const ThemeSwitcher = ({ isDarkMode, onToggle }: ThemeSwitcherProps) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="liquid-glass rounded-full shadow-xl px-1 py-1 flex items-center gap-1">
        <motion.button
          onClick={onToggle}
          className={`relative min-w-[44pt] min-h-[44pt] rounded-full flex items-center justify-center touch-manipulation transition-colors ${
            !isDarkMode 
              ? 'text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200' 
              : 'text-yellow-400 hover:text-yellow-300'
          }`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Toggle theme"
        >
          <motion.div
            key={!isDarkMode ? 'light' : 'dark'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {!isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};
