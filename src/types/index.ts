export interface User {
  id: string;
  email: string;
  isAuthenticated: boolean;
}

export interface FeedItem {
  id: number;
  post: string;
  comp: string;
  apply_url: string | null;
  tutorial_url: string | null;
  scope_tier: number; // 0, 1, 2, 3
  apply_by: string;
  isLiked?: boolean;
  category?: string;
  entity_type?: string;
}

export type ScopeLevel = 0 | 1 | 2 | 3;

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  options?: string[];
  value: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
}

export interface SubscriptionState {
  isActive: boolean;
  isLoading: boolean;
  verifySubscription: () => Promise<boolean>;
}

export interface DashboardCache {
  internships: FeedItem[];
  schemes: FeedItem[];
  jobs: FeedItem[];
  courses: FeedItem[];
}

export interface DashboardState {
  sliderValue: ScopeLevel;
  cache: DashboardCache;
  isLoading: boolean;
  isInitialized: boolean;
  setSliderValue: (value: ScopeLevel) => void;
  initializeData: () => Promise<void>;
  toggleLike: (id: number, type: keyof DashboardCache, isLiked: boolean) => Promise<void>;
  getFilteredInternships: () => FeedItem[];
  getFilteredSchemes: () => FeedItem[];
  getFilteredJobs: () => FeedItem[];
  getFilteredCourses: () => FeedItem[];
}

export interface LikesState {
  likedItems: FeedItem[];
  isLoading: boolean;
  fetchLikedItems: () => Promise<void>;
}

export interface InfoState {
  questions: QuestionnaireQuestion[];
  isLoading: boolean;
  fetchQuestions: () => Promise<void>;
  updateUserInfo: (answers: Record<string, string>) => Promise<void>;
}
