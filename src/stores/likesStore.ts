import { create } from 'zustand';
import type { LikesState, FeedItem } from '../types';

export const useLikesStore = create<LikesState>((set) => ({
  likedItems: [],
  isLoading: false,

  fetchLikedItems: async () => {
    set({ isLoading: true });
    try {
      // WH7: Fetch liked events
      // Import dashboard store to get current liked items
      const dashboardState = await import('./dashboardStore').then(m => m.useDashboardStore.getState());
      const { cache } = dashboardState;
      
      // Filter only liked items from all categories
      const likedInternships: FeedItem[] = cache.internships.filter((item: FeedItem) => item.isLiked);
      const likedSchemes: FeedItem[] = cache.schemes.filter((item: FeedItem) => item.isLiked);
      const likedJobs: FeedItem[] = cache.jobs.filter((item: FeedItem) => item.isLiked);
      const likedCourses: FeedItem[] = cache.courses.filter((item: FeedItem) => item.isLiked);
      
      const items: FeedItem[] = [...likedInternships, ...likedSchemes, ...likedJobs, ...likedCourses];
      
      set({ likedItems: items, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch liked items:', error);
    }
  },
}));
