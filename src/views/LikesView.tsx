import { useEffect } from 'react';
import { useLikesStore } from '../stores/likesStore';
import { EventCard } from '../components/EventCard';
import type { FeedItem } from '../types';

export const LikesView = () => {
  const { likedItems, isLoading, fetchLikedItems } = useLikesStore();
  
  useEffect(() => {
    fetchLikedItems();
  }, [fetchLikedItems]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6">Liked Events</h1>

        <div className="px-6 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : likedItems.length > 0 ? (
          likedItems.map((item: FeedItem) => (
            <EventCard
              key={item.id}
              item={item}
              onLikeToggle={() => {}}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No liked events yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Tap the heart icon on any event to save it here</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
