import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import webhooks from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  isAuthenticated?: boolean;
}

export interface AuthStoreState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Always resolves or rejects — never hangs, never throws before the network call
      // without reporting it, so the UI's spinner can always clear.
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await webhooks.authenticateUser(email, password);
          if (!result || !result.email) {
            set({ isLoading: false });
            throw new Error('Invalid email or password.');
          }
          const user: AuthUser = { id: result.email, email: result.email, isAuthenticated: true };
          set({ user, token: `auth_token_${email}`, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, confirmPassword: string) => {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        set({ isLoading: true });
        try {
          const { exists } = await webhooks.verifyEmailAvailability(email);
          if (exists) { set({ isLoading: false }); throw new Error('That email is already registered.'); }
          await webhooks.registerUser(email, password);
          const result = await webhooks.authenticateUser(email, password);
          if (!result || !result.email) { set({ isLoading: false }); throw new Error('Account created, but sign-in failed — please sign in.'); }
          const user: AuthUser = { id: result.email, email: result.email, isAuthenticated: true };
          set({ user, token: `auth_token_${email}`, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        // Drop per-session data via dynamic import so we never create a static import cycle.
        void (async () => {
          try { const m = await import('./dashboardStore'); (m.useFeedsStore.getState() as any).clearFeeds?.(); } catch { /* ignore */ }
          try { const m = await import('./profileStore'); (m.useProfileStore.getState() as any).markStale?.(); } catch { /* ignore */ }
        })();
      },
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => localStorage) }
  )
);
