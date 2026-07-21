import { create } from 'zustand';
import type { FeedItem } from '../types';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

export type FeedTab = 'discover' | 'recommended' | 'trending' | 'likes' | 'saved';

export interface FeedsState {
  activeTab: FeedTab;
  feeds: Record<FeedTab, FeedItem[]>;
  isLoading: boolean;
  isInitialized: boolean;
  loadingTabs: Partial<Record<FeedTab, boolean>>;
  setActiveTab: (tab: FeedTab) => void;
  initializeFeeds: () => Promise<void>;
  refreshTab: (tab: FeedTab) => Promise<void>;
  toggleLike: (id: number, tab: FeedTab, isLiked: boolean, itemType: string) => Promise<void>;
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
  loadingTabs: {},

  setActiveTab: (activeTab: FeedTab) => {
    set({ activeTab });
  },

  initializeFeeds: async () => {
    set({ isLoading: true });
    try {
      // Sequential fetch as per specification - WH4, WH5, WH6 for main feeds
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

  refreshTab: async (tab: FeedTab) => {
    const user = useAuthStore.getState().user;
    
    if (!user?.email) return;

    set((state) => ({
      loadingTabs: { ...state.loadingTabs, [tab]: true },
    }));

    try {
      let result;
      switch (tab) {
        case 'discover':
          result = await webhooks.fetchDiscoverFeed();
          break;
        case 'recommended':
          result = await webhooks.fetchRecommendedFeed();
          break;
        case 'trending':
          result = await webhooks.fetchTrendingFeed();
          break;
        case 'likes':
          result = await webhooks.fetchLikedItems();
          break;
        case 'saved':
          result = await webhooks.fetchSavedItems();
          break;
        default:
          return;
      }

      set((state) => ({
        feeds: { ...state.feeds, [tab]: result.items },
        loadingTabs: { ...state.loadingTabs, [tab]: false },
      }));
    } catch (error) {
      set((state) => ({
        loadingTabs: { ...state.loadingTabs, [tab]: false },
      }));
      console.error(`Failed to refresh ${tab} feed:`, error);
    }
  },

  toggleLike: async (id: number, tab: FeedTab, isLiked: boolean, itemType: string) => {
    const user = useAuthStore.getState().user;
    
    if (!user?.email) {
      console.error('User email not found');
      return;
    }

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
      // WH8: Send email, item_id, and item_type to backend
      await webhooks.syncLikeMutation(user.email, String(id), !isLiked, itemType);
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
