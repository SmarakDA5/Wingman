import { create } from 'zustand';
import type { SubscriptionState } from '../types';
// import webhooks from '../services/api';

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: false,
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    try {
      // WH3: Verify subscription for regular users
      // const { isActive } = await webhooks.verifySubscription();

      // ==========================================================================
      // MOCK DATA - Default to active for testing
      // ==========================================================================
      set({ isActive: true, isLoading: false });
      // ==========================================================================
    } catch (error) {
      set({ isActive: false, isLoading: false });
    }
  },
}));
