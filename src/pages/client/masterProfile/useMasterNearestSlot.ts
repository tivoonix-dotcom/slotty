import { useEffect, useState } from 'react';
import { fetchPublicSlots } from '../../../features/booking/api/publicSlotsApi';
import { buildBookingSlotDays, pickFirstSlot, startOfDay } from '../../../features/booking/model/demoBookingSlotGrid';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import { formatNearestSlotLabel } from '../lib/catalogFormat';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useMasterNearestSlot(master: ExtendedMasterProfile | undefined) {
  const [nearest, setNearest] = useState<NearestSlotInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!master) {
      setNearest(null);
      return;
    }

    const useApi = Boolean(getApiBaseUrl() && UUID_RE.test(master.masterId));
    if (!useApi) {
      const firstService = master.services[0];
      if (!firstService) {
        setNearest(null);
        return;
      }
      const days = buildBookingSlotDays({
        anchorDate: startOfDay(new Date()),
        masterId: master.masterId,
        serviceId: firstService.id,
        duration: firstService.duration,
      });
      const hit = pickFirstSlot(days);
      if (!hit) {
        setNearest(null);
        return;
      }
      const [h, m] = hit.slot.timeLabel.split(':').map(Number);
      const d = new Date(hit.day.date);
      d.setHours(h ?? 10, m ?? 0, 0, 0);
      setNearest({
        startsAt: d.toISOString(),
        label: formatNearestSlotLabel(d.toISOString()) ?? hit.slot.timeLabel,
        serviceId: firstService.id,
      });
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const slots = await fetchPublicSlots({ masterId: master.masterId, limit: 40 });
        if (cancelled) return;
        const open = slots
          .filter((s) => s.status === 'open' || s.status === 'available')
          .map((s) => ({
            startsAt: s.startsAt,
            serviceId: s.serviceId ?? s.bookingServiceId,
          }))
          .filter((s) => {
            const t = new Date(s.startsAt).getTime();
            return !Number.isNaN(t) && t > Date.now();
          })
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

        const first = open[0];
        if (!first) {
          setNearest(null);
          return;
        }
        setNearest({
          startsAt: first.startsAt,
          label: formatNearestSlotLabel(first.startsAt) ?? 'Скоро',
          serviceId: first.serviceId,
        });
      } catch {
        if (!cancelled) setNearest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [master]);

  return { nearest, loading };
}
