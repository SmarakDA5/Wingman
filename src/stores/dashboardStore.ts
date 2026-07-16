import { create } from 'zustand';
import type { DashboardState, ScopeLevel, Internship, Scheme, Job } from '../types';
// import webhooks from '../services/api';

// ============================================================================
// MOCK DATA FOR TESTING - Remove when backend is connected
// ============================================================================
const MOCK_INTERNSHIPS: Internship[] = [
  {
    id: 'internship-001',
    title: 'Software Engineering Intern',
    company: 'Tech Corp',
    deadline: '2025-03-15T23:59:59Z',
    isLiked: false,
    applicationUrl: 'https://techcorp.com/apply',
    videoUrl: 'https://youtube.com/watch?v=example1',
  },
  {
    id: 'internship-002',
    title: 'Frontend Developer Intern',
    company: 'Design Studio',
    deadline: '2025-04-01T23:59:59Z',
    isLiked: true,
    applicationUrl: 'https://designstudio.com/careers',
  },
  {
    id: 'internship-003',
    title: 'Full Stack Developer Intern',
    company: 'StartupXYZ',
    deadline: '2025-05-10T23:59:59Z',
    isLiked: false,
    videoUrl: 'https://youtube.com/watch?v=example2',
  },
];

const MOCK_SCHEMES: Scheme[] = [
  {
    id: 'scheme-001',
    title: 'National Scholarship Program',
    organization: 'Government of India',
    deadline: '2025-06-30T23:59:59Z',
    isLiked: false,
    applicationUrl: 'https://scholarships.gov.in/apply',
  },
  {
    id: 'scheme-002',
    title: 'Merit-Cum-Means Scholarship',
    organization: 'Ministry of Education',
    deadline: '2025-07-15T23:59:59Z',
    isLiked: true,
    videoUrl: 'https://youtube.com/watch?v=example3',
  },
  {
    id: 'scheme-003',
    title: 'Research Fellowship Grant',
    organization: 'Science Foundation',
    deadline: '2025-08-01T23:59:59Z',
    isLiked: false,
    applicationUrl: 'https://sciencefoundation.org/fellowship',
    videoUrl: 'https://youtube.com/watch?v=example4',
  },
];

const MOCK_JOBS: Job[] = [
  {
    id: 'job-001',
    title: 'Junior Software Engineer',
    company: 'Big Tech Inc',
    deadline: '2025-04-20T23:59:59Z',
    isLiked: false,
    applicationUrl: 'https://bigtech.com/careers/junior-swe',
  },
  {
    id: 'job-002',
    title: 'React Developer',
    company: 'Web Solutions',
    deadline: '2025-05-05T23:59:59Z',
    isLiked: true,
    applicationUrl: 'https://websolutions.com/jobs/react-dev',
    videoUrl: 'https://youtube.com/watch?v=example5',
  },
  {
    id: 'job-003',
    title: 'Mobile App Developer',
    company: 'App Factory',
    deadline: '2025-06-01T23:59:59Z',
    isLiked: false,
  },
];
// ============================================================================

