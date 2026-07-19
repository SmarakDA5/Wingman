import axios from 'axios';
import { useAuthStore } from '../stores/authStore'; // Adjust path if needed
import type { FeedItem } from '../types'; // Adjust path if needed

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

export const apiClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s timeout for AI rate-limit waits
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // CRITICAL: Auto-attach email to GET requests for the new Gateways
    if (state.user?.email && config.method?.toLowerCase() === 'get') {
      config.params = { ...config.params, email: state.user.email };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// New Consolidated Gateway Paths
const GATEWAYS = {
  AUTH: '/auth',
  FEEDS: '/feeds',
  USER: '/user',
} as const;

export const webhooks = {
  // --- AUTH GATEWAY (POST /auth/:action) ---
  verifyEmailAvailability: async (email: string) => {
    const response = await apiClient.post(`${GATEWAYS.AUTH}/verify-email`, { email });
    return response.data;
  },

  registerUser: async (email: string, password: string, fname?: string, lname?: string) => {
    const response = await apiClient.post(`${GATEWAYS.AUTH}/register`, { 
      email, password, fname: fname || 'User', lname: lname || 'Test' 
    });
    return response.data;
  },

  authenticateUser: async (email: string, password: string) => {
    const response = await apiClient.post(`${GATEWAYS.AUTH}/login`, { email, password });
    return response.data;
  },

  // --- USER GET GATEWAY (GET /user/:resource) ---
  verifySubscription: async () => {
    const response = await apiClient.get(`${GATEWAYS.USER}/subscription-guard`);
    return response.data;
  },

  fetchQuestionnaire: async () => {
    const response = await apiClient.get(`${GATEWAYS.USER}/profile`);
    // Adapter: Backend returns raw DB row. Map to { answers: {...} } for profileStore
    const userData = Array.isArray(response.data) ? response.data[0] : response.data;
    return { answers: userData || {} };
  },

  fetchLikedItems: async (): Promise<{ items: FeedItem[] }> => {
    const response = await apiClient.get(`${GATEWAYS.USER}/likes`);
    return { items: response.data || [] };
  },

  fetchSavedItems: async (): Promise<{ items: FeedItem[] }> => {
    const response = await apiClient.get(`${GATEWAYS.USER}/saved`);
    return { items: response.data || [] };
  },

  // --- FEEDS GATEWAY (GET /feeds/:type) ---
  fetchDiscoverFeed: async (): Promise<{ items: FeedItem[] }> => {
    const response = await apiClient.get(`${GATEWAYS.FEEDS}/discover`);
    return { items: response.data || [] };
  },

  fetchRecommendedFeed: async (scopeTier?: number): Promise<{ items: FeedItem[] }> => {
    const params = scopeTier !== undefined ? { scope_tier: scopeTier } : {};
    const response = await apiClient.get(`${GATEWAYS.FEEDS}/recommended`, { params });
    return { items: response.data || [] };
  },

  fetchTrendingFeed: async (): Promise<{ items: FeedItem[] }> => {
    const response = await apiClient.get(`${GATEWAYS.FEEDS}/trending`);
    return { items: response.data || [] };
  },

  // --- USER POST GATEWAY (POST /user/:resource/:action) ---
  syncLikeMutation: async (email: string, itemId: string, isLiked: boolean, itemType: 'internship' | 'scheme' | 'job' | 'course') => {
    await apiClient.post(`${GATEWAYS.USER}/likes/toggle`, { 
      email, item_id: itemId, action_like: isLiked, item_type: itemType 
    });
  },

  updateUserInfo: async (answers: Record<string, any>) => {
    const email = useAuthStore.getState().user?.email;
    // Flattens the answers object to match backend SQL expectations
    await apiClient.post(`${GATEWAYS.USER}/profile/update`, { email, ...answers });
  },
};

export default webhooks;
