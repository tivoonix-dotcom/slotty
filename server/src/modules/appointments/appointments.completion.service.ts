import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { logNotification } from '../notifications/notificationLog.js';
import { normalizeDbStatus, type DbAppointmentStatus } from '../../lib/appointmentStatus.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import type { BookingActorRole } from './bookingEvents.service.js';
import { cancelBookingAutoCompleteJob } from './bookingCompletionJobs.service.js';
import { scheduleJobsAfterBookingCancelled } from '../notifications/notificationJobs.schedule.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import { notifyMasterByAppointmentId } from './appointments.masterNotifications.js';
import { clientOwnsAppointment, loadAppointmentById } from './appointments.access.js';
import { assertCanCompleteVisit, isVisitGuardError } from '../../lib/masterAppointmentLifecycle.js';

async function setAppointmentStatus(
  appointmentId: string,
  status: DbAppointmentStatus,
  timestamps?: Partial<{
    master_marked_completed_at: boolean;
    client_confirmed_completed_at: boolean;
    completed_at: boolean;
    auto_completed_at: boolean;
    disputed_at: boolean;
    no_show_at: boolean;
  }>,
): Promise<void> {
  const sets = [`status = $2::public.appointment_status`, `updated_at = now()`];
  const params: unknown[] = [appointmentId, status];
  let idx = 3;
  if (timestamps?.master_marked_completed_at) {
    sets.push(`master_marked_completed_at = coalesce(master_marked_completed_at, now())`);
  }
  if (timestamps?.client_confirmed_completed_at) {
    sets.push(`client_confirmed_completed_at = coalesce(client_confirmed_completed_at, now())`);
  }
  if (timestamps?.completed_at) {
    sets.push(`completed_at = now()`);
  }
  if (timestamps?.auto_completed_at) {
    sets.push(`auto_completed_at = now()`);
  }
  if (timestamps?.disputed_at) {
    sets.push(`disputed_at = now()`);
  }
  if (timestamps?.no_show_at) {
    sets.push(`no_show_at = now()`);
  }
  void idx;
  await query(`update public.appointments set ${sets.join(', ')} where id = $1`, params);
}

async function releaseSlot(appointmentId: string): Promise<void> {
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );
}

export async function finalizeAppointmentCompleted(params: {
  appointmentId: string;
  actorUserId: string;
  actorRole: BookingActorRole;
  eventType: 'booking.completed' | 'booking.completed_auto_confirmed' | 'booking.completed_by_master';
  auto?: boolean;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const row = await loadAppointmentById(params.appointmentId);
  if (!row) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');

  const oldStatus = normalizeDbStatus(row.status);
  if (oldStatus === 'completed') return;

  await setAppointmentStatus(params.appointmentId, 'completed', {
    completed_at: true,
    auto_completed_at: params.auto,
    master_marked_completed_at: true,
    client_confirmed_completed_at: true,
  });

  await insertBookingEvent({
    appointmentId: params.appointmentId,
    eventType: params.eventType,
    oldStatus,
    newStatus: 'completed',
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: params.auto
      ? { auto: true, ...(params.metadata ?? {}) }
      : params.metadata ?? null,
  });

  await cancelBookingAutoCompleteJob(params.appointmentId);
  void scheduleJobsAfterBookingCancelled(params.appointmentId);

  logNotification('booking.status.change', {
    bookingId: params.appointmentId,
    bookingCode: row.voucher_number,
    oldStatus,
    newStatus: 'completed',
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    auto: params.auto ?? false,
  });

  void notifyClientByAppointmentId(params.appointmentId, 'completed');
  void notifyMasterByAppointmentId(params.appointmentId, 'completed');
}

export async function masterMarkServiceCompleted(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const access = await loadAppointmentById(appointmentId);
  if (!access || access.master_id !== masterId) {
    throw ApiError.notFound('Appointment not found', 'BOOKING_NOT_FOUND');
  }

  const s = normalizeDbStatus(access.status);

  if (s === 'expired') {
    throw ApiError.conflict('Запись истекла', 'BOOKING_EXPIRED');
  }

  if (s === 'client_confirmed_completed' || access.client_confirmed_completed_at) {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: masterId,
      actorRole: 'master',
      eventType: 'booking.completed',
    });
    return { clientId: access.client_id };
  }

  if (s === 'master_marked_completed') {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: masterId,
      actorRole: 'master',
      eventType: 'booking.completed',
    });
    return { clientId: access.client_id };
  }

  try {
    assertCanCompleteVisit(s);
  } catch (e) {
    if (isVisitGuardError(e)) {
      throw ApiError.conflict(e.message, e.code);
    }
    throw e;
  }

  await finalizeAppointmentCompleted({
    appointmentId,
    actorUserId: masterId,
    actorRole: 'master',
    eventType: 'booking.completed_by_master',
  });

  return { clientId: access.client_id };
}

