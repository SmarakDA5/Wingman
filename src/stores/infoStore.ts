import { create } from 'zustand';
import type { InfoState, QuestionnaireQuestion } from '../types';
// import webhooks from '../services/api';

// ============================================================================
// MOCK DATA FOR TESTING - Remove when backend is connected
// ============================================================================
const MOCK_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'full_name',
    label: 'Full Name',
    type: 'text',
    value: '',
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    value: '',
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'text',
    value: '',
  },
  {
    id: 'education_level',
    label: 'Education Level',
    type: 'select',
    options: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'],
    value: '',
  },
  {
    id: 'field_of_study',
    label: 'Field of Study',
    type: 'text',
    value: '',
  },
  {
    id: 'graduation_year',
    label: 'Expected Graduation Year',
    type: 'select',
    options: ['2024', '2025', '2026', '2027', '2028'],
    value: '',
  },
  {
    id: 'skills',
    label: 'Key Skills (comma separated)',
    type: 'textarea',
    value: '',
  },
  {
    id: 'career_goals',
    label: 'Career Goals',
    type: 'textarea',
    value: '',
  },
];
// ============================================================================

export const useInfoStore = create<InfoState>((set) => ({
  questions: [],
  isLoading: false,

  fetchQuestions: async () => {
    set({ isLoading: true });
    try {
      // WH9: Fetch questionnaire
      // const { questions } = await webhooks.fetchQuestionnaire();
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const questions = MOCK_QUESTIONS;
      // ==========================================================================
      
      set({ questions: questions as QuestionnaireQuestion[], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch questions:', error);
    }
  },

  updateUserInfo: async (answers: Record<string, string>) => {
    set({ isLoading: true });
    try {
      // WH10: Update user info
      // await webhooks.updateUserInfo(answers);
      
      // ==========================================================================
      // MOCK DATA - Remove when backend is connected
      // ==========================================================================
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('User info updated:', answers);
      // ==========================================================================
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
