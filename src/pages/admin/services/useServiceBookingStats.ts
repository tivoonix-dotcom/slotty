import { useMemo } from 'react';
import type { MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';

export function useServiceBookingStats(
  services: Array<{ id: string }>,
  slots: MySlotDto[] | null,
  appointments: DemoMasterAppointment[],
  now = new Date(),
) {
  return useMemo(() => {
    const nowMs = now.getTime();
    const slotMap = new Map<string, number>();
    const apptMap = new Map<string, number>();

    if (slots) {
      for (const slot of slots) {
        if (slot.status !== 'available') continue;
        if (new Date(slot.startsAt).getTime() < nowMs) continue;
        const key = slot.serviceId ?? '__any__';
        slotMap.set(key, (slotMap.get(key) ?? 0) + 1);
      }
    }

    for (const appt of appointments) {
      if (!['pending', 'confirmed', 'client_arrived', 'in_progress'].includes(appt.status)) continue;
      const start = new Date(`${appt.date}T${appt.time}:00`).getTime();
      if (start < nowMs) continue;
      const sid = appt.serviceId;
      if (!sid) continue;
      apptMap.set(sid, (apptMap.get(sid) ?? 0) + 1);
    }

    const anySlots = slotMap.get('__any__') ?? 0;

    return services.map((service) => ({
      serviceId: service.id,
      availableSlotsCount: (slotMap.get(service.id) ?? 0) + anySlots,
      upcomingAppointmentsCount: apptMap.get(service.id) ?? 0,
    }));
  }, [appointments, now, services, slots]);
}
