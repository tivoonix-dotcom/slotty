import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { logNotification } from '../notifications/notificationLog.js';
import { insertBookingEvent } from './bookingEvents.service.js';
import type { BookingActorRole } from './bookingEvents.service.js';
import { scheduleJobsAfterBookingCancelled, scheduleJobsAfterBookingConfirmed } from '../notifications/notificationJobs.schedule.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import type { DbAppointmentStatus } from '../../lib/appointmentStatus.js';
import { normalizeDbStatus } from '../../lib/appointmentStatus.js';
import {
  assertCanCancelBeforeEnd,
  assertCanCloseOverdueRecord,
  assertCanStartVisit,
  assertLegacyClientArrivedForbidden,
  assertLegacyInstantNoShowForbidden,
  isVisitGuardError,
} from '../../lib/masterAppointmentLifecycle.js';

type TransitionRow = {
  id: string;
  status: string;
  client_id: string;
  master_id: string;
  slot_id: string;
  starts_at: Date | string;
  ends_at: Date | string;
};

function guardApiError(err: unknown): never {
  if (isVisitGuardError(err)) {
    throw ApiError.conflict(err.message, err.code);
  }
  throw err;
}

async function loadForMaster(masterId: string, appointmentId: string): Promise<TransitionRow> {
  const r = await query<TransitionRow>(
    `select id, status::text, client_id, master_id, slot_id, starts_at, ends_at
       from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Appointment not found', 'BOOKING_NOT_FOUND');
  return row;
}

async function setStatus(
  appointmentId: string,
  next: DbAppointmentStatus,
  extra?: { cancelReason?: string | null; cancelReasonCategory?: string | null },
): Promise<void> {
  if (extra?.cancelReason !== undefined) {
    await query(
      `update public.appointments
          set status = $2::public.appointment_status,
              cancel_reason = $3,
              cancel_reason_category = $4,
              updated_at = now()
        where id = $1`,
      [appointmentId, next, extra.cancelReason ?? null, extra.cancelReasonCategory ?? null],
    );
    return;
  }
  if (next === 'confirmed') {
    await query(
      `update public.appointments
          set status = $2::public.appointment_status, confirmed_at = now(), updated_at = now()
        where id = $1`,
      [appointmentId, next],
    );
    return;
  }
  await query(
    `update public.appointments set status = $2::public.appointment_status, updated_at = now() where id = $1`,
    [appointmentId, next],
  );
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

function logStatusChange(params: {
  appointmentId: string;
  voucherNumber?: string | null;
  oldStatus: string;
  newStatus: string;
  actorUserId: string;
  actorRole: BookingActorRole;
  reason?: string | null;
}): void {
  logNotification('booking.status.change', {
    bookingId: params.appointmentId,
    bookingCode: params.voucherNumber,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    reason: params.reason,
  });
}

async function transition(
  masterId: string,
  appointmentId: string,
  target: DbAppointmentStatus,
  opts: {
    eventType: string;
    reason?: string | null;
    cancelReasonCategory?: string | null;
    notify?: 'confirmed' | 'cancelled_by_master' | 'completed' | 'no_show' | null;
    releaseSlot?: boolean;
    scheduleReminders?: boolean;
    cancelReminders?: boolean;
  },
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const oldStatus = normalizeDbStatus(row.status);
  if (oldStatus === target) {
    throw ApiError.conflict('Status already set', 'BAD_STATUS');
  }

  await setStatus(appointmentId, target, {
    cancelReason: opts.reason,
    cancelReasonCategory: opts.cancelReasonCategory,
  });

  if (opts.releaseSlot) await releaseSlot(appointmentId);

  await insertBookingEvent({
    appointmentId,
    eventType: opts.eventType,
    oldStatus,
    newStatus: target,
    actorUserId: masterId,
    actorRole: 'master',
    reason: opts.reason,
  });

  const voucherR = await query<{ n: string | null }>(
    `select voucher_number as n from public.booking_vouchers where appointment_id = $1`,
    [appointmentId],
  );

  logStatusChange({
    appointmentId,
    voucherNumber: voucherR.rows[0]?.n,
    oldStatus,
    newStatus: target,
    actorUserId: masterId,
    actorRole: 'master',
    reason: opts.reason,
  });

  if (opts.notify === 'confirmed') void notifyClientByAppointmentId(appointmentId, 'confirmed');
  if (opts.notify === 'cancelled_by_master') void notifyClientByAppointmentId(appointmentId, 'cancelled_by_master');
  if (opts.notify === 'completed') void notifyClientByAppointmentId(appointmentId, 'completed');
  if (opts.notify === 'no_show') void notifyClientByAppointmentId(appointmentId, 'no_show');

  if (opts.scheduleReminders) void scheduleJobsAfterBookingConfirmed(appointmentId);
  if (opts.cancelReminders) void scheduleJobsAfterBookingCancelled(appointmentId);

  return { clientId: row.client_id };
}

async function assertPendingCanBeConfirmed(appointmentId: string, status: string): Promise<void> {
  const s = normalizeDbStatus(status);
  if (s === 'expired') {
    throw ApiError.conflict('Заявка уже истекла', 'BOOKING_EXPIRED');
  }
  if (s !== 'pending') {
    throw ApiError.conflict('Only pending appointments can be confirmed', 'BAD_STATUS');
  }
  const r = await query<{ pending_expires_at: Date | string | null }>(
    `select pending_expires_at from public.appointments where id = $1`,
    [appointmentId],
  );
  const expires = r.rows[0]?.pending_expires_at;
  if (expires) {
    const t = expires instanceof Date ? expires.getTime() : new Date(expires).getTime();
    if (Number.isFinite(t) && t <= Date.now()) {
      throw ApiError.conflict('Заявка уже истекла', 'BOOKING_EXPIRED');
    }
  }
}

export async function masterConfirmAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  await assertPendingCanBeConfirmed(appointmentId, row.status);
  return transition(masterId, appointmentId, 'confirmed', {
    eventType: 'booking.confirmed',
    notify: 'confirmed',
    scheduleReminders: true,
  });
}

export async function masterClientArrivedLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  void masterId;
  void appointmentId;
  try {
    assertLegacyClientArrivedForbidden();
  } catch (e) {
    guardApiError(e);
  }
  throw ApiError.conflict('Unreachable', 'DEPRECATED_CLIENT_ARRIVED');
}

export async function masterStartVisitLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  try {
    assertCanStartVisit({
      status: s,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    });
  } catch (e) {
    guardApiError(e);
  }
  return transition(masterId, appointmentId, 'in_progress', { eventType: 'booking.started' });
}

/** @deprecated Используйте masterMarkServiceCompleted — двустороннее завершение. */
export async function masterCompleteAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const { masterMarkServiceCompleted } = await import('./appointments.completion.service.js');
  return masterMarkServiceCompleted(masterId, appointmentId);
}

export async function masterNoShowLifecycle(
  masterId: string,
  appointmentId: string,
  _comment?: string | null,
): Promise<{ clientId: string }> {
  void masterId;
  void appointmentId;
  void _comment;
  try {
    assertLegacyInstantNoShowForbidden();
  } catch (e) {
    guardApiError(e);
  }
  throw ApiError.conflict('Unreachable', 'USE_SUPPORT_NO_SHOW');
}

export async function masterCancelAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
  reason: string,
  category?: string | null,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  try {
    assertCanCancelBeforeEnd({ status: s, endsAt: row.ends_at });
  } catch (e) {
    guardApiError(e);
  }
  if (!['pending', 'confirmed', 'client_arrived', 'in_progress'].includes(s)) {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  return transition(masterId, appointmentId, 'cancelled_by_master', {
    eventType: 'booking.cancelled_by_master',
    reason,
    cancelReasonCategory: category,
    notify: 'cancelled_by_master',
    releaseSlot: true,
    cancelReminders: true,
  });
}

export async function masterCloseOverdueAppointmentLifecycle(
  masterId: string,
  appointmentId: string,
  reason?: string | null,
): Promise<{ clientId: string }> {
  const row = await loadForMaster(masterId, appointmentId);
  const s = normalizeDbStatus(row.status);
  try {
    assertCanCloseOverdueRecord({ status: s, endsAt: row.ends_at });
  } catch (e) {
    guardApiError(e);
  }

  const { finalizeAppointmentCompleted } = await import('./appointments.completion.service.js');

  const overdueMeta = {
    overdueClose: true,
    ...(reason?.trim() ? { closeReason: reason.trim() } : {}),
  };

  if (s === 'master_marked_completed' || s === 'client_confirmed_completed') {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: masterId,
      actorRole: 'master',
      eventType: 'booking.completed_by_master',
      metadata: overdueMeta,
    });
    return { clientId: row.client_id };
  }

  if (s === 'in_progress') {
    await finalizeAppointmentCompleted({
      appointmentId,
      actorUserId: masterId,
      actorRole: 'master',
      eventType: 'booking.completed_by_master',
      metadata: overdueMeta,
    });
    return { clientId: row.client_id };
  }

  if (s === 'client_arrived') {
    await setStatus(appointmentId, 'in_progress');
    await insertBookingEvent({
      appointmentId,
      eventType: 'booking.started',
      oldStatus: s,
      newStatus: 'in_progress',
      actorUserId: masterId,
      actorRole: 'master',
      metadata: { autoStartedOnClose: true },
    });
  }

  await finalizeAppointmentCompleted({
    appointmentId,
    actorUserId: masterId,
    actorRole: 'master',
    eventType: 'booking.completed_by_master',
    metadata: overdueMeta,
  });
  return { clientId: row.client_id };
}
