import { useState } from 'react';

export const useEmailValidation = () => {
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError(null);
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    setError(null);
    return true;
  };

  const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError(null);
    return true;
  };

  return { error, validateEmail, validatePassword, validatePasswordsMatch, clearError: () => setError(null) };
};
