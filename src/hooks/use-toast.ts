import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: ToastProps) => {
    // Simple console logging for now - in a real app this would show actual toasts
    console.log(`Toast [${variant}]: ${title}${description ? ` - ${description}` : ''}`);
    
    // You could integrate with a toast library like sonner, react-hot-toast, etc.
    // For now, we'll just log to console
    setToasts(prev => [...prev, { title, description, variant }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  }, []);

  return {
    toast,
    toasts
  };
} 