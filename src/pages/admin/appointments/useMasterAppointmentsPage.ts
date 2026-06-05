import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMasterAppointmentStats,
  fetchMasterAppointments,
  type MasterAppointmentStatsDto,
  type MasterAppointmentsTab,
} from '../../../features/admin/api/masterCabinetApi';
import { mapMasterAppointmentRowToDemo } from '../../../features/admin/lib/masterCabinetMapper';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { AppointmentsTabId } from './appointmentsTypes';
import { subscribeBookingDataRefresh } from '../../../features/appointments/bookingDataSync';

const PAGE_SIZE = 30;

function tabToApi(tab: AppointmentsTabId): MasterAppointmentsTab {
  if (tab === 'requests') return 'pending';
  if (tab === 'upcoming') return 'upcoming';
  return 'history';
}

type Options = {
  enabled: boolean;
  tab: AppointmentsTabId;
};

export function useMasterAppointmentsPage({ enabled, tab }: Options) {
  const [items, setItems] = useState<DemoMasterAppointment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MasterAppointmentStatsDto | null>(null);
  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);

  const loadStats = useCallback(async () => {
    if (!enabled) return;
    try {
      setStats(await fetchMasterAppointmentStats());
    } catch {
      /* счётчики в шапке — необязательны */
    }
  }, [enabled]);

  const loadPage = useCallback(
    async (mode: 'reset' | 'more') => {
      if (!enabled) return;
      const requestId = ++requestIdRef.current;
      const offset = mode === 'reset' ? 0 : offsetRef.current;
      if (mode === 'reset') {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const out = await fetchMasterAppointments({
          tab: tabToApi(tab),
          limit: PAGE_SIZE,
          offset,
        });
        if (requestId !== requestIdRef.current) return;
        const mapped = out.appointments.map(mapMasterAppointmentRowToDemo);
        offsetRef.current = offset + mapped.length;
        setTotal(out.total);
        setHasMore(out.hasMore);
        setItems((prev) => (mode === 'reset' ? mapped : [...prev, ...mapped]));
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить записи');
        if (mode === 'reset') {
          setItems([]);
          setTotal(0);
          setHasMore(false);
          offsetRef.current = 0;
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [enabled, tab],
  );

  useEffect(() => {
    if (!enabled) return;
    void loadStats();
  }, [enabled, loadStats]);

  useEffect(() => {
    if (!enabled) return;
    offsetRef.current = 0;
    void loadPage('reset');
  }, [enabled, tab, loadPage]);

  const reload = useCallback(async () => {
    offsetRef.current = 0;
    await Promise.all([loadStats(), loadPage('reset')]);
  }, [loadStats, loadPage]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeBookingDataRefresh(() => {
      void loadStats();
    });
  }, [enabled, loadStats]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    void loadPage('more');
  }, [hasMore, loadPage, loading, loadingMore]);

  const patchItem = useCallback((id: string, patch: Partial<DemoMasterAppointment>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const removeFromList = useCallback((id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    stats,
    reload,
    loadStats,
    loadMore,
    patchItem,
    removeFromList,
  };
}
