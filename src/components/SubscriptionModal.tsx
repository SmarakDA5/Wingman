import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { usePaymentStore } from '../stores/paymentStore';

interface SubscriptionModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const SubscriptionModal = ({ isOpen, onDismiss }: SubscriptionModalProps) => {
  const { hasAccess, trialEndsAt, subscriptionStatus } = useSubscriptionStore();
  const { startCheckout, isLoading } = usePaymentStore();

  if (!isOpen) return null;

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!trialEndsAt) return null;
    const trialEnd = new Date(trialEndsAt);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialActive = trialDaysRemaining !== null && trialDaysRemaining > 0;
  const isTrialExpired = trialEndsAt !== null && !isTrialActive && !hasAccess;

  const renderContent = () => {
    if (hasAccess) {
      return (
        <>
          <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Subscription Active</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {subscriptionStatus === 'trial' 
              ? `Your free trial is active. ${trialDaysRemaining} day(s) remaining.`
              : 'Your subscription is active and up to date.'}
          </p>
          <button
            onClick={onDismiss}
            className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all touch-manipulation shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            OK
          </button>
        </>
      );
    }

    if (isTrialActive) {
      return (
        <>
          <svg className="w-16 h-16 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free Trial</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your free trial ends in <span className="font-bold text-purple-600">{trialDaysRemaining}</span> day(s)
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-8">
            Subscribe now to continue enjoying uninterrupted access after your trial expires.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => startCheckout('monthly')}
              disabled={isLoading}
              className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all touch-manipulation shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Subscribe Monthly'}
            </button>
            <button
              onClick={() => startCheckout('yearly')}
              disabled={isLoading}
              className="w-full min-h-[44px] glass-card hover:bg-white/20 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-2xl transition-all touch-manipulation disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Subscribe Yearly (Save 20%)'}
            </button>
            <button
              onClick={onDismiss}
              className="w-full min-h-[44px] text-gray-600 dark:text-gray-400 font-medium py-2 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </>
      );
    }

    // Trial expired or no trial - show subscribe CTA
    return (
      <>
        <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isTrialExpired ? 'Trial Expired' : 'Subscription Required'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {isTrialExpired 
            ? 'Your free trial has expired. Please subscribe to continue accessing premium features.'
            : 'Subscribe to unlock premium features and continue using Wingman.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => startCheckout('monthly')}
            disabled={isLoading}
            className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all touch-manipulation shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Subscribe Monthly'}
          </button>
          <button
            onClick={() => startCheckout('yearly')}
            disabled={isLoading}
            className="w-full min-h-[44px] glass-card hover:bg-white/20 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-2xl transition-all touch-manipulation disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Subscribe Yearly (Save 20%)'}
          </button>
          <button
            onClick={onDismiss}
            className="w-full min-h-[44px] text-gray-600 dark:text-gray-400 font-medium py-2 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      >
        <motion.div
          className="liquid-glass-modal rounded-[32px] p-6 max-w-sm w-full shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center relative z-10">
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
