import { useCallback, useEffect, useState } from 'react';
import { getMySlots } from '../../../features/admin/api/adminSlotsApi';
import { countActiveBookableSlots } from '../../../features/admin/lib/profileCompletion';
import { subscribeMasterSlotsChanged } from '../shared/masterSlotsInvalidation';

export function useProfileCompletionSlots(useCabinetApi: boolean, cabinetLoading: boolean) {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!useCabinetApi) {
      setActiveCount(0);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const slots = await getMySlots();
      setActiveCount(countActiveBookableSlots(slots));
    } catch {
      setActiveCount(null);
      setLoadError('Не удалось проверить окна для записи. Обновите страницу или попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setActiveCount(0);
      setLoadError(null);
      setLoading(false);
      return;
    }
    if (cabinetLoading) return;
    void reload();
  }, [useCabinetApi, cabinetLoading, reload]);

  useEffect(() => subscribeMasterSlotsChanged(() => void reload()), [reload]);

  return {
    activeBookableSlots: activeCount,
    slotsLoading: loading,
    slotsLoadError: loadError,
    reloadSlots: reload,
  };
}
