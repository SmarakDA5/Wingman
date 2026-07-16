import { create } from 'zustand';
import type { SubscriptionState } from '../types';
// import webhooks from '../services/api';

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: true, // Default to true for testing
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    try {
      // Check if current user is a master test user
      const token = localStorage.getItem('auth_token');
      const masterUserEmail = localStorage.getItem('master_user_email');
      const masterHasSubscription = localStorage.getItem('master_has_subscription');
      
      // Check for master user subscription status
      if (masterUserEmail && token?.includes('master_test_token')) {
        const hasSubscription = masterHasSubscription === 'true';
        set({ isActive: hasSubscription, isLoading: false });
        return hasSubscription;
      }
      
      // ============================================================================
      // WH3: Verify subscription for regular users
      // const { isActive } = await webhooks.verifySubscription();

      // ==========================================================================
      // MOCK DATA - Default to active for testing
      // ============================================================================
      set({ isActive: true, isLoading: false });
      return true;
      // ============================================================================
    } catch (error) {
      set({ isActive: false, isLoading: false });
      return false;
    }
  },
}));
