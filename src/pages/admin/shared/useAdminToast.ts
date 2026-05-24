import { useCallback, useEffect, useRef, useState } from 'react';

export type AdminToastVariant = 'success' | 'error' | 'info';

export type AdminToastState = {
  message: string;
  variant: AdminToastVariant;
};

const DEFAULT_DURATION_MS = 3000;

export function useAdminToast(durationMs = DEFAULT_DURATION_MS) {
  const timerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const clearToast = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  useEffect(() => () => clearToast(), [clearToast]);

  const show = useCallback(
    (message: string, variant: AdminToastVariant) => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setToast({ message, variant });
      timerRef.current = window.setTimeout(clearToast, durationMs);
    },
    [clearToast, durationMs],
  );

  const showToast = useCallback((message: string) => show(message, 'success'), [show]);
  const showErrorToast = useCallback((message: string) => show(message, 'error'), [show]);
  const showInfoToast = useCallback((message: string) => show(message, 'info'), [show]);

  return { toast, showToast, showErrorToast, showInfoToast, clearToast };
}
