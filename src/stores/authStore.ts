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
          if (result && result.email) {
            const user = { id: result.email, email: result.email };
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
          // Verify email availability
          const { exists } = await webhooks.verifyEmailAvailability(email);
          if (exists) {
            set({ isLoading: false });
            throw new Error('Email already in use');
          }
          
          // Register user
          await webhooks.registerUser(email, password);
          
          // Auto-login after registration
          const result = await webhooks.authenticateUser(email, password);
          if (result && result.email) {
            const user = { id: result.email, email: result.email };
            const token = `auth_token_${email}`;
            set({ user: { ...user, isAuthenticated: true }, token, isAuthenticated: true, isLoading: false });
          } else {
            set({ isLoading: false });
            throw new Error('Registration successful but auto-login failed');
          }
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
