import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMySlots } from '../../../features/admin/api/adminSlotsApi';
import { fetchMasterAppointmentStats } from '../../../features/admin/api/masterCabinetApi';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { subscribeMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import { computeOverviewOpsSnapshot } from './overviewOpsSnapshot';

export function useOverviewOpsData({
  appointments,
  useCabinetApi,
  cabinetLoading,
}: {
  appointments: DemoMasterAppointment[];
  useCabinetApi: boolean;
  cabinetLoading: boolean;
}) {
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof getMySlots>> | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoadError, setSlotsLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!useCabinetApi) {
      setSlots(null);
      setPendingCount(null);
      setSlotsLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSlotsLoadError(null);
    try {
      const [nextSlots, stats] = await Promise.all([getMySlots(), fetchMasterAppointmentStats()]);
      setSlots(nextSlots);
      setPendingCount(stats.pending);
    } catch {
      setSlots(null);
      setPendingCount(null);
      setSlotsLoadError('Не удалось проверить окна для записи. Обновите страницу или попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setSlots(null);
      setPendingCount(null);
      setSlotsLoadError(null);
      return;
    }
    if (cabinetLoading) return;
    void reload();
  }, [cabinetLoading, reload, useCabinetApi]);

  useEffect(() => subscribeMasterSlotsChanged(() => void reload()), [reload]);

  const snapshot = useMemo(
    () => computeOverviewOpsSnapshot(appointments, slotsLoadError ? null : slots, pendingCount),
    [appointments, pendingCount, slots, slotsLoadError],
  );

  return {
    snapshot,
    loading: useCabinetApi && (loading || cabinetLoading),
    slotsLoadError,
    reload,
  };
}
