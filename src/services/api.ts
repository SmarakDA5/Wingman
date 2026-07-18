import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Vercel Patch: Use absolute Render URIs directly via environment variable
// This bypasses Vercel's 10s Serverless Function timeout constraint
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

export const apiClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store state (primary source)
    const state = useAuthStore.getState();
    const token = state.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Webhook identifiers as per specification
export const WEBHOOKS = {
  // WH0: Signup Submission - POST /verify_email_availability
  // WH1: Post-WH0 Success - POST /register_user
  // WH2: Signin Submission - POST /authenticate_user
  // WH3: Shell Mount (Global) - GET /verify_subscription
  // WH4: Main Feed - GET /feeds/discover
  // WH5: AI Matched - GET /feeds/recommended
  // WH6: High Applicants - GET /feeds/trending
  // WH7: User's Liked Items - GET /user/likes
  // WH8: Heart Icon Click - POST /sync_like_mutation
  // WH9: Fetch Profile - GET /fetch_questionnaire
  // WH10: Info Update Click - POST /update_user_info
  // WH11: User's Bookmarks - GET /user/saved
  WH0: { method: 'POST', endpoint: '/verify_email_availability' },
  WH1: { method: 'POST', endpoint: '/register_user' },
  WH2: { method: 'POST', endpoint: '/authenticate_user' },
  WH3: { method: 'GET', endpoint: '/verify_subscription' },
  WH4: { method: 'GET', endpoint: '/feeds/discover' },
  WH5: { method: 'GET', endpoint: '/feeds/recommended' },
  WH6: { method: 'GET', endpoint: '/feeds/trending' },
  WH7: { method: 'GET', endpoint: '/user/likes' },
  WH8: { method: 'POST', endpoint: '/sync_like_mutation' },
  WH9: { method: 'GET', endpoint: '/fetch_questionnaire' },
  WH10: { method: 'POST', endpoint: '/update_user_info' },
  WH11: { method: 'GET', endpoint: '/user/saved' },
} as const;

import type { FeedItem } from '../types';

interface FetchFeedResponse {
  items: FeedItem[];
}

interface FetchLikedItemsResponse {
  items: FeedItem[];
}

interface FetchSavedItemsResponse {
  items: FeedItem[];
}

// Webhook execution functions
export const webhooks = {
  // WH0: Verify email availability
  verifyEmailAvailability: async (email: string): Promise<{ available: boolean }> => {
    const response = await apiClient.post(WEBHOOKS.WH0.endpoint, { email });
    return response.data;
  },

  // WH1: Register user
  registerUser: async (email: string, password: string): Promise<{ user: { id: string; email: string }; token: string }> => {
    const response = await apiClient.post(WEBHOOKS.WH1.endpoint, { email, password });
    return response.data;
  },

  // WH2: Authenticate user
  authenticateUser: async (email: string, password: string): Promise<{ user: { id: string; email: string }; token: string }> => {
    const response = await apiClient.post(WEBHOOKS.WH2.endpoint, { email, password });
    return response.data;
  },

  // WH3: Verify subscription
  verifySubscription: async (): Promise<{ isActive: boolean }> => {
    const response = await apiClient.get(WEBHOOKS.WH3.endpoint);
    return response.data;
  },

  // WH4: Fetch main feed (discover)
  fetchDiscoverFeed: async (): Promise<FetchFeedResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH4.endpoint);
    return response.data;
  },

  // WH5: Fetch AI matched recommendations
  fetchRecommendedFeed: async (): Promise<FetchFeedResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH5.endpoint);
    return response.data;
  },

  // WH6: Fetch trending (high applicants)
  fetchTrendingFeed: async (): Promise<FetchFeedResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH6.endpoint);
    return response.data;
  },

  // WH7: Fetch user's liked items
  fetchLikedItems: async (): Promise<FetchLikedItemsResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH7.endpoint);
    return response.data;
  },

  // WH8: Sync like mutation
  syncLikeMutation: async (itemId: string, isLiked: boolean, itemType: 'internship' | 'scheme' | 'job' | 'course'): Promise<void> => {
    await apiClient.post(WEBHOOKS.WH8.endpoint, { itemId, isLiked, itemType });
  },

  // WH9: Fetch questionnaire (profile)
  fetchQuestionnaire: async (): Promise<{ answers: Record<string, string> }> => {
    const response = await apiClient.get(WEBHOOKS.WH9.endpoint);
    return response.data;
  },

  // WH10: Update user info
  updateUserInfo: async (answers: Record<string, string>): Promise<void> => {
    await apiClient.post(WEBHOOKS.WH10.endpoint, { answers });
  },

  // WH11: Fetch user's saved/bookmarked items
  fetchSavedItems: async (): Promise<FetchSavedItemsResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH11.endpoint);
    return response.data;
  },
};

export default webhooks;
