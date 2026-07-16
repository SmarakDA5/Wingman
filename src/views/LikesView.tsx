import { useEffect, useState } from 'react';
import { useLikesStore } from '../stores/likesStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { EventCard } from '../components/EventCard';

export const LikesView = () => {
  const { likedItems } = useLikesStore();
  const { toggleLike, internships, schemes, jobs } = useDashboardStore();
  const [localLikedItems, setLocalLikedItems] = useState(likedItems);

  // Update local state when dashboard likes change
  useEffect(() => {
    const allLiked = [
      ...internships.filter(item => item.isLiked),
      ...schemes.filter(item => item.isLiked),
      ...jobs.filter(item => item.isLiked),
    ];
    setLocalLikedItems(allLiked);
  }, [internships, schemes, jobs]);

  const getItemType = (item: any): 'internship' | 'scheme' | 'job' => {
    if ('company' in item && item.company) return 'internship';
    if ('organization' in item) return 'scheme';
    return 'job';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6">Liked Events</h1>

        <div className="px-6 space-y-4">
        {localLikedItems.length > 0 ? (
          localLikedItems.map((item) => (
            <EventCard
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={'company' in item ? item.company : item.organization}
              deadline={item.deadline}
              isLiked={item.isLiked}
              applicationUrl={item.applicationUrl}
              videoUrl={item.videoUrl}
              onLikeToggle={(id, isLiked) => toggleLike(id, getItemType(item), isLiked)}
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
