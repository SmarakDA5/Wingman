import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
// Reads the signed-in email without any import (Zustand persist shape + fallbacks).
const _authEmail = (): string => {
  try {
    if (typeof window === 'undefined') return '';
    const raw = window.localStorage.getItem('auth-storage');
    if (!raw) return '';
    const p = JSON.parse(raw);
    const s = p?.state ?? p;            // {state:{...}} or flat
    const u = s?.user ?? s;             // user nested or flat
    return String(u?.email ?? s?.email ?? '').trim();
  } catch {
    return '';
  }
};
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '/webhook';

export const apiClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // generous per-attempt so a waking server can answer
});

apiClient.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  if (user?.email && config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, email: user.email };
  }
  return config;
});

// Retry transient failures (cold start / flaky network) for every call EXCEPT register.
// register is the only non-idempotent endpoint (INSERT with no ON CONFLICT), so a lost
// response must NOT be retried. login / verify-email / reads / updates / like-toggle are
// all idempotent and safe to retry, which is what lets a sleeping n8n wake up mid-login.
const TRANSIENT_STATUS = new Set([502, 503, 504]);
const isRegister = (url?: string) => !!url && /\/register(\?|$)/.test(url);

apiClient.interceptors.response.use(undefined, async (err) => {
  const cfg = err?.config;
  if (!cfg) return Promise.reject(err);

  const status = err?.response?.status;
  const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''));
  const isNetwork = !err?.response && err?.code !== 'ECONNABORTED';
  const is5xx = TRANSIENT_STATUS.has(Number(status));
  const transient = isTimeout || isNetwork || is5xx;

  const attempt = (cfg.__retryCount || 0) + 1;
  if (transient && !isRegister(cfg.url) && attempt <= 3) {
    cfg.__retryCount = attempt;
    await new Promise((r) => setTimeout(r, 2500 * attempt)); // 2.5s, 5s, 7.5s — ride out the wake
    return apiClient(cfg);
  }
  return Promise.reject(err);
});

const G = {
  AUTH:      '/6e16a3b9-7652-41b5-b49e-c7a817e8b272/auth',
  FEEDS:     '/075954ad-35a6-4efc-8f43-bfd806d1116b/feeds',
  USER_GET:  '/f8fcec04-cf28-43c7-bc6b-ba69bab7f331/user',
  USER_POST: '/3bc1355c-c506-458e-b93c-6ff2d93ab94b/user',
} as const;

const first = (d: any) => (Array.isArray(d) ? d[0] : d);

const norm = (r: any) => {
  const title = r.title ?? r.name ?? r.headline ?? r.post ?? '';
  const company = r.company ?? r.organization ?? r.org ?? r.provider ?? r.employer ?? '';
  const summary = r.description_summary ?? r.summary ?? r.description ?? r.snippet ?? r.excerpt ?? '';
  const url = r.url ?? r.apply_url ?? r.link ?? '';
  const cat = r.category ?? r.entity_type ?? r.type ?? 'job';
  const tier = r.scope_tier ?? r.scope_phase ?? 0;
  const applyBy = r.apply_by ?? r.applyBy ?? r.deadline ?? r.closing_date ?? null;
  return {
    ...r,
    id: r.id ?? (r.rec_key != null && url ? url : r.rec_key) ?? r.entity_id,
    title, name: title, headline: title, post: title,
    company, organization: company, org: company, provider: company, employer: company,
    description_summary: summary, summary, description: summary, snippet: summary, excerpt: summary,
    url, apply_url: url, link: url,
    category: cat, entity_type: cat, type: cat,
    scope_tier: tier, scope_phase: tier,
    apply_by: applyBy, applyBy: applyBy, deadline: applyBy, closing_date: applyBy,
    posted_at: r.posted_at ?? r.created_at ?? null,
    isLiked: r.isLiked ?? false,
  };
};

const itemsOf = (d: any, forceLiked = false) => {
  const arr = Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : [];
  return arr.map((r: any) => { const n = norm(r); if (forceLiked) n.isLiked = true; return n; }) as any;
};

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
  fetchLikedItems: async () => ({ items: itemsOf((await apiClient.get(`${G.USER_GET}/likes`)).data, true) }),
  fetchSavedItems: async () => ({ items: itemsOf((await apiClient.get(`${G.USER_GET}/saved`)).data, true) }),
  fetchDiscoverFeed: async () => ({ items: itemsOf((await apiClient.get(`${G.FEEDS}/discover`)).data) }),
  fetchRecommendedFeed: async () => ({ items: itemsOf((await apiClient.get(`${G.USER_GET}/recommendations`)).data) }),
  fetchTrendingFeed: async () => ({ items: itemsOf((await apiClient.get(`${G.FEEDS}/trending`)).data) }),
  syncLikeMutation: async (email: string, itemId: string | number, isLiked: boolean, itemType: string) => {
    await apiClient.post(`${G.USER_POST}/likes/toggle`, { email, item_id: itemId, item_type: itemType, action_like: isLiked });
  },
  updateUserInfo: async (answers: Record<string, any>) => {
    const email = useAuthStore.getState().user?.email;
    await apiClient.post(`${G.USER_POST}/profile/update`, { email, ...answers });
  },
};

export default webhooks;
