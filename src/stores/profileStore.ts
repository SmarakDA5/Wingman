import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import webhooks from '../services/api';

const REQUIRED_QUESTION_KEYS = ['edu', 'field', 'skill', 'goal'] as const;
export type RequiredQuestionKey = typeof REQUIRED_QUESTION_KEYS[number];

export interface ProfileAnswers {
  edu?: string;
  field?: string;
  skill?: string;
  goal?: string;
  gpa?: string | number;
  interest_level?: number; // backend scope_tier (0-3)
  [key: string]: string | number | undefined;
}

export interface ProfileStore {
  answers: ProfileAnswers;
  isLoading: boolean;
  isInitialized: boolean;
  isProfileValid: boolean; // plain field, recomputed on every answers change
  interestLevel: number;   // mirror of answers.interest_level
  fetchProfile: () => Promise<void>;
  setInterestLevel: (level: number) => void;      // pure local (no network)
  setAnswers: (partial: ProfileAnswers) => void;  // sync store (e.g. after Save)
}

export const validateProfileAnswers = (answers: ProfileAnswers): boolean => {
  if (!answers || Object.keys(answers).length === 0) return false;
  for (const key of REQUIRED_QUESTION_KEYS) {
    const value = answers[key];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
  }
  return true;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      answers: {},
      isLoading: false,
      isInitialized: false,
      isProfileValid: false,
      interestLevel: 0,

      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await webhooks.fetchQuestionnaire();
          const answers = response.answers || {};
          set({
            answers,
            isInitialized: true,
            isLoading: false,
            isProfileValid: validateProfileAnswers(answers),
            interestLevel: answers.interest_level ?? 0,
          });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ isInitialized: true, isLoading: false }); // keep persisted answers
        }
      },

      setInterestLevel: (level: number) => {
        const updatedAnswers = { ...get().answers, interest_level: level };
        set({
          answers: updatedAnswers,
          interestLevel: level,
          isProfileValid: validateProfileAnswers(updatedAnswers),
        });
      },

      setAnswers: (partial: ProfileAnswers) => {
        const updatedAnswers = { ...get().answers, ...partial };
        set({
          answers: updatedAnswers,
          isProfileValid: validateProfileAnswers(updatedAnswers),
          interestLevel: updatedAnswers.interest_level ?? 0,
        });
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ answers: state.answers, isInitialized: state.isInitialized }),
      // Recompute derived fields from persisted answers on reload (getters can't survive rehydration).
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as Partial<ProfileStore>;
        const answers = p.answers ?? currentState.answers;
        return {
          ...currentState,
          ...p,
          answers,
          isProfileValid: validateProfileAnswers(answers),
          interestLevel: answers?.interest_level ?? 0,
        };
      },
    }
  )
);
