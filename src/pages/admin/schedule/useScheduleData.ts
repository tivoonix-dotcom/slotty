import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { getMySubscription } from '../../../features/admin/api/adminBillingApi';
import {
  createMySlot,
  deleteMySlot,
  getMySlots,
  updateMySlot,
  type MySlotDto,
} from '../../../features/admin/api/adminSlotsApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import type { ScheduleWindowStatus, ScheduleWindowView, WindowTemplate } from './scheduleTypes';
import {
  formatHmFromDate,
  isHorizonLimitErrorMessage,
  localDateTimeToUtcIso,
  rangesOverlapMs,
  serviceTitleById,
  toIsoDate,
} from './scheduleUtils';
import { loadWindowTemplates, saveWindowTemplates } from './windowTemplateStorage';

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}`;
}

function makeDemoSlot(payload: {
  startsAt: string;
  endsAt: string;
  serviceId: string | null;
}): MySlotDto {
  const now = new Date().toISOString();
  return {
    id: newLocalId(),
    masterId: 'demo',
    serviceId: payload.serviceId,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    status: 'available',
    source: 'manual',
    createdAt: now,
  };
}

function mapSlotStatus(raw: string): ScheduleWindowStatus {
  if (raw === 'booked') return 'booked';
  if (raw === 'available') return 'free';
  return 'blocked';
}

function findAppointmentForSlot(
  slot: MySlotDto,
  appointments: DemoMasterAppointment[],
): DemoMasterAppointment | undefined {
  const start = new Date(slot.startsAt);
  const dateIso = toIsoDate(start);
  const time = formatHmFromDate(start);
  return appointments.find(
    (a) =>
      a.date === dateIso &&
      a.time === time &&
      a.status !== 'cancelled' &&
      (slot.status === 'booked' || a.status === 'confirmed' || a.status === 'pending'),
  );
}

export function mapSlotToView(
  slot: MySlotDto,
  services: MasterOnboardingService[],
  appointments: DemoMasterAppointment[],
): ScheduleWindowView {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  const appt = findAppointmentForSlot(slot, appointments);
  const status = slot.status === 'booked' || appt ? 'booked' : mapSlotStatus(slot.status);

  return {
    id: slot.id,
    dateIso: toIsoDate(start),
    startTime: formatHmFromDate(start),
    endTime: formatHmFromDate(end),
    serviceId: slot.serviceId,
    serviceName: serviceTitleById(services, slot.serviceId),
    status,
    clientName: appt?.clientName,
    clientPhone: appt?.contact,
    slot,
  };
}

export function useScheduleData(
  masterId: string,
  visibleServices: MasterOnboardingService[],
  useCabinetApi: boolean,
  appointments: DemoMasterAppointment[],
) {
  const [rows, setRows] = useState<MySlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WindowTemplate[]>(() => loadWindowTemplates(masterId));
  const [scheduleHorizonDays, setScheduleHorizonDays] = useState<number | null>(null);

  const reloadSlots = useCallback(async (): Promise<MySlotDto[]> => {
    if (!useCabinetApi) return [];
    const list = await getMySlots();
    setRows(list);
    return list;
  }, [useCabinetApi]);

  useEffect(() => {
    setTemplates(loadWindowTemplates(masterId));
  }, [masterId]);

  useEffect(() => {
    if (!useCabinetApi) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await getMySlots();
        if (!cancelled) setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  useEffect(() => {
    if (!useCabinetApi) {
      setScheduleHorizonDays(90);
      return;
    }
    let cancelled = false;
    void getMySubscription()
      .then((sub) => {
        if (!cancelled) setScheduleHorizonDays(sub.plan.maxScheduleDaysAhead);
      })
      .catch(() => {
        if (!cancelled) setScheduleHorizonDays(14);
      });
    return () => {
      cancelled = true;
    };
  }, [useCabinetApi]);

  const persistTemplates = useCallback(
    (next: WindowTemplate[]) => {
      setTemplates(next);
      saveWindowTemplates(masterId, next);
    },
    [masterId],
  );

  const windows = useMemo(
    () => rows.map((s) => mapSlotToView(s, visibleServices, appointments)),
    [appointments, rows, visibleServices],
  );

  const slotOverlaps = useCallback(
    (startsAt: string, endsAt: string, excludeId?: string) => {
      const sm = new Date(startsAt).getTime();
      const em = new Date(endsAt).getTime();
      for (const s of rows) {
        if (excludeId && s.id === excludeId) continue;
        const a = new Date(s.startsAt).getTime();
        const b = new Date(s.endsAt).getTime();
        if (rangesOverlapMs(sm, em, a, b)) return true;
      }
      return false;
    },
    [rows],
  );

  const createSlots = useCallback(
    async (
      payloads: { startsAt: string; endsAt: string; serviceId: string | null }[],
    ): Promise<{ created: number; skipped: number; horizonFailed: number; failed: number }> => {
      let created = 0;
      let skipped = 0;
      let horizonFailed = 0;
      let failed = 0;

      if (!useCabinetApi) {
        const existing = [...rows];
        for (const b of payloads) {
          if (slotOverlaps(b.startsAt, b.endsAt)) {
            skipped += 1;
            continue;
          }
          existing.push(makeDemoSlot(b));
          created += 1;
        }
        setRows(existing);
        return { created, skipped, horizonFailed, failed };
      }

      const existing = [...rows];
      for (const b of payloads) {
        if (slotOverlaps(b.startsAt, b.endsAt)) {
          skipped += 1;
          continue;
        }
        try {
          const slot = await createMySlot(b);
          existing.push(slot);
          created += 1;
        } catch (e) {
          failed += 1;
          if (e instanceof Error && isHorizonLimitErrorMessage(e.message)) horizonFailed += 1;
        }
      }
      setRows(existing);
      return { created, skipped, horizonFailed, failed };
    },
    [rows, slotOverlaps, useCabinetApi],
  );

  const updateSlot = useCallback(
    async (
      slotId: string,
      payload: { startsAt: string; endsAt: string; serviceId: string | null },
    ) => {
      if (!useCabinetApi) {
        setRows((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? { ...s, startsAt: payload.startsAt, endsAt: payload.endsAt, serviceId: payload.serviceId }
              : s,
          ),
        );
        return;
      }
      await updateMySlot(slotId, payload);
      await reloadSlots();
    },
    [reloadSlots, useCabinetApi],
  );

  const removeSlot = useCallback(
    async (slotId: string) => {
      if (!useCabinetApi) {
        setRows((prev) => prev.filter((s) => s.id !== slotId));
        return;
      }
      await deleteMySlot(slotId);
      await reloadSlots();
    },
    [reloadSlots, useCabinetApi],
  );

  return {
    rows,
    windows,
    loading,
    templates,
    persistTemplates,
    scheduleHorizonDays,
    reloadSlots,
    slotOverlaps,
    createSlots,
    updateSlot,
    removeSlot,
    localDateTimeToUtcIso,
    isServiceUuid: isUuid,
  };
}
