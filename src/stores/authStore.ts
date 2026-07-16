import { create } from 'zustand';
import type { AuthState } from '../types';
import webhooks from '../services/api';

// Master control credentials for testing
const MASTER_CREDENTIALS = [
  { email: 'master26@demo.com', password: 'G@M3r', hasSubscription: true },
  { email: 'slave26@demo.com', password: 'G@M3r', hasSubscription: false },
  { email: 'master26@gmail.com', password: 'G@M3r', hasSubscription: true },
  { email: 'slave26@gmail.com', password: 'G@M3r', hasSubscription: false },
  {
    email: 'master@wingman.test',
    password: 'Wingman2024!',
  },
  {
    email: 'admin@wingman.test',
    password: 'Admin2024!',
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      // Check for master credentials first
      const masterUser = MASTER_CREDENTIALS.find(
        cred => cred.email === email && cred.password === password
      );

      if (masterUser) {
        // Create mock user and token for master accounts
        const token = `master_test_token_${masterUser.email}`;
        const user = { id: `master_${masterUser.email}`, email: masterUser.email };
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('master_user_email', masterUser.email);
        localStorage.setItem('master_has_subscription', String(masterUser.hasSubscription));
        
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
      localStorage.setItem('auth_token', token);
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
      localStorage.setItem('auth_token', token);
      set({ user: { ...user, isAuthenticated: true }, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
