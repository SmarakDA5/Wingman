import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook';

export const apiClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  if (user?.email && config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, email: user.email };
  }
  return config;
});

const G = { AUTH: '/auth', FEEDS: '/feeds', USER: '/user' } as const;
const first = (d: any) => (Array.isArray(d) ? d[0] : d);

export const webhooks = {
  verifyEmailAvailability: async (email: string) => {
    const { data } = await apiClient.post(`${G.AUTH}/verify-email`, { email });
    return { exists: Number(first(data)?.exists ?? 0) > 0 };
  },
  registerUser: async (email: string, password: string, fname = 'User', lname = '') => {
    const { data } = await apiClient.post(`${G.AUTH}/register`, { email, password, fname, lname });
    return first(data);
  },
  authenticateUser: async (email: string, password: string) => {
    const { data } = await apiClient.post(`${G.AUTH}/login`, { email, password });
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },
  verifySubscription: async () => first((await apiClient.get(`${G.USER}/subscription-guard`)).data),
  fetchQuestionnaire: async () => ({ answers: first((await apiClient.get(`${G.USER}/profile`)).data) ?? {} }),
  fetchLikedItems: async () => ({ items: (await apiClient.get(`${G.USER}/likes`)).data ?? [] }),
  fetchSavedItems: async () => ({ items: (await apiClient.get(`${G.USER}/saved`)).data ?? [] }),
  fetchDiscoverFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/discover`)).data ?? [] }),
  fetchRecommendedFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/recommended`)).data ?? [] }),
  fetchTrendingFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/trending`)).data ?? [] }),
  syncLikeMutation: async (email: string, itemId: number, isLiked: boolean, itemType: 'internship' | 'scheme' | 'job' | 'course') => {
    await apiClient.post(`${G.USER}/likes/toggle`, { email, item_id: itemId, item_type: itemType, action_like: isLiked });
  },
  updateUserInfo: async (answers: Record<string, any>) => {
    const email = useAuthStore.getState().user?.email;
    await apiClient.post(`${G.USER}/profile/update`, { email, ...answers });
  },
};

export default webhooks;
