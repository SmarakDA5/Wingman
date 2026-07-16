import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
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
// Keep these endpoints commented for later backend integration
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
} as const;

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

  // WH4: Fetch internships
  fetchInternships: async (scope: string): Promise<{ internships: any[] }> => {
    // WH4: Fetch internships with scope param
    // Endpoint: GET /fetch_internships?scope={scope}
    // Expected response: { internships: Internship[] }
    const response = await apiClient.get(WEBHOOKS.WH4.endpoint, { params: { scope } });
    return response.data;
  },

  // WH5: Fetch schemes
  fetchSchemes: async (scope: string): Promise<{ schemes: any[] }> => {
    // WH5: Fetch schemes with scope param
    // Endpoint: GET /fetch_schemes?scope={scope}
    // Expected response: { schemes: Scheme[] }
    const response = await apiClient.get(WEBHOOKS.WH5.endpoint, { params: { scope } });
    return response.data;
  },

  // WH6: Fetch jobs
  fetchJobs: async (scope: string): Promise<{ jobs: any[] }> => {
    // WH6: Fetch jobs with scope param
    // Endpoint: GET /fetch_jobs?scope={scope}
    // Expected response: { jobs: Job[] }
    const response = await apiClient.get(WEBHOOKS.WH6.endpoint, { params: { scope } });
    return response.data;
  },

  // WH7: Fetch liked events
  fetchLikedEvents: async (): Promise<{ items: any[] }> => {
    // WH7: Fetch liked events
    // Endpoint: GET /fetch_liked_events
    // Expected response: { items: (Internship | Scheme | Job)[] }
    const response = await apiClient.get(WEBHOOKS.WH7.endpoint);
    return response.data;
  },

  // WH8: Sync like mutation
  syncLikeMutation: async (itemId: string, isLiked: boolean, type: 'internship' | 'scheme' | 'job'): Promise<void> => {
    // WH8: Sync like mutation
    // Endpoint: POST /sync_like_mutation
    // Payload: { itemId: string, isLiked: boolean, type: 'internship' | 'scheme' | 'job' }
    await apiClient.post(WEBHOOKS.WH8.endpoint, { itemId, isLiked, type });
  },

  // WH9: Fetch questionnaire
  fetchQuestionnaire: async (): Promise<{ questions: any[] }> => {
    // WH9: Fetch questionnaire
    // Endpoint: GET /fetch_questionnaire
    // Expected response: { questions: QuestionnaireQuestion[] }
    const response = await apiClient.get(WEBHOOKS.WH9.endpoint);
    return response.data;
  },

  // WH10: Update user info
  updateUserInfo: async (answers: Record<string, string>): Promise<void> => {
    // WH10: Update user info
    // Endpoint: POST /update_user_info
    // Payload: { answers: Record<string, string> }
    await apiClient.post(WEBHOOKS.WH10.endpoint, { answers });
  },
};

export default webhooks;
