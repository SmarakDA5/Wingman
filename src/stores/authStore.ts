import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from '../types';
import webhooks from '../services/api';

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
          // Always authenticate via backend - no master credentials bypass
          const result = await webhooks.authenticateUser(email, password);
          
          // Backend returns [{ email }] on success, empty array on failure
          if (Array.isArray(result) && result.length > 0 && result[0]?.email) {
            const user = { id: result[0].email, email: result[0].email };
            const token = `auth_token_${email}`;
            
            set({ 
              user: { ...user, isAuthenticated: true }, 
              token, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
            throw new Error('Invalid credentials');
          }
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
