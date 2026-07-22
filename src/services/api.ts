import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '/webhook';

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

// Retry GET requests once on timeout/5xx (handles cold DB starts)
const retried = new WeakSet<object>();
apiClient.interceptors.response.use(undefined, async (err) => {
  const cfg = err?.config;
  if (!cfg || retried.has(cfg)) return Promise.reject(err);
  const isGet = (cfg.method || '').toLowerCase() === 'get';
  const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
  const is5xx = !err?.response || err?.response?.status >= 500;
  if (isGet && (isTimeout || is5xx)) {
    retried.add(cfg);
    await new Promise((r) => setTimeout(r, 1200));
    return apiClient(cfg);
  }
  return Promise.reject(err);
});

// n8n production webhooks require webhookId in path: /webhook/{webhookId}/{path}
const G = {
  AUTH:      '/6e16a3b9-7652-41b5-b49e-c7a817e8b272/auth',
  FEEDS:     '/075954ad-35a6-4efc-8f43-bfd806d1116b/feeds',
  USER_GET:  '/f8fcec04-cf28-43c7-bc6b-ba69bab7f331/user',
  USER_POST: '/3bc1355c-c506-458e-b93c-6ff2d93ab94b/user',
} as const;

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
  verifySubscription: async () => first((await apiClient.get(`${G.USER_GET}/subscription-guard`)).data),
  fetchQuestionnaire: async () => ({ answers: first((await apiClient.get(`${G.USER_GET}/profile`)).data) ?? {} }),
  fetchLikedItems: async () => ({ items: (await apiClient.get(`${G.USER_GET}/likes`)).data ?? [] }),
  fetchSavedItems: async () => ({ items: (await apiClient.get(`${G.USER_GET}/saved`)).data ?? [] }),
  fetchDiscoverFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/discover`)).data ?? [] }),
  fetchRecommendedFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/recommended`)).data ?? [] }),
  fetchTrendingFeed: async () => ({ items: (await apiClient.get(`${G.FEEDS}/trending`)).data ?? [] }),
  syncLikeMutation: async (email: string, itemId: string | number, isLiked: boolean, itemType: string) => {
    await apiClient.post(`${G.USER_POST}/likes/toggle`, { email, item_id: itemId, item_type: itemType, action_like: isLiked });
  },
  updateUserInfo: async (answers: Record<string, any>) => {
    const email = useAuthStore.getState().user?.email;
    await apiClient.post(`${G.USER_POST}/profile/update`, { email, ...answers });
  },
};

export default webhooks;
