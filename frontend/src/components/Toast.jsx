import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Export toast functions for use throughout the app
export { toast, Toaster };

// Pre-configured toast functions
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
    },
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
    },
  });
};

export const showInfoToast = (message) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  });
};

export const showReferralToast = (message, type = 'info') => {
  toast(message, {
    duration: 5000,
    position: 'top-center',
    icon: type === 'success' ? '🎉' : '💰',
    style: {
      background: type === 'success' ? '#10b981' : '#f59e0b',
      color: '#fff',
      fontSize: '16px',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

