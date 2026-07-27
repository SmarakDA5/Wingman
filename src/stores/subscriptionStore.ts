import { create } from 'zustand';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

interface SubscriptionState {
  has_access: boolean;
  loaded: boolean;
  error: boolean;
  isActive: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isLoading: boolean;
  verifySubscription: () => Promise<void>;
}

// Wait until auth-storage has rehydrated so the email interceptor is populated.
// Without this, verifySubscription can fire before the email is available, the
// GET returns no rows, and the store wrongly records has_access=false — which
// pops the "Your free trial has ended" modal even though the trial is active.
async function awaitAuthHydration(): Promise<void> {
  const ap = (useAuthStore as any).persist;
  if (ap && typeof ap.hasHydrated === 'function' && !ap.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const off = ap.onFinishHydration(() => { off?.(); resolve(); });
      if (ap.hasHydrated()) { off?.(); resolve(); }
    });
  }
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  has_access: false,
  loaded: false,
  error: false,
  isActive: false,
  subscriptionStatus: null,
  trialEndsAt: null,
  subscriptionEndsAt: null,
  isLoading: false,

  verifySubscription: async () => {
    set({ isLoading: true });
    await awaitAuthHydration();
    try {
      const response = await webhooks.verifySubscription();
      if (!response) {
        set({ has_access: false, isActive: false, loaded: true, error: false, isLoading: false });
        return;
      }
      const hasAccess = !!response.has_access;
      set({
        has_access: hasAccess,
        isActive: hasAccess,
        subscriptionStatus: response.subscription_status || null,
        trialEndsAt: response.trial_ends_at || null,
        subscriptionEndsAt: response.subscription_ends_at || null,
        loaded: true,
        error: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Subscription verification failed:', error);
      // Fail OPEN on transient error so a timeout/cold-start never locks the user out
      set({ has_access: true, isActive: true, loaded: true, error: true, isLoading: false });
    }
  },
}));
