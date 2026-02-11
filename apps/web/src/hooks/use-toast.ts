'use client';

import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast.info(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
    }
  };

  return { showToast };
};
