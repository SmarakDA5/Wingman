import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FeedItem } from '../types';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

export type FeedTab = 'discover' | 'recommended' | 'trending' | 'likes' | 'saved';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const EMPTY_FEEDS: Record<FeedTab, FeedItem[]> = { discover: [], recommended: [], trending: [], likes: [], saved: [] };

export interface FeedsState {
  activeTab: FeedTab;
  feeds: Record<FeedTab, FeedItem[]>;
  isLoading: boolean;
  isInitialized: boolean;
  fetchedAt: number | null;
  loadingTabs: Partial<Record<FeedTab, boolean>>;
  setActiveTab: (tab: FeedTab) => void;
  initializeFeeds: () => Promise<void>;
  refreshTab: (tab: FeedTab) => Promise<void>;
  toggleLike: (id: number, tab: FeedTab, isLiked: boolean, itemType: string) => Promise<void>;
}

async function fetchAllFeeds(): Promise<Record<FeedTab, FeedItem[]>> {
  const [discover, recommended, trending, likes, saved] = await Promise.allSettled([
    webhooks.fetchDiscoverFeed(),
    webhooks.fetchRecommendedFeed(),
    webhooks.fetchTrendingFeed(),
    webhooks.fetchLikedItems(),
    webhooks.fetchSavedItems(),
  ]);
  return {
    discover: discover.status === 'fulfilled' ? discover.value.items : [],
    recommended: recommended.status === 'fulfilled' ? recommended.value.items : [],
    trending: trending.status === 'fulfilled' ? trending.value.items : [],
    likes: likes.status === 'fulfilled' ? likes.value.items : [],
    saved: saved.status === 'fulfilled' ? saved.value.items : [],
  };
}

export const useFeedsStore = create<FeedsState>()(
  persist(
    (set, get) => ({
      activeTab: 'discover',
      feeds: { ...EMPTY_FEEDS },
      isLoading: false,
      isInitialized: false,
      fetchedAt: null,
      loadingTabs: {},

      setActiveTab: (activeTab: FeedTab) => set({ activeTab }),

      initializeFeeds: async () => {
        const { fetchedAt, feeds } = get();
        const fresh = fetchedAt !== null && Date.now() - fetchedAt < CACHE_TTL_MS && feeds.discover.length > 0;

        if (fresh) {
          set({ isInitialized: true, isLoading: false }); // render cache instantly
          void (async () => {                              // silent background revalidate
            try {
              const next = await fetchAllFeeds();
              set({ feeds: next, fetchedAt: Date.now() });
            } catch (e) { console.error('Background revalidate failed:', e); }
          })();
          return;
        }

        set({ isLoading: true });
        try {
          const next = await fetchAllFeeds();
          set({ feeds: next, isLoading: false, isInitialized: true, fetchedAt: Date.now() });
        } catch (error) {
          set({ isLoading: false, isInitialized: true });
          console.error('Failed to initialize feeds:', error);
        }
      },

      refreshTab: async (tab: FeedTab) => {
        const user = useAuthStore.getState().user;
        if (!user?.email) return;
        set((state) => ({ loadingTabs: { ...state.loadingTabs, [tab]: true } }));
        try {
          let result;
          switch (tab) {
            case 'discover': result = await webhooks.fetchDiscoverFeed(); break;
            case 'recommended': result = await webhooks.fetchRecommendedFeed(); break;
            case 'trending': result = await webhooks.fetchTrendingFeed(); break;
            case 'likes': result = await webhooks.fetchLikedItems(); break;
            case 'saved': result = await webhooks.fetchSavedItems(); break;
            default: return;
          }
          set((state) => ({
            feeds: { ...state.feeds, [tab]: result.items },
            loadingTabs: { ...state.loadingTabs, [tab]: false },
            fetchedAt: Date.now(),
          }));
        } catch (error) {
          set((state) => ({ loadingTabs: { ...state.loadingTabs, [tab]: false } }));
          console.error(`Failed to refresh ${tab} feed:`, error);
        }
      },

      toggleLike: async (id, tab, isLiked, itemType) => {
        const user = useAuthStore.getState().user;
        if (!user?.email) { console.error('User email not found'); return; }
        set((state) => ({
          feeds: { ...state.feeds, [tab]: state.feeds[tab].map((item) => (item.id === id ? { ...item, isLiked: !isLiked } : item)) },
        }));
        try {
          await webhooks.syncLikeMutation(user.email, String(id), !isLiked, itemType);
        } catch (error) {
          set((state) => ({
            feeds: { ...state.feeds, [tab]: state.feeds[tab].map((item) => (item.id === id ? { ...item, isLiked } : item)) },
          }));
          console.error('Failed to sync like:', error);
        }
      },
    }),
    {
      name: 'feeds-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ feeds: state.feeds, fetchedAt: state.fetchedAt }),
    }
  )
);
