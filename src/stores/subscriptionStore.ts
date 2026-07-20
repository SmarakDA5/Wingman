import { create } from 'zustand';
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
      // Call backend subscription-guard endpoint
      const response = await webhooks.verifySubscription();
      
      if (!response) {
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
      
      const hasAccess = !!response.has_access;
      const subscriptionStatus = response.subscription_status || null;
      const trialEndsAt = response.trial_ends_at || null;
      const subscriptionEndsAt = response.subscription_ends_at || null;
      
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
