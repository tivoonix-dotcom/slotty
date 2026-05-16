import { useEffect, useRef, useState } from 'react';

const DEFAULT_MIN_MS = 340;

/**
 * Краткий пульс загрузки при смене ключа (роут, таб).
 * Первый рендер без задержки.
 */
export function useRouteTransitionPulse(activeKey: string, minMs = DEFAULT_MIN_MS): boolean {
  const [busy, setBusy] = useState(false);
  const prevKey = useRef(activeKey);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prevKey.current = activeKey;
      return;
    }
    if (activeKey === prevKey.current) return;
    prevKey.current = activeKey;

    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), minMs);
    return () => window.clearTimeout(id);
  }, [activeKey, minMs]);

  return busy;
}
