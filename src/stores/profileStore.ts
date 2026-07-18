import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import webhooks from '../services/api';

// Fixed onboarding question keys that must exist and have non-empty values
const REQUIRED_QUESTION_KEYS = ['edu', 'field', 'skill', 'goal'] as const;

export type RequiredQuestionKey = typeof REQUIRED_QUESTION_KEYS[number];

export interface ProfileAnswers {
  edu?: string;
  field?: string;
  skill?: string;
  goal?: string;
  [key: string]: string | undefined;
}

export interface ProfileState {
  answers: ProfileAnswers;
  isLoading: boolean;
  isInitialized: boolean;
  fetchProfile: () => Promise<void>;
}

export interface ProfileStore extends ProfileState {
  isProfileValid: boolean;
}

/**
 * Validates if the profile answers object is valid:
 * 1. The answers object must exist
 * 2. The answers object must not be empty ({})
 * 3. All required fixed question keys must have non-empty string values
 */
export const validateProfileAnswers = (answers: ProfileAnswers): boolean => {
  // Check if answers exists and is not empty
  if (!answers || Object.keys(answers).length === 0) {
    return false;
  }

  // Check if all required keys have non-empty string values
  for (const key of REQUIRED_QUESTION_KEYS) {
    const value = answers[key];
    if (value === undefined || value === null || value.trim() === '') {
      return false;
    }
  }

  return true;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      answers: {},
      isLoading: false,
      isInitialized: false,

      // Computed property for profile validity
      get isProfileValid() {
        return validateProfileAnswers(get().answers);
      },

      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await webhooks.fetchQuestionnaire();
          // WH9 returns answers JSONB object for fixed onboarding questions
          const answers = response.answers || {};
          set({ answers, isInitialized: true, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ isInitialized: true, isLoading: false });
        }
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ answers: state.answers, isInitialized: state.isInitialized }),
    }
  )
);
