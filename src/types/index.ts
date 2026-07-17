export interface User {
  id: string;
  email: string;
  isAuthenticated: boolean;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  deadline: string;
  isLiked: boolean;
  applicationUrl?: string;
  videoUrl?: string;
}

export interface Scheme {
  id: string;
  title: string;
  organization: string;
  deadline: string;
  isLiked: boolean;
  applicationUrl?: string;
  videoUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  deadline: string;
  isLiked: boolean;
  applicationUrl?: string;
  videoUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  deadline?: string;
  isLiked: boolean;
  applicationUrl?: string;
  videoUrl?: string;
}

export type ScopeLevel = 'specific' | 'broad' | 'broader' | 'explore';

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

export interface DashboardState {
  scope: ScopeLevel;
  internships: Internship[];
  schemes: Scheme[];
  jobs: Job[];
  courses: Course[];
  isLoading: boolean;
  setScope: (scope: ScopeLevel) => void;
  fetchInternships: () => Promise<void>;
  fetchSchemes: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  toggleLike: (id: string, type: 'internship' | 'scheme' | 'job' | 'course', isLiked: boolean) => Promise<void>;
}

export interface LikesState {
  likedItems: (Internship | Scheme | Job | Course)[];
  isLoading: boolean;
  fetchLikedItems: () => Promise<void>;
}

export interface InfoState {
  questions: QuestionnaireQuestion[];
  isLoading: boolean;
  fetchQuestions: () => Promise<void>;
  updateUserInfo: (answers: Record<string, string>) => Promise<void>;
}
