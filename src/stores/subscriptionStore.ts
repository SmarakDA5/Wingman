import { create } from 'zustand';
import { useAuthStore, MASTER_CREDENTIALS } from './authStore';
// import { webhooks } from '../services/api';

interface SubscriptionState {
  isActive: boolean;
  isLoading: boolean;
  verifySubscription: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isActive: true,
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    try {
      // 1. Get state directly from Zustand Auth Store (NOT raw localStorage)
      const { user, token } = useAuthStore.getState();

      if (!user || !token) {
        set({ isActive: false, isLoading: false });
        return false;
      }

      // 2. Check if this is a Master Test Token
      if (token.includes('master_test_token')) {
        // Find the master user config to check their hardcoded subscription status
        const masterUser = MASTER_CREDENTIALS.find(cred => cred.email === user.email);
        const hasSubscription = masterUser?.hasSubscription === true;
        
        set({ isActive: hasSubscription, isLoading: false });
        return hasSubscription;
      }

      // 3. For regular users, call backend WH3
      // Uncomment when backend WH3 is fully connected and returning data
      // const response = await webhooks.verifySubscription();
      // const isActive = response?.[0]?.is_subscribed || false;
      
      // MOCK: Default to true for testing regular users without DB
      const isActive = true; 
      
      set({ isActive, isLoading: false });
      return isActive;

    } catch (error) {
      console.error("Subscription verification failed:", error);
      // Fallback to true on error during testing so users aren't locked out
      set({ isActive: true, isLoading: false }); 
      return true;
    }
  },
}));