export const useDashboardStore = create<DashboardState>((set, get) => ({
  scope: 'broad',
  internships: [],
  schemes: [],
  jobs: [],
  isLoading: false,

  setScope: (scope: ScopeLevel) => {
    set({ scope });
    // Re-fetch data when scope changes
    get().fetchInternships();
    get().fetchSchemes();
    get().fetchJobs();
  },

  fetchInternships: async () => {
    set({ isLoading: true });
    try {
      // WH4: Fetch internships with scope param
      // Endpoint: GET /fetch_internships?scope={scope}
      // Expected response: { internships: Internship[] }
      // const { internships } = await webhooks.fetchInternships(get().scope);
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Only show mock data if user has subscription
      const masterUserEmail = localStorage.getItem('master_user_email');
      const masterHasSubscription = localStorage.getItem('master_has_subscription');
      const token = localStorage.getItem('auth_token');
      
      // Check if this is a master test user without subscription
      if (masterUserEmail && token?.includes('master_test_token') && masterHasSubscription === 'false') {
        // No data for users without subscription
        set({ internships: [], isLoading: false });
        return;
      }
      
      const internships = MOCK_INTERNSHIPS;
      // ==========================================================================
      
      set({ internships, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch internships:', error);
    }
  },

  fetchSchemes: async () => {
    set({ isLoading: true });
    try {
      // WH5: Fetch schemes with scope param
      // Endpoint: GET /fetch_schemes?scope={scope}
      // Expected response: { schemes: Scheme[] }
      // const { schemes } = await webhooks.fetchSchemes(get().scope);
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Only show mock data if user has subscription
      const masterUserEmail = localStorage.getItem('master_user_email');
      const masterHasSubscription = localStorage.getItem('master_has_subscription');
      const token = localStorage.getItem('auth_token');
      
      // Check if this is a master test user without subscription
      if (masterUserEmail && token?.includes('master_test_token') && masterHasSubscription === 'false') {
        // No data for users without subscription
        set({ schemes: [], isLoading: false });
        return;
      }
      
      const schemes = MOCK_SCHEMES;
      // ==========================================================================
      
      set({ schemes, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch schemes:', error);
    }
  },

  fetchJobs: async () => {
    set({ isLoading: true });
    try {
      // WH6: Fetch jobs with scope param
      // Endpoint: GET /fetch_jobs?scope={scope}
      // Expected response: { jobs: Job[] }
      // const { jobs } = await webhooks.fetchJobs(get().scope);
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Only show mock data if user has subscription
      const masterUserEmail = localStorage.getItem('master_user_email');
      const masterHasSubscription = localStorage.getItem('master_has_subscription');
      const token = localStorage.getItem('auth_token');
      
      // Check if this is a master test user without subscription
      if (masterUserEmail && token?.includes('master_test_token') && masterHasSubscription === 'false') {
        // No data for users without subscription
        set({ jobs: [], isLoading: false });
        return;
      }
      
      const jobs = MOCK_JOBS;
      // ==========================================================================
      
      set({ jobs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch jobs:', error);
    }
  },

  toggleLike: async (id: string, type: 'internship' | 'scheme' | 'job', isLiked: boolean) => {
    // Optimistic UI update
    if (type === 'internship') {
      set((state) => ({
        internships: state.internships.map((item) =>
          item.id === id ? { ...item, isLiked: !isLiked } : item
        ),
      }));
    } else if (type === 'scheme') {
      set((state) => ({
        schemes: state.schemes.map((item) =>
          item.id === id ? { ...item, isLiked: !isLiked } : item
        ),
      }));
    } else if (type === 'job') {
      set((state) => ({
        jobs: state.jobs.map((item) =>
          item.id === id ? { ...item, isLiked: !isLiked } : item
        ),
      }));
    }

    try {
      // WH8: Sync like mutation
      // Endpoint: POST /sync_like_mutation
      // Payload: { itemId: string, isLiked: boolean, type: 'internship' | 'scheme' | 'job' }
      // await webhooks.syncLikeMutation(id, !isLiked, type);
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      // ==========================================================================
      
    } catch (error) {
      // Revert on error
      if (type === 'internship') {
        set((state) => ({
          internships: state.internships.map((item) =>
            item.id === id ? { ...item, isLiked: isLiked } : item
          ),
        }));
      } else if (type === 'scheme') {
        set((state) => ({
          schemes: state.schemes.map((item) =>
            item.id === id ? { ...item, isLiked: isLiked } : item
          ),
        }));
      } else if (type === 'job') {
        set((state) => ({
          jobs: state.jobs.map((item) =>
            item.id === id ? { ...item, isLiked: isLiked } : item
          ),
        }));
      }
      console.error('Failed to sync like:', error);
    }
  },
}));
