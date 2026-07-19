import { create } from 'zustand';
import webhooks from '../services/api';
import { useAuthStore } from './authStore';
import { useSubscriptionStore } from './subscriptionStore';

interface PaymentState {
  isLoading: boolean;
  razorpayLoaded: boolean;
  startCheckout: (plan: 'monthly' | 'yearly') => Promise<void>;
  verifyPayment: (resp: { razorpay_payment_id: string; razorpay_order_id: string }, plan: 'monthly' | 'yearly') => Promise<void>;
}

let razorpayScriptLoaded = false;

const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (razorpayScriptLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      razorpayScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
};

export const usePaymentStore = create<PaymentState>((set, get) => ({
  isLoading: false,
  razorpayLoaded: false,

  startCheckout: async (plan: 'monthly' | 'yearly') => {
    set({ isLoading: true });

    try {
      // Load Razorpay script if not already loaded
      await loadRazorpayScript();
      set({ razorpayLoaded: true });

      // Get email from auth store
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      // Create payment order via backend
      const result = await webhooks.createPaymentOrder(user.email, plan);
      const orderData = Array.isArray(result) ? result[0] : result;

      if (!orderData?.order_id || !orderData?.amount || !orderData?.currency || !orderData?.key_id) {
        throw new Error('Invalid payment order response');
      }

      const { order_id, amount, currency, key_id } = orderData;

      // Setup Razorpay options
      const options = {
        key: key_id,
        amount,
        currency,
        order_id,
        name: 'Wingman',
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
          await get().verifyPayment(response, plan);
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#9333ea',
        },
      };

      // Open Razorpay checkout
      const rzp = new (window as any).Razorpay(options);
      
      // Add event listener for payment failures
      rzp.on('payment.failed', (err: any) => {
        console.error('Razorpay payment failed:', err);
        const errorDescription = err.error?.description || 'Payment failed';
        alert(`Payment failed: ${errorDescription}`);
      });

      rzp.open();
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      set({ isLoading: false });
    }
  },

  verifyPayment: async (
    resp: { razorpay_payment_id: string; razorpay_order_id: string },
    plan: 'monthly' | 'yearly'
  ) => {
    set({ isLoading: true });

    try {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      // Verify payment with backend
      const result = await webhooks.verifyPayment({
        email: user.email,
        plan,
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
      });

      const verification = Array.isArray(result) ? result[0] : result;

      if (verification?.success) {
        // Re-run subscription check to update state
        await useSubscriptionStore.getState().verifySubscription();
        alert('Payment successful! Your subscription is now active.');
      } else {
        throw new Error(verification?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert(error instanceof Error ? error.message : 'Payment verification failed');
    } finally {
      set({ isLoading: false });
    }
  },
}));
