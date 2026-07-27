import { create } from 'zustand';
import type { FeedItem } from '../types';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

// This store is intentionally NOT persisted: recommendations + likes must live only in
// memory so they vanish on tab-close and are always re-fetched from the DB per session.
if (typeof window !== 'undefined') {
  try { localStorage.removeItem('feeds-storage'); } catch { /* ignore */ } // purge the old blob once
}

export type FeedTab = 'discover' | 'recommended' | 'trending' | 'likes' | 'saved';

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
  clearFeeds: () => void;
}

async function fetchAllFeeds(): Promise<Record<FeedTab, FeedItem[]>> {
  const [discover, recommended, trending, likes, saved] = await Promise.allSettled([
    webhooks.fetchDiscoverFeed(), webhooks.fetchRecommendedFeed(), webhooks.fetchTrendingFeed(),
    webhooks.fetchLikedItems(), webhooks.fetchSavedItems(),
  ]);
  return {
    discover: discover.status === 'fulfilled' ? discover.value.items : [],
    recommended: recommended.status === 'fulfilled' ? recommended.value.items : [],
    trending: trending.status === 'fulfilled' ? trending.value.items : [],
    likes: likes.status === 'fulfilled' ? likes.value.items : [],
    saved: saved.status === 'fulfilled' ? saved.value.items : [],
  };
}

// Wait until auth-storage has rehydrated so the email interceptor is populated.
async function awaitAuthHydration(): Promise<void> {
  const ap = (useAuthStore as any).persist;
  if (ap && typeof ap.hasHydrated === 'function' && !ap.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const off = ap.onFinishHydration(() => { off?.(); resolve(); });
      if (ap.hasHydrated()) { off?.(); resolve(); }
    });
  }
}

export const useFeedsStore = create<FeedsState>()((set, get) => ({
  activeTab: 'discover',
  feeds: { ...EMPTY_FEEDS },
  isLoading: false,
  isInitialized: false,
  fetchedAt: null,
  loadingTabs: {},

  setActiveTab: (activeTab: FeedTab) => set({ activeTab }),

  initializeFeeds: async () => {
    await awaitAuthHydration();
    const email = useAuthStore.getState().user?.email;
    if (!email) { set({ feeds: { ...EMPTY_FEEDS }, isLoading: false, isInitialized: true, fetchedAt: null }); return; }
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
    const next = !isLiked;
    set((state) => {
      const feeds = { ...state.feeds };
      (Object.keys(feeds) as FeedTab[]).forEach((t) => {
        const list = feeds[t];
        feeds[t] = (t === 'likes' || t === 'saved') && !next
          ? list.filter((item) => item.id !== id)
          : list.map((item) => (item.id === id ? { ...item, isLiked: next } : item));
      });
      return { feeds };
    });
    try {
      await webhooks.syncLikeMutation(user.email, String(id), next, itemType);
    } catch (error) {
      console.error('Failed to sync like:', error);
      try { await get().refreshTab(tab); } catch { /* ignore */ }
    }
  },

  // Wipe in-memory feeds (used on logout so nothing leaks to the next session/account).
  clearFeeds: () => set({ feeds: { ...EMPTY_FEEDS }, isInitialized: false, fetchedAt: null, loadingTabs: {}, isLoading: false }),
}));
