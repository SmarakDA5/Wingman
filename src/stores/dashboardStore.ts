import { create } from 'zustand';
import type { FeedItem } from '../types';
import webhooks from '../services/api';

export type FeedTab = 'discover' | 'recommended' | 'trending' | 'likes' | 'saved';

export interface FeedsState {
  activeTab: FeedTab;
  feeds: Record<FeedTab, FeedItem[]>;
  isLoading: boolean;
  isInitialized: boolean;
  setActiveTab: (tab: FeedTab) => void;
  initializeFeeds: () => Promise<void>;
  toggleLike: (id: number, tab: FeedTab, isLiked: boolean) => Promise<void>;
}

export const useFeedsStore = create<FeedsState>((set) => ({
  activeTab: 'discover',
  feeds: {
    discover: [],
    recommended: [],
    trending: [],
    likes: [],
    saved: [],
  },
  isLoading: false,
  isInitialized: false,

  setActiveTab: (activeTab: FeedTab) => {
    set({ activeTab });
  },

  initializeFeeds: async () => {
    set({ isLoading: true });
    try {
      // Sequential fetch as per specification
      const [discoverResult, recommendedResult, trendingResult, likesResult, savedResult] = await Promise.allSettled([
        webhooks.fetchDiscoverFeed(),
        webhooks.fetchRecommendedFeed(),
        webhooks.fetchTrendingFeed(),
        webhooks.fetchLikedItems(),
        webhooks.fetchSavedItems(),
      ]);

      const discover: FeedItem[] = discoverResult.status === 'fulfilled' ? discoverResult.value.items : [];
      const recommended: FeedItem[] = recommendedResult.status === 'fulfilled' ? recommendedResult.value.items : [];
      const trending: FeedItem[] = trendingResult.status === 'fulfilled' ? trendingResult.value.items : [];
      const likes: FeedItem[] = likesResult.status === 'fulfilled' ? likesResult.value.items : [];
      const saved: FeedItem[] = savedResult.status === 'fulfilled' ? savedResult.value.items : [];

      set({
        feeds: { discover, recommended, trending, likes, saved },
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      console.error('Failed to initialize feeds:', error);
    }
  },

  toggleLike: async (id: number, tab: FeedTab, isLiked: boolean) => {
    // Optimistic UI update
    set((state) => ({
      feeds: {
        ...state.feeds,
        [tab]: state.feeds[tab].map((item: FeedItem) =>
          item.id === id ? { ...item, isLiked: !isLiked } : item
        ),
      },
    }));

    try {
      await webhooks.syncLikeMutation(String(id), !isLiked, 'internship');
    } catch (error) {
      // Revert on error
      set((state) => ({
        feeds: {
          ...state.feeds,
          [tab]: state.feeds[tab].map((item: FeedItem) =>
            item.id === id ? { ...item, isLiked: isLiked } : item
          ),
        },
      }));
      console.error('Failed to sync like:', error);
    }
  },
}));
