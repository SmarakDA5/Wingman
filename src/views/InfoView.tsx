import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInfoStore } from '../stores/infoStore';
import { useAuthStore } from '../stores/authStore';
import type { QuestionnaireQuestion } from '../types';

export const InfoView = () => {
  const navigate = useNavigate();
  const { questions, isLoading, fetchQuestions, updateUserInfo } = useInfoStore();
  const { user, logout } = useAuthStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    // Initialize answers with current question values
    const initialAnswers: Record<string, string> = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = q.value;
    });
    setAnswers(initialAnswers);
  }, [questions]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await updateUserInfo(answers);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const renderInput = (question: QuestionnaireQuestion) => {
    const currentValue = answers[question.id] || '';

    switch (question.type) {
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full min-h-[44pt] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            required
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation resize-none"
            placeholder={`Enter your ${question.label.toLowerCase()}`}
            required
          />
        );
      default:
        return (
          <input
            type={question.type}
            value={currentValue}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full min-h-[44pt] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            placeholder={`Enter your ${question.label.toLowerCase()}`}
            required
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-4 py-6 comfort-container">Your Information</h1>

      <div className="px-4 comfort-container">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="liquid-glass rounded-2xl shadow-md p-6 space-y-6"
        >
          {/* Logged-in User Email Display (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logged in as
            </label>
            <div className="w-full min-h-[44pt] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 select-none cursor-not-allowed flex items-center">
              {user?.email || 'user@example.com'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This email is linked to your account and cannot be changed.
            </p>
          </div>

          {questions.length > 0 ? (
            questions.map((question) => (
              <div key={question.id}>
                <label
                  htmlFor={question.id}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {question.label}
                </label>
                {renderInput(question)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No questions available
            </p>
          )}

          {submitSuccess && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-center">
              Information updated successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || questions.length === 0}
            className="w-full min-h-[44pt] bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors touch-manipulation flex items-center justify-center"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Update Information'
            )}
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full min-h-[44pt] bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors touch-manipulation flex items-center justify-center gap-2 mt-4"
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </motion.form>
      </div>
    </div>
  );
};
