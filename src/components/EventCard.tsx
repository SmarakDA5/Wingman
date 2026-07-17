import { motion } from 'framer-motion';
import type { FeedItem } from '../types';

interface EventCardProps {
  item: FeedItem;
  onLikeToggle: (id: number, isLiked: boolean) => void;
}

export const EventCard = ({ item, onLikeToggle }: EventCardProps) => {
  const hasApplyUrl = !!item.apply_url;
  const hasTutorialUrl = !!item.tutorial_url;

  return (
    <motion.div
      className="glass-card rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100/50 dark:border-gray-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{item.post}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.comp}</p>
        </div>
        <motion.button
          onClick={() => onLikeToggle(item.id, false)}
          className="min-w-[44pt] min-h-[44pt] flex items-center justify-center -mr-2 -mt-2 touch-manipulation relative z-10"
          aria-label="Like"
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
        >
          <motion.svg
            className="w-7 h-7 fill-none text-gray-400 dark:text-gray-500"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </motion.svg>
        </motion.button>
      </div>

      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Apply by: {new Date(item.apply_by).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>

      {/* Button Block - Apple HIG Layout */}
      {hasApplyUrl && hasTutorialUrl ? (
        /* Condition C: Both URLs exist - split width evenly into two-button flex row */
        <motion.div 
          className="flex gap-2 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => window.open(item.apply_url as string, '_blank')}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-xl text-center min-h-[44pt] flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          >
            Apply Now
          </button>
          <button
            onClick={() => window.open(item.tutorial_url as string, '_blank')}
            className="flex-1 glass-button hover:bg-white/60 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-sm font-medium py-2 px-4 rounded-xl text-center min-h-[44pt] flex items-center justify-center transition-all hover:scale-[1.02]"
          >
            Watch Video
          </button>
        </motion.div>
      ) : hasApplyUrl ? (
        /* Condition A: Only apply_url exists */
        <motion.div 
          className="mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => window.open(item.apply_url as string, '_blank')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-xl text-center min-h-[44pt] flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          >
            Apply Now
          </button>
        </motion.div>
      ) : hasTutorialUrl ? (
        /* Condition B: Only tutorial_url exists */
        <motion.div 
          className="mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => window.open(item.tutorial_url as string, '_blank')}
            className="w-full glass-button hover:bg-white/60 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-sm font-medium py-2 px-4 rounded-xl text-center min-h-[44pt] flex items-center justify-center transition-all hover:scale-[1.02]"
          >
            Watch Video
          </button>
        </motion.div>
      ) : (
        /* Condition D: Both URLs missing - show "See Source" fallback link */
        <motion.div 
          className="mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <a
            href="#"
            className="text-sm text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            See Source
          </a>
        </motion.div>
      )}
    </motion.div>
  );
};
