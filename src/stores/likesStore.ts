import { create } from 'zustand';
import type { LikesState, Internship, Scheme, Job, Course } from '../types';
// import webhooks from '../services/api';

// ============================================================================
// MOCK DATA FOR TESTING - Remove when backend is connected
// Synced with dashboardStore mock data
// ============================================================================

export const useLikesStore = create<LikesState>((set) => ({
  likedItems: [],
  isLoading: false,

  fetchLikedItems: async () => {
    set({ isLoading: true });
    try {
      // WH7: Fetch liked events
      // Endpoint: GET /fetch_liked_events
      // Expected response: { items: (Internship | Scheme | Job | Course)[] }
      // const { items } = await webhooks.fetchLikedEvents();
      
      // ==========================================================================
      // MOCK DATA - Filter items that are liked from dashboard store
      // ==========================================================================
      // Import dashboard store to get current liked items
      const { useDashboardStore } = await import('./dashboardStore');
      const { internships, schemes, jobs, courses } = useDashboardStore.getState();
      
      // Filter only liked items
      const likedInternships = internships.filter(item => item.isLiked);
      const likedSchemes = schemes.filter(item => item.isLiked);
      const likedJobs = jobs.filter(item => item.isLiked);
      const likedCourses = courses.filter(item => item.isLiked);
      
      const items = [...likedInternships, ...likedSchemes, ...likedJobs, ...likedCourses];
      // ==========================================================================
      
      set({ likedItems: items as (Internship | Scheme | Job | Course)[], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch liked items:', error);
    }
  },
}));
