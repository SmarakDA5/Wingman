import { create } from 'zustand';
import type { FeedItem } from '../types';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

// Feeds/likes/saved are NEVER persisted: they vanish on close/logout and, crucially,
// are not fetched at all when the account has no active access.

export type FeedTab = 'discover' | 'recommended' | 'trending' | 'likes' | 'saved';

const EMPTY_FEEDS: Record<FeedTab, FeedItem[]> = { discover: [], recommended: [], trending: [], likes: [], saved: [] };

export interface FeedsState {
  activeTab: FeedTab;
  feeds: Record<FeedTab, FeedItem[]>;
  isLoading: boolean;
  isInitialized: boolean;
  fetchedAt: number | null;
  accessDenied: boolean;
  loadingTabs: Partial<Record<FeedTab, boolean>>;
  setActiveTab: (tab: FeedTab) => void;
  initializeFeeds: (force?: boolean) => Promise<void>;
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

async function awaitAuthHydration(): Promise<void> {
  const ap = (useAuthStore as any).persist;
  if (ap && typeof ap.hasHydrated === 'function' && !ap.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const off = ap.onFinishHydration(() => { off?.(); resolve(); });
      if (ap.hasHydrated()) { off?.(); resolve(); }
    });
  }
}

// PASS A verdict: is this account entitled to content right now?
// Fail-OPEN on a transient error so a paying user whose status check times out isn't stranded;
// a genuine denial (has_access=false, no error) returns false and withholds all content.
async function checkAccess(): Promise<boolean> {
  try {
    const mod = await import('./subscriptionStore');
    const useSub = (mod as any).useSubscriptionStore;
    if (!useSub || typeof useSub.getState !== 'function') return true;
    const ap = useSub.persist;
    if (ap && typeof ap.hasHydrated === 'function' && !ap.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const off = ap.onFinishHydration(() => { off?.(); resolve(); });
        if (ap.hasHydrated()) { off?.(); resolve(); }
      });
    }
    let st = useSub.getState();
    if (!st.loaded && typeof st.verifySubscription === 'function') {
      try { await st.verifySubscription(); } catch { /* fall through to fail-open */ }
      st = useSub.getState();
    }
    if (st.error) return true;
    return st.has_access === true;
  } catch {
    return true;
  }
}

// Exported so views that fetch content directly (Likes) can gate on the same verdict.
export const hasContentAccess = checkAccess;

let grantWired = false;

export const useFeedsStore = create<FeedsState>()((set, get) => ({
  activeTab: 'discover',
  feeds: { ...EMPTY_FEEDS },
  isLoading: false,
  isInitialized: false,
  fetchedAt: null,
  accessDenied: false,
  loadingTabs: {},

  setActiveTab: (activeTab: FeedTab) => set({ activeTab }),

  initializeFeeds: async (force?: boolean) => {
    if (!force && get().isInitialized) return;
    await awaitAuthHydration();
    const email = useAuthStore.getState().user?.email;
    if (!email) {
      set({ feeds: { ...EMPTY_FEEDS }, isLoading: false, isInitialized: true, fetchedAt: null, accessDenied: false });
      return;
    }
    // PASS A must resolve before PASS B is allowed to run.
    const allowed = await checkAccess();
    set({ accessDenied: !allowed });
    if (!allowed) {
      // Withhold everything: no network call, empty in-memory feeds.
      set({ feeds: { ...EMPTY_FEEDS }, isLoading: false, isInitialized: true, fetchedAt: null });
    } else {
      set({ isLoading: true });
      try {
        const next = await fetchAllFeeds();
        set({ feeds: next, isLoading: false, isInitialized: true, fetchedAt: Date.now() });
      } catch (error) {
        set({ isLoading: false, isInitialized: true });
        console.error('Failed to initialize feeds:', error);
      }
    }
    // Auto-load content the moment access is granted, without a reload.
    if (!grantWired) {
      grantWired = true;
      try {
        const mod = await import('./subscriptionStore');
        const useSub = (mod as any).useSubscriptionStore;
        if (useSub && typeof useSub.subscribe === 'function') {
          let last = !!(useSub.getState && useSub.getState().has_access);
          useSub.subscribe((st: any) => {
            const now = !!st.has_access;
            if (now && !last) { last = now; void get().initializeFeeds(true); }
            else { last = now; }
          });
        }
      } catch { /* ignore */ }
    }
  },

  refreshTab: async (tab: FeedTab) => {
    const user = useAuthStore.getState().user;
    if (!user?.email) return;
    if (!(await checkAccess())) return; // never refresh content for a locked account
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
      set((state) => ({ feeds: { ...state.feeds, [tab]: result.items }, loadingTabs: { ...state.loadingTabs, [tab]: false }, fetchedAt: Date.now() }));
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

  clearFeeds: () => set({ feeds: { ...EMPTY_FEEDS }, isInitialized: false, fetchedAt: null, accessDenied: false, loadingTabs: {}, isLoading: false }),
}));
