import { create } from 'zustand';
import webhooks from '../services/api';

interface SubscriptionState {
  has_access: boolean;
  loaded: boolean;
  error: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  verifySubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  has_access: false,
  loaded: false,
  error: false,
  subscriptionStatus: null,
  trialEndsAt: null,
  subscriptionEndsAt: null,

  verifySubscription: async () => {
    try {
      const res = await webhooks.verifySubscription();
      set({ has_access: !!res?.has_access, loaded: true, error: false });
    } catch {
      set({ has_access: true, loaded: true, error: true }); // fail OPEN on transient error
    }
  },
}));
