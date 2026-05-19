import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ClientErrorModal } from '../../shared/ui/ClientErrorModal';

type ErrorPayload = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

type ClientErrorModalContextValue = {
  showError: (message: string, options?: Partial<Omit<ErrorPayload, 'message'>>) => void;
  clearError: () => void;
};

const ClientErrorModalContext = createContext<ClientErrorModalContextValue | null>(null);

export function ClientErrorModalProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorPayload | null>(null);

  const showError = useCallback((message: string, options?: Partial<Omit<ErrorPayload, 'message'>>) => {
    setError({
      title: options?.title ?? 'Не получилось',
      message,
      onRetry: options?.onRetry,
      retryLabel: options?.retryLabel,
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(() => ({ showError, clearError }), [showError, clearError]);

  return (
    <ClientErrorModalContext.Provider value={value}>
      {children}
      <ClientErrorModal
        open={error != null}
        title={error?.title}
        message={error?.message ?? ''}
        onClose={clearError}
        onRetry={error?.onRetry}
        retryLabel={error?.retryLabel}
      />
    </ClientErrorModalContext.Provider>
  );
}

export function useClientErrorModal(): ClientErrorModalContextValue {
  const ctx = useContext(ClientErrorModalContext);
  if (!ctx) {
    throw new Error('useClientErrorModal must be used within ClientErrorModalProvider');
  }
  return ctx;
}
