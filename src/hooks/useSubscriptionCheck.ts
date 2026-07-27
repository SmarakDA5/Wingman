import { useState, useEffect } from 'react';
import webhooks from '../services/api';

export const useSubscriptionCheck = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // WH3: Verify subscription
        const { isActive } = await webhooks.verifySubscription();
        setIsActive(isActive);
      } catch (error) {
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  return { isActive, isLoading };
};
