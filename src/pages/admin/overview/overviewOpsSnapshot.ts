import type { MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import { isoDateLocal, type DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { compareAppointmentsByDateAsc } from '../appointments/appointmentsFormat';

export type OverviewOpsSnapshot = {
  pendingCount: number;
  todayAppointmentsCount: number;
  todayPreview: DemoMasterAppointment[];
  nearestAppointment: DemoMasterAppointment | null;
  freeSlotsToday: number;
  totalSlotsToday: number;
  bookedSlotsToday: number;
  scheduleFillPercent: number;
  activeFutureSlotCount: number;
};

const ACTIVE_TODAY = new Set([
  'pending',
  'confirmed',
  'client_arrived',
  'in_progress',
]);

function isPendingRow(row: DemoMasterAppointment): boolean {
  return row.status === 'pending' || row.dbStatus === 'pending';
}

function isActiveTodayRow(row: DemoMasterAppointment, today: string): boolean {
  return row.date === today && ACTIVE_TODAY.has(row.status);
}

export function computeOverviewOpsSnapshot(
  appointments: DemoMasterAppointment[],
  slots: MySlotDto[] | null,
  pendingOverride?: number | null,
  now = new Date(),
): OverviewOpsSnapshot {
  const today = isoDateLocal(now);
  const nowMs = now.getTime();

  const pendingCount =
    pendingOverride != null
      ? pendingOverride
      : appointments.filter(isPendingRow).length;

  const todayRows = appointments
    .filter((row) => isActiveTodayRow(row, today))
    .sort(compareAppointmentsByDateAsc);

  let freeSlotsToday = 0;
  let totalSlotsToday = 0;
  let bookedSlotsToday = 0;
  let activeFutureSlotCount = 0;

  if (slots) {
    for (const slot of slots) {
      const start = new Date(slot.startsAt);
      if (start.getTime() >= nowMs && slot.status === 'available') {
        activeFutureSlotCount += 1;
      }
      if (isoDateLocal(start) !== today) continue;
      if (start.getTime() < nowMs) continue;

      totalSlotsToday += 1;
      if (slot.status === 'booked') {
        bookedSlotsToday += 1;
      } else if (slot.status === 'available') {
        freeSlotsToday += 1;
      }
    }
  }

  const scheduleFillPercent =
    totalSlotsToday > 0 ? Math.min(100, Math.round((bookedSlotsToday / totalSlotsToday) * 100)) : 0;

  const nearestAppointment =
    appointments
      .filter((row) => ACTIVE_TODAY.has(row.status) || row.status === 'confirmed')
      .filter((row) => {
        const start = new Date(`${row.date}T${row.time}:00`);
        return start.getTime() >= nowMs;
      })
      .sort(compareAppointmentsByDateAsc)[0] ?? null;

  return {
    pendingCount,
    todayAppointmentsCount: todayRows.length,
    todayPreview: todayRows.slice(0, 3),
    nearestAppointment,
    freeSlotsToday,
    totalSlotsToday,
    bookedSlotsToday,
    scheduleFillPercent,
    activeFutureSlotCount,
  };
}
