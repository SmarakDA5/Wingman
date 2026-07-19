import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { ScopeSlider } from '../components/ScopeSlider';
import webhooks from '../services/api';

interface FormData {
  edu: string;
  field: string;
  gpa: string;
  skill: string;
  goal: string;
}

interface FormErrors {
  edu?: string;
  field?: string;
  skill?: string;
  goal?: string;
  [key: string]: string | undefined;
}

export const InfoView = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { fetchProfile, answers: profileAnswers, setInterestLevel } = useProfileStore();
  
  const [formData, setFormData] = useState<FormData>({
    edu: '',
    field: '',
    gpa: '',
    skill: '',
    goal: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Required fields that must be filled to enable Save
  const requiredFields: (keyof FormData)[] = ['edu', 'field', 'skill', 'goal'];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      await fetchProfile();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setIsInitialized(true);
    }
  };

  // Populate form when profile data is loaded
  useEffect(() => {
    if (isInitialized && profileAnswers) {
      setFormData({
        edu: profileAnswers.edu || '',
        field: profileAnswers.field || '',
        gpa: profileAnswers.gpa ? String(profileAnswers.gpa) : '',
        skill: profileAnswers.skill || '',
        goal: profileAnswers.goal || '',
      });
    }
  }, [isInitialized, profileAnswers]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    return requiredFields.every((field) => formData[field] && formData[field].trim() !== '');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInterestLevelChange = async (level: number) => {
    await setInterestLevel(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Build flat payload matching backend schema exactly
      const payload = {
        edu: formData.edu.trim(),
        field: formData.field.trim(),
        gpa: formData.gpa ? parseFloat(formData.gpa) : 0,
        skill: formData.skill.trim(),
        goal: formData.goal.trim(),
        interest_level: profileAnswers.interest_level ?? 0,
      } as unknown as Record<string, string>;

      // WH10: Update user info - API interceptor attaches email automatically
      await webhooks.updateUserInfo(payload);
      
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

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Profile Validity Banner */}
      {!isFormValid() && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-4 mx-6 mt-4 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Please complete all required fields to unlock the Feeds dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-6 py-6 comfort-container">Your Information</h1>

        <div className="px-6 comfort-container">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="liquid-glass rounded-2xl shadow-md p-6 space-y-6"
          >
            {/* Display logged-in email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="w-full min-h-[44pt] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {user?.email || 'Not available'}
              </div>
            </div>

            {/* Education Level - Text Input / Dropdown */}
            <div>
              <label htmlFor="edu" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Education Level *
              </label>
              <input
                type="text"
                id="edu"
                value={formData.edu}
                onChange={(e) => handleInputChange('edu', e.target.value)}
                className={`w-full min-h-[44pt] px-4 py-3 border ${
                  errors.edu ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                placeholder="e.g., Bachelor's Degree, BSc, etc."
              />
              {errors.edu && (
                <p className="mt-1 text-sm text-red-500">{errors.edu}</p>
              )}
            </div>

            {/* Field of Study - Text Input */}
            <div>
              <label htmlFor="field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field of Study *
              </label>
              <input
                type="text"
                id="field"
                value={formData.field}
                onChange={(e) => handleInputChange('field', e.target.value)}
                className={`w-full min-h-[44pt] px-4 py-3 border ${
                  errors.field ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                placeholder="e.g., Computer Science, Engineering, etc."
              />
              {errors.field && (
                <p className="mt-1 text-sm text-red-500">{errors.field}</p>
              )}
            </div>

            {/* GPA - Number Input */}
            <div>
              <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GPA
              </label>
              <input
                type="number"
                id="gpa"
                step="0.01"
                min="0"
                max="4"
                value={formData.gpa}
                onChange={(e) => handleInputChange('gpa', e.target.value)}
                className="w-full min-h-[44pt] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="e.g., 3.8"
              />
            </div>

            {/* Key Skills - Textarea */}
            <div>
              <label htmlFor="skill" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Skills *
              </label>
              <textarea
                id="skill"
                value={formData.skill}
                onChange={(e) => handleInputChange('skill', e.target.value)}
                className={`w-full min-h-[120px] px-4 py-3 border ${
                  errors.skill ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation resize-none`}
                placeholder="e.g., React, TypeScript, Python, Machine Learning, etc."
              />
              {errors.skill && (
                <p className="mt-1 text-sm text-red-500">{errors.skill}</p>
              )}
            </div>

            {/* Career Goals - Textarea */}
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Career Goals *
              </label>
              <textarea
                id="goal"
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className={`w-full min-h-[120px] px-4 py-3 border ${
                  errors.goal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation resize-none`}
                placeholder="e.g., FAANG, Startups, Research, etc."
              />
              {errors.goal && (
                <p className="mt-1 text-sm text-red-500">{errors.goal}</p>
              )}
            </div>

            {/* Interest Level Slider - Maps to backend scope_tier (0-3) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interest Level (Scope Tier)
              </label>
              <div className="liquid-glass rounded-xl p-4">
                <ScopeSlider value={profileAnswers.interest_level ?? 0} onChange={handleInterestLevelChange} />
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Local / Casual</span>
                  <span>Global / Prestigious</span>
                </div>
              </div>
            </div>

            {submitSuccess && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-center">
                Information updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full min-h-[44pt] bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors touch-manipulation flex items-center justify-center"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Save'
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
    </div>
  );
};
