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
  // WH4: Dashboard Mount - GET /fetch_internships
  // WH5: Dashboard Mount - GET /fetch_schemes
  // WH6: Dashboard Mount - GET /fetch_jobs
  // WH7: Likes Mount - GET /fetch_liked_events
  // WH8: Heart Icon Click - POST /sync_like_mutation
  // WH9: Info Tab Mount - GET /fetch_questionnaire
  // WH10: Info Update Click - POST /update_user_info
  // WH11: Dashboard Mount - GET /fetch_courses
  WH0: { method: 'POST', endpoint: '/verify_email_availability' },
  WH1: { method: 'POST', endpoint: '/register_user' },
  WH2: { method: 'POST', endpoint: '/authenticate_user' },
  WH3: { method: 'GET', endpoint: '/verify_subscription' },
  WH4: { method: 'GET', endpoint: '/fetch_internships' },
  WH5: { method: 'GET', endpoint: '/fetch_schemes' },
  WH6: { method: 'GET', endpoint: '/fetch_jobs' },
  WH7: { method: 'GET', endpoint: '/fetch_liked_events' },
  WH8: { method: 'POST', endpoint: '/sync_like_mutation' },
  WH9: { method: 'GET', endpoint: '/fetch_questionnaire' },
  WH10: { method: 'POST', endpoint: '/update_user_info' },
  WH11: { method: 'GET', endpoint: '/fetch_courses' },
} as const;

import type { FeedItem } from '../types';

interface FetchInternshipsResponse {
  internships: FeedItem[];
}

interface FetchSchemesResponse {
  schemes: FeedItem[];
}

interface FetchJobsResponse {
  jobs: FeedItem[];
}

interface FetchCoursesResponse {
  courses: FeedItem[];
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

  // WH4: Fetch internships - no scope param, client-side filtering only
  fetchInternships: async (): Promise<FetchInternshipsResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH4.endpoint);
    return response.data;
  },

  // WH5: Fetch schemes - no scope param, client-side filtering only
  fetchSchemes: async (): Promise<FetchSchemesResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH5.endpoint);
    return response.data;
  },

  // WH6: Fetch jobs - no scope param, client-side filtering only
  fetchJobs: async (): Promise<FetchJobsResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH6.endpoint);
    return response.data;
  },

  // WH7: Fetch liked events
  fetchLikedEvents: async (): Promise<{ items: FeedItem[]; courses?: FeedItem[] }> => {
    const response = await apiClient.get(WEBHOOKS.WH7.endpoint);
    return response.data;
  },

  // WH8: Sync like mutation
  syncLikeMutation: async (itemId: string, isLiked: boolean, itemType: 'internship' | 'scheme' | 'job' | 'course'): Promise<void> => {
    await apiClient.post(WEBHOOKS.WH8.endpoint, { itemId, isLiked, itemType });
  },

  // WH9: Fetch questionnaire
  fetchQuestionnaire: async (): Promise<{ questions: any[] }> => {
    const response = await apiClient.get(WEBHOOKS.WH9.endpoint);
    return response.data;
  },

  // WH10: Update user info
  updateUserInfo: async (answers: Record<string, string>): Promise<void> => {
    await apiClient.post(WEBHOOKS.WH10.endpoint, { answers });
  },

  // WH11: Fetch courses - no scope param, client-side filtering only
  fetchCourses: async (): Promise<FetchCoursesResponse> => {
    const response = await apiClient.get(WEBHOOKS.WH11.endpoint);
    return response.data;
  },
};

export default webhooks;
