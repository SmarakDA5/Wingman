import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFeedsStore, type FeedTab } from '../stores/dashboardStore';
import { useProfileStore } from '../stores/profileStore';
import { EventCard } from '../components/EventCard';
import type { FeedItem } from '../types';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'trending', label: 'Trending' },
  { id: 'likes', label: 'Likes' },
  { id: 'saved', label: 'Saved' },
];

export const FeedsView = () => {
  const navigate = useNavigate();
  const { activeTab, setActiveTab, initializeFeeds, isInitialized, feeds, toggleLike } = useFeedsStore();
  const { isProfileValid, fetchProfile, isInitialized: isProfileInitialized } = useProfileStore();

  useEffect(() => {
    // Initialize feeds once on mount
    if (!isInitialized) {
      initializeFeeds();
    }
  }, [isInitialized, initializeFeeds]);

  useEffect(() => {
    // Fetch profile data to check validity
    if (!isProfileInitialized) {
      fetchProfile();
    }
  }, [isProfileInitialized, fetchProfile]);

  const currentFeeds: FeedItem[] = feeds[activeTab] || [];

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pb-24 transition-colors duration-500">
      {/* Profile Validity Banner - Always shown when profile is invalid */}
      {!isProfileValid && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-4 mx-6 mt-4 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Please complete your profile to access feeds.
            </p>
            <button
              onClick={() => navigate('/app/info')}
              className="text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 text-sm font-semibold underline"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Tab Navigation - Disabled when profile is invalid */}
        <div className="glass-card shadow-sm backdrop-blur-xl px-6 py-4">
          <nav className="flex gap-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                disabled={!isProfileValid}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${!isProfileValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Feed Content - Hidden when profile is invalid */}
        {!isProfileValid ? (
          <div className="px-6 py-12 text-center">
            <div className="liquid-glass rounded-2xl shadow-md p-8 mt-6">
              <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Profile Incomplete
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your profile questions to access feeds and get personalized recommendations.
              </p>
              <button
                onClick={() => navigate('/app/info')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Go to Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6">
            <motion.h2
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
            >
              {TABS.find((t) => t.id === activeTab)?.label}
            </motion.h2>
            
            {currentFeeds.length > 0 ? (
              <div className="space-y-4">
                {currentFeeds.map((item: FeedItem, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EventCard
                      item={item}
                      onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, activeTab, isLiked)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No items in this feed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
