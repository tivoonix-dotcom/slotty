import { query } from '../../config/db.js';
import {
  BOOKING_CONFIRMATION_RULES,
} from '../../lib/bookingConfirmationDeadlines.js';
import { logNotification, logNotificationWarn } from './notificationLog.js';
import type { NotificationJobChannel, NotificationJobType } from './notificationJobs.types.js';
import { enqueueNotificationJob } from './notificationJobs.service.js';

const REMINDER_1H_MS = 60 * 60 * 1000;
const REMINDER_24H_MS = 24 * 60 * 60 * 1000;

type AppointmentParties = {
  appointmentId: string;
  clientId: string;
  masterId: string;
  startsAt: Date;
  voucherNumber: string | null;
  status: string;
  pendingExpiresAt: Date | null;
  createdAt: Date;
};

async function loadAppointmentParties(appointmentId: string): Promise<AppointmentParties | null> {
  const r = await query<{
    id: string;
    client_id: string;
    master_id: string;
    starts_at: Date | string;
    status: string;
    voucher_number: string | null;
    pending_expires_at: Date | string | null;
    created_at: Date | string;
  }>(
    `select a.id, a.client_id, a.master_id, a.starts_at, a.status::text as status,
            a.pending_expires_at, a.created_at,
            bv.voucher_number
       from public.appointments a
       left join public.booking_vouchers bv on bv.appointment_id = a.id
      where a.id = $1`,
    [appointmentId],
  );
  const row = r.rows[0];
  if (!row) return null;
  const startsAt =
    row.starts_at instanceof Date ? row.starts_at : new Date(row.starts_at as string);
  const createdAt =
    row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string);
  const pendingExpiresAt = row.pending_expires_at
    ? row.pending_expires_at instanceof Date
      ? row.pending_expires_at
      : new Date(row.pending_expires_at as string)
    : null;
  return {
    appointmentId: row.id,
    clientId: row.client_id,
    masterId: row.master_id,
    startsAt,
    voucherNumber: row.voucher_number,
    status: row.status,
    pendingExpiresAt,
    createdAt,
  };
}

function reminderRecipients(parties: AppointmentParties): string[] {
  return [parties.clientId, parties.masterId];
}

async function enqueueForUsers(
  parties: AppointmentParties,
  jobType: NotificationJobType,
  scheduledAt: Date,
  userIds: string[],
  channels: NotificationJobChannel[],
): Promise<void> {
  for (const recipientUserId of userIds) {
    for (const channel of channels) {
      await enqueueNotificationJob({
        jobType,
        channel,
        recipientUserId,
        appointmentId: parties.appointmentId,
        scheduledAt,
      });
      logNotification('notification.enqueue', {
        bookingId: parties.appointmentId,
        recipientUserId,
        channel,
        type: jobType,
        scheduledAt: scheduledAt.toISOString(),
        status: 'pending',
      });
    }
  }
}

function logBookingCreated(parties: AppointmentParties): void {
  logNotification('booking.created', {
    bookingId: parties.appointmentId,
    bookingCode: parties.voucherNumber,
    clientUserId: parties.clientId,
    masterUserId: parties.masterId,
    startAt: parties.startsAt.toISOString(),
    timezone: 'Europe/Minsk',
    status: parties.status,
  });
}

async function scheduleVisitStartJob(parties: AppointmentParties): Promise<void> {
  const now = Date.now();
  const scheduledAt = parties.startsAt;
  if (scheduledAt.getTime() <= now) {
    logNotificationWarn('notification.enqueue.skipped', {
      bookingId: parties.appointmentId,
      type: 'booking_visit_start',
      reason: 'PAST_SCHEDULE',
      scheduledAt: scheduledAt.toISOString(),
      startAt: parties.startsAt.toISOString(),
    });
    return;
  }

  await enqueueForUsers(
    parties,
    'booking_visit_start',
    scheduledAt,
    [parties.masterId],
    ['email', 'telegram', 'in_app'],
  );
}

async function scheduleReminderJobs(parties: AppointmentParties): Promise<void> {
  const now = Date.now();
  const specs: Array<{ kind: '1h' | '24h'; ms: number; jobType: NotificationJobType }> = [
    { kind: '1h', ms: REMINDER_1H_MS, jobType: 'booking_reminder_1h' },
    { kind: '24h', ms: REMINDER_24H_MS, jobType: 'booking_reminder_24h' },
  ];

  for (const spec of specs) {
    const scheduledAt = new Date(parties.startsAt.getTime() - spec.ms);
    if (scheduledAt.getTime() <= now) {
      logNotificationWarn('notification.enqueue.skipped', {
        bookingId: parties.appointmentId,
        type: spec.jobType,
        reason: 'PAST_SCHEDULE',
        scheduledAt: scheduledAt.toISOString(),
        startAt: parties.startsAt.toISOString(),
      });
      continue;
    }

    await enqueueForUsers(
      parties,
      spec.jobType,
      scheduledAt,
      reminderRecipients(parties),
      ['email', 'telegram', 'in_app'],
    );
  }
}

async function schedulePendingDecisionJobs(parties: AppointmentParties): Promise<void> {
  if (parties.status !== 'pending') return;
  const now = Date.now();
  const channels: NotificationJobChannel[] = ['email', 'telegram', 'in_app'];

  const reminderAt = new Date(
    parties.createdAt.getTime() + BOOKING_CONFIRMATION_RULES.MASTER_PENDING_REMINDER_MS,
  );
  if (reminderAt.getTime() > now) {
    await enqueueForUsers(
      parties,
      'booking_master_pending_reminder',
      reminderAt,
      [parties.masterId],
      channels,
    );
  }

  if (parties.pendingExpiresAt) {
    const deadlineAt = new Date(
      parties.pendingExpiresAt.getTime() -
        BOOKING_CONFIRMATION_RULES.MASTER_PENDING_DEADLINE_WARNING_MS,
    );
    if (deadlineAt.getTime() > now) {
      await enqueueForUsers(
        parties,
        'booking_master_pending_deadline',
        deadlineAt,
        [parties.masterId],
        channels,
      );
    }
  }
}

/** После создания записи: лог + напоминания мастеру о pending (не visit reminders). */
export async function scheduleJobsAfterBookingCreated(appointmentId: string): Promise<void> {
  const parties = await loadAppointmentParties(appointmentId);
  if (!parties) return;
  logBookingCreated(parties);
  await schedulePendingDecisionJobs(parties);
}

/** После подтверждения / отмены — отменить pending reminders и visit reminders. */
export async function cancelPendingReminderJobs(appointmentId: string): Promise<void> {
  await query(
    `update public.notification_jobs
        set status = 'cancelled', updated_at = now()
      where appointment_id = $1
        and job_type in (
          'booking_reminder_1h', 'booking_reminder_24h', 'booking_visit_start',
          'booking_master_pending_reminder', 'booking_master_pending_deadline'
        )
        and status = 'pending'`,
    [appointmentId],
  );
}

export async function scheduleJobsAfterBookingConfirmed(appointmentId: string): Promise<void> {
  await cancelPendingReminderJobs(appointmentId);
  const parties = await loadAppointmentParties(appointmentId);
  if (!parties) return;
  await scheduleReminderJobs(parties);
  await scheduleVisitStartJob(parties);
}

export async function scheduleJobsAfterBookingCancelled(appointmentId: string): Promise<void> {
  await cancelPendingReminderJobs(appointmentId);
}
