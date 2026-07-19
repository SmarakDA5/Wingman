import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from '../types';
import webhooks from '../services/api';

// Master control credentials for testing
export const MASTER_CREDENTIALS = [
  { email: 'master26@demo.com', password: 'G@M3r', hasSubscription: true },
  { email: 'slave26@demo.com', password: 'G@M3r', hasSubscription: false },
  { email: 'master26@gmail.com', password: 'G@M3r', hasSubscription: true },
  { email: 'slave26@gmail.com', password: 'G@M3r', hasSubscription: false },
  { email: 'master@wingman.test', password: 'Wingman2024!', hasSubscription: true },
  { email: 'admin@wingman.test', password: 'Admin2024!', hasSubscription: true },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Check for master credentials first
          const masterUser = MASTER_CREDENTIALS.find(
            cred => cred.email === email && cred.password === password
          );

          if (masterUser) {
            // Create mock user and token for master accounts - using email as primary identifier
            const token = `master_test_token_${masterUser.email}`;
            const user = { id: masterUser.email, email: masterUser.email };
            
            set({ 
              user: { ...user, isAuthenticated: true }, 
              token, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return;
          }

          // WH2: Authenticate user (for non-master users)
          const { user, token } = await webhooks.authenticateUser(email, password);
          // Backend returns user with email as primary identifier
          set({ user: { ...user, isAuthenticated: true }, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, confirmPassword: string) => {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        set({ isLoading: true });
        try {
          // WH0: Verify email availability
          await webhooks.verifyEmailAvailability(email);
          
          // WH1: Register user
          const { user, token } = await webhooks.registerUser(email, password);
          set({ user: { ...user, isAuthenticated: true }, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
