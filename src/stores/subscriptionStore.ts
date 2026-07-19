import { create } from 'zustand';
import { useAuthStore } from './authStore';
import webhooks from '../services/api';

interface SubscriptionState {
  isActive: boolean;
  hasAccess: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isLoading: boolean;
  verifySubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: false,
  hasAccess: false,
  subscriptionStatus: null,
  trialEndsAt: null,
  subscriptionEndsAt: null,
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    try {
      // Get email from auth store
      const { user } = useAuthStore.getState();
      
      if (!user?.email) {
        set({ 
          isActive: false, 
          hasAccess: false, 
          subscriptionStatus: null, 
          trialEndsAt: null, 
          subscriptionEndsAt: null,
          isLoading: false 
        });
        return;
      }

      // Call backend subscription-guard endpoint
      const response = await webhooks.verifySubscription();
      const row = Array.isArray(response) ? response[0] : response;
      
      const hasAccess = !!row?.has_access;
      const subscriptionStatus = row?.subscription_status || null;
      const trialEndsAt = row?.trial_ends_at || null;
      const subscriptionEndsAt = row?.subscription_ends_at || null;
      
      set({ 
        isActive: hasAccess,
        hasAccess,
        subscriptionStatus,
        trialEndsAt,
        subscriptionEndsAt,
        isLoading: false 
      });
    } catch (error) {
      console.error("Subscription verification failed:", error);
      // Fail closed on error
      set({ 
        isActive: false, 
        hasAccess: false, 
        subscriptionStatus: null, 
        trialEndsAt: null, 
        subscriptionEndsAt: null,
        isLoading: false 
      });
    }
  },
}));
