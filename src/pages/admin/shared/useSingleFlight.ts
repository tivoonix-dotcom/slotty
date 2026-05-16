import { useCallback, useRef, useState } from 'react';

/** Блокирует повторный запуск async-операции, пока предыдущая не завершилась. */
export function useSingleFlight() {
  const lockRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setBusy(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }, []);

  const isLocked = useCallback(() => lockRef.current, []);

  return { busy, run, isLocked };
}
