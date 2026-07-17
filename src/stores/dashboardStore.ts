import { create } from 'zustand';
import type { DashboardState, ScopeLevel, FeedItem, DashboardCache } from '../types';
import webhooks from '../services/api';

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sliderValue: 0,
  cache: {
    internships: [],
    schemes: [],
    jobs: [],
    courses: [],
  },
  isLoading: false,
  isInitialized: false,

  setSliderValue: (sliderValue: ScopeLevel) => {
    set({ sliderValue });
  },

  initializeData: async () => {
    set({ isLoading: true });
    try {
      // Fetch all data once without scope parameter - client-side filtering only
      const [internshipsResult, schemesResult, jobsResult, coursesResult] = await Promise.allSettled([
        webhooks.fetchInternships(),
        webhooks.fetchSchemes(),
        webhooks.fetchJobs(),
        webhooks.fetchCourses(),
      ]);

      const internships: FeedItem[] = internshipsResult.status === 'fulfilled' ? internshipsResult.value.internships : [];
      const schemes: FeedItem[] = schemesResult.status === 'fulfilled' ? schemesResult.value.schemes : [];
      const jobs: FeedItem[] = jobsResult.status === 'fulfilled' ? jobsResult.value.jobs : [];
      const courses: FeedItem[] = coursesResult.status === 'fulfilled' ? coursesResult.value.courses : [];

      set({
        cache: { internships, schemes, jobs, courses },
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      console.error('Failed to initialize dashboard data:', error);
    }
  },

  toggleLike: async (id: number, type: keyof DashboardCache, isLiked: boolean) => {
    // Optimistic UI update
    set((state) => ({
      cache: {
        ...state.cache,
        [type]: state.cache[type].map((item: FeedItem) =>
          item.id === id ? { ...item, isLiked: !isLiked } : item
        ) as FeedItem[],
      },
    }));

    try {
      await webhooks.syncLikeMutation(String(id), !isLiked, type as 'internship' | 'scheme' | 'job' | 'course');
    } catch (error) {
      // Revert on error
      set((state) => ({
        cache: {
          ...state.cache,
          [type]: state.cache[type].map((item: FeedItem) =>
            item.id === id ? { ...item, isLiked: isLiked } : item
          ) as FeedItem[],
        },
      }));
      console.error('Failed to sync like:', error);
    }
  },

  getFilteredInternships: () => {
    const { sliderValue, cache } = get();
    return cache.internships.filter((item: FeedItem) => item.scope_tier <= sliderValue);
  },

  getFilteredSchemes: () => {
    const { sliderValue, cache } = get();
    return cache.schemes.filter((item: FeedItem) => item.scope_tier <= sliderValue);
  },

  getFilteredJobs: () => {
    const { sliderValue, cache } = get();
    return cache.jobs.filter((item: FeedItem) => item.scope_tier <= sliderValue);
  },

  getFilteredCourses: () => {
    const { sliderValue, cache } = get();
    return cache.courses.filter((item: FeedItem) => item.scope_tier <= sliderValue);
  },
}));
