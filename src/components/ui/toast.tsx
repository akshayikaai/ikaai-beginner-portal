import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  type?: 'default' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export function Toast({ message, type = 'default', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-floating animate-in fade-in slide-in-from-bottom-4 duration-200 select-none max-w-[90vw]',
        type === 'default' && 'bg-ink text-bg-main',
        type === 'success' && 'bg-success-fill text-white',
        type === 'warning' && 'bg-warning text-white',
        type === 'error' && 'bg-red-600 text-white'
      )}
    >
      <span>{message}</span>
    </div>
  );
}

// Simple context-driven toast hook
type ToastItem = { id: string; message: string; type?: 'default' | 'success' | 'warning' | 'error' };

const ToastContext = React.createContext<{
  showToast: (message: string, type?: ToastItem['type']) => void;
}>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback(
    (message: string, type: ToastItem['type'] = 'default') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
