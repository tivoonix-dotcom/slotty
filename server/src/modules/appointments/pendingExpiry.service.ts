import { query } from '../../config/db.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import { notifyMasterBookingExpired } from './appointments.masterNotifications.js';
import { scheduleJobsAfterBookingCancelled } from '../notifications/notificationJobs.schedule.js';
import { logNotification } from '../notifications/notificationLog.js';

export type PendingExpiryReport = {
  expired: number;
  durationMs: number;
};

export async function expireDuePendingAppointments(limit = 50): Promise<PendingExpiryReport> {
  const started = Date.now();
  const due = await query<{ id: string; master_id: string }>(
    `select id, master_id
       from public.appointments
      where status = 'pending'
        and pending_expires_at is not null
        and pending_expires_at <= now()
      order by pending_expires_at asc
      limit $1
      for update skip locked`,
    [limit],
  );

  let expired = 0;
  for (const row of due.rows) {
    await expirePendingAppointment(row.id, row.master_id);
    expired += 1;
  }

  return { expired, durationMs: Date.now() - started };
}

async function expirePendingAppointment(appointmentId: string, masterId: string): Promise<void> {
  const r = await query<{ status: string }>(
    `update public.appointments
        set status = 'expired'::public.appointment_status, updated_at = now()
      where id = $1 and status = 'pending'
      returning status::text`,
    [appointmentId],
  );
  if (!r.rows[0]) return;

  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.expired',
    oldStatus: 'pending',
    newStatus: 'expired',
    actorUserId: masterId,
    actorRole: 'system',
    reason: 'Мастер не успел подтвердить заявку',
  });

  void scheduleJobsAfterBookingCancelled(appointmentId);
  void notifyClientByAppointmentId(appointmentId, 'expired');
  void notifyMasterBookingExpired(appointmentId).catch((err) => {
    console.warn('[notify] notifyMasterBookingExpired:', err instanceof Error ? err.message : err);
  });

  logNotification('booking.pending.expired', { bookingId: appointmentId });
}
