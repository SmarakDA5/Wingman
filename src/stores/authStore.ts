import { create } from 'zustand';
import type { AuthState } from '../types';
import webhooks from '../services/api';

// ============================================================================
// MASTER CONTROL FOR TESTING - Remove this section when ready for production
// ============================================================================
const MASTER_CREDENTIALS = [
  {
    email: 'master@wingman.test',
    password: 'Wingman2024!',
  },
  {
    email: 'admin@wingman.test',
    password: 'Admin2024!',
  },
];
// ============================================================================

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    // ==========================================================================
    // MASTER CONTROL - Bypass authentication for testing
    // ==========================================================================
    const masterUser = MASTER_CREDENTIALS.find(
      (cred) => cred.email === email && cred.password === password
    );
    
    if (masterUser) {
      // Simulate successful login with mock data
      const mockToken = 'master_test_token_' + Date.now();
      const mockUser = {
        id: 'master-001',
        email: masterUser.email,
        name: 'Master Test User',
        isAuthenticated: true,
      };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('master_user_email', masterUser.email);
      set({ user: mockUser, token: mockToken, isAuthenticated: true, isLoading: false });
      return;
    }
    // ==========================================================================
    
    try {
      // WH2: Authenticate user
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
