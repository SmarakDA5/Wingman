import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';

const REQUIRED_QUESTION_KEYS = ['edu', 'field', 'skill', 'goal'] as const;
export type RequiredQuestionKey = typeof REQUIRED_QUESTION_KEYS[number];

export interface ProfileAnswers {
  edu?: string;
  field?: string;
  skill?: string;
  goal?: string;
  gpa?: string | number;
  interest_level?: number;
  [key: string]: string | number | undefined;
}

export interface ProfileStore {
  answers: ProfileAnswers;
  isLoading: boolean;
  isInitialized: boolean;
  isProfileValid: boolean;
  interestLevel: number;
  fetchProfile: () => Promise<void>;
  setInterestLevel: (level: number) => void;
  setAnswers: (partial: ProfileAnswers) => void;
  markStale: () => void;
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

async function awaitAuthHydration(): Promise<void> {
  const ap = (useAuthStore as any).persist;
  if (ap && typeof ap.hasHydrated === 'function' && !ap.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const off = ap.onFinishHydration(() => { off?.(); resolve(); });
      if (ap.hasHydrated()) { off?.(); resolve(); }
    });
  }
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      answers: {},
      isLoading: false,
      isInitialized: false,
      isProfileValid: false,
      interestLevel: 0,

      fetchProfile: async () => {
        await awaitAuthHydration();
        const email = useAuthStore.getState().user?.email;
        if (!email) { set({ isInitialized: true, isLoading: false }); return; }
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
          set({ isInitialized: true, isLoading: false }); // keep cached answers on error
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

      // Reset the "fetched" flag (NOT the answers) so the next session re-fetches from the DB.
      markStale: () => set({ isInitialized: false, isLoading: false }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist ONLY the answers (for instant paint). Never persist isInitialized, so every
      // reload forces a fresh fetch from the DB via the view's !isInitialized guard.
      partialize: (state) => ({ answers: state.answers }),
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as Partial<ProfileStore>;
        const answers = p.answers ?? currentState.answers;
        return {
          ...currentState,
          answers,
          isInitialized: false, // refetch details from DB on every new session
          isLoading: false,
          isProfileValid: validateProfileAnswers(answers),
          interestLevel: (answers as ProfileAnswers)?.interest_level ?? 0,
        };
      },
    }
  )
);
