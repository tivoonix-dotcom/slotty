import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchMyNotifications,
  type MeNotificationRow,
} from '../profile/api/clientNotifications';

type Options = {
  /** Периодическое обновление списка (бейдж в шапке кабинета). */
  pollIntervalMs?: number;
};

export function useMyNotifications(enabled = true, options?: Options) {
  const pollIntervalMs = options?.pollIntervalMs ?? 0;
  const [notifications, setNotifications] = useState<MeNotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    setError(null);
    try {
      setNotifications(await fetchMyNotifications());
    } catch (e) {
      if (!opts?.quiet) {
        setNotifications([]);
        setError(e instanceof Error ? e.message : 'Не удалось загрузить уведомления.');
      }
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled || pollIntervalMs < 5_000) return;
    const id = window.setInterval(() => void reload({ quiet: true }), pollIntervalMs);
    return () => window.clearInterval(id);
  }, [enabled, pollIntervalMs, reload]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => void reload({ quiet: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [enabled, reload]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications],
  );

  return {
    notifications,
    loading,
    error,
    reload,
    unreadCount,
    hasUnread: unreadCount > 0,
  };
}
