import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ id: nextId.current++, message, variant });
      timerRef.current = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastBanner toast={toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isError = toast.variant === 'error';

  return (
    <div
      key={toast.id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="fixed left-1/2 -translate-x-1/2 bottom-20 sm:bottom-6 z-[100] w-[calc(100%-2rem)] max-w-sm"
    >
      <div
        className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border ${
          isError
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
        ) : (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
        )}
        <p className="flex-1 text-sm">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
