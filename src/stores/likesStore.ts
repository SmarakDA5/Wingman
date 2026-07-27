import { create } from 'zustand';
import type { FeedItem } from '../types';
import webhooks from '../services/api';

export interface LikesState {
  likedItems: FeedItem[];
  isLoading: boolean;
  isInitialized: boolean;
  fetchLikedItems: () => Promise<void>;
}

export const useLikesStore = create<LikesState>((set) => ({
  likedItems: [],
  isLoading: false,
  isInitialized: false,

  fetchLikedItems: async () => {
    set({ isLoading: true });
    try {
      // WH7: Fetch user's liked items from backend
      const response = await webhooks.fetchLikedItems();
      set({ likedItems: response.items, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      console.error('Failed to fetch liked items:', error);
    }
  },
}));