export async function clientConfirmServiceCompleted(
  clientId: string,
  appointmentId: string,
): Promise<{ masterId: string }> {
  const access = await loadAppointmentById(appointmentId);
  if (!access || !(await clientOwnsAppointment(access.client_id, clientId))) {
    throw ApiError.forbidden('Нельзя изменить чужую запись', 'BOOKING_FORBIDDEN');
  }

  const s = normalizeDbStatus(access.status);
  if (!['in_progress', 'master_marked_completed', 'client_confirmed_completed'].includes(s)) {
    throw ApiError.conflict('Подтверждение недоступно для этого статуса', 'BAD_STATUS');
  }

  const openDispute = await query(
    `select 1 from public.booking_disputes
      where appointment_id = $1 and status in ('open', 'in_review')`,
    [appointmentId],
  );
  if (openDispute.rowCount) {
    throw ApiError.conflict('Запись на рассмотрении — подтверждение недоступно', 'DISPUTE_OPEN');
  }

  await query(
    `update public.appointments
        set client_confirmed_completed_at = coalesce(client_confirmed_completed_at, now()),
            updated_at = now()
      where id = $1`,
    [appointmentId],
  );

  const refreshed = await loadAppointmentById(appointmentId);
  if (!refreshed) throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');

  if (
    normalizeDbStatus(refreshed.status) === 'master_marked_completed' ||
    refreshed.master_marked_completed_at
  ) {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: clientId,
      actorRole: 'client',
      eventType: 'booking.completed',
    });
    return { masterId: refreshed.master_id };
  }

  if (normalizeDbStatus(refreshed.status) === 'in_progress') {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: clientId,
      actorRole: 'client',
      eventType: 'booking.completed',
    });
    return { masterId: refreshed.master_id };
  }

  if (normalizeDbStatus(refreshed.status) === 'client_confirmed_completed') {
    await insertBookingEvent({
      appointmentId,
      eventType: 'booking.client_confirmed_completed',
      oldStatus: 'client_confirmed_completed',
      newStatus: 'client_confirmed_completed',
      actorUserId: clientId,
      actorRole: 'client',
    });
    void notifyMasterByAppointmentId(appointmentId, 'client_confirmed_completed');
  }

  return { masterId: refreshed.master_id };
}

export async function processAutoCompleteAppointment(appointmentId: string): Promise<boolean> {
  const row = await loadAppointmentById(appointmentId);
  if (!row) return false;

  if (normalizeDbStatus(row.status) !== 'master_marked_completed') {
    await cancelBookingAutoCompleteJob(appointmentId);
    return false;
  }

  if (row.client_confirmed_completed_at) {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: row.master_id,
      actorRole: 'system',
      eventType: 'booking.completed',
    });
    return true;
  }

  const dispute = await query(
    `select 1 from public.booking_disputes where appointment_id = $1 and status in ('open', 'in_review')`,
    [appointmentId],
  );
  if (dispute.rowCount) return false;

  await finalizeAppointmentCompleted({
    appointmentId,
    actorUserId: row.master_id,
    actorRole: 'system',
    eventType: 'booking.completed_auto_confirmed',
    auto: true,
  });
  return true;
}

export { setAppointmentStatus, releaseSlot };
