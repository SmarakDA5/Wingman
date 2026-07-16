import { create } from 'zustand';
import type { SubscriptionState } from '../types';
// import webhooks from '../services/api';

// ============================================================================
// MASTER CONTROL FOR TESTING - Auto-grant subscription to master@wingman.test
// ============================================================================
const MASTER_EMAIL = 'master@wingman.test';

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: true, // Default to true for master user
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    try {
      // Check if current user is the master test user
      const token = localStorage.getItem('auth_token');
      const isMasterUser = token?.includes('master_test_token') || 
                          localStorage.getItem('master_user_email') === MASTER_EMAIL;
      
      if (isMasterUser) {
        // Auto-grant subscription for master test user
        set({ isActive: true, isLoading: false });
        return;
      }
      
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
