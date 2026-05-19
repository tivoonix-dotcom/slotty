import { useCallback, useEffect, useState } from 'react';
import { getMySlots } from '../../../features/admin/api/adminSlotsApi';
import { countActiveBookableSlots } from '../../../features/admin/lib/profileCompletion';

export function useProfileCompletionSlots(useCabinetApi: boolean, cabinetLoading: boolean) {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!useCabinetApi) {
      setActiveCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const slots = await getMySlots();
      setActiveCount(countActiveBookableSlots(slots));
    } catch {
      setActiveCount(0);
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setActiveCount(0);
      setLoading(false);
      return;
    }
    if (cabinetLoading) return;
    void reload();
  }, [useCabinetApi, cabinetLoading, reload]);

  return { activeBookableSlots: activeCount, slotsLoading: loading, reloadSlots: reload };
}
