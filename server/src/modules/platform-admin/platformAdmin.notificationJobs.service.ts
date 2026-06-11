import { resolveAccountEmail } from '../profiles/profiles.service.js';
import { isResendConfigured, resolveResendFrom } from '../email/emailConfig.js';
import { sendSlottyEmail } from '../auth/email/resendMail.js';
import { buildSlottyEmailHtml } from '../email/transactionalEmailLayout.js';
import { publicAppUrl } from '../../lib/publicAppUrl.js';
import { fetchAppointmentNotifyContext } from '../appointments/appointmentNotifyContext.js';
import { clientBookingCreatedEmail } from '../appointments/appointmentNotifyEmail.js';
import {
  listNotificationJobs,
  rebuildReminderJobsForAppointment,
  retryAllFailedNotificationJobs,
  retryNotificationJob,
} from '../notifications/notificationJobs.service.js';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import { getBookingAutoCompleteWorkerStatus } from '../appointments/bookingAutoComplete.worker.js';
import { getNotificationJobsWorkerStatus } from '../notifications/notificationJobs.worker.js';

export async function listJobsForAdmin(params: {
  bookingCode?: string;
  appointmentId?: string;
  limit?: number;
}) {
  return listNotificationJobs(params);
}

export async function sendTestEmailToAdmin(adminProfileId: string): Promise<{ to: string; messageId: string | null }> {
  const to = await resolveAccountEmail(adminProfileId);
  if (!to) {
    throw ApiError.badRequest('У аккаунта нет email (Google или email-вход)', 'NO_EMAIL');
  }
  if (!isResendConfigured()) {
    throw ApiError.serviceUnavailable('RESEND_API_KEY не задан', 'RESEND_NOT_CONFIGURED');
  }
  const result = await sendSlottyEmail({
    to,
    subject: 'Тест SLOTTY — уведомления',
    html: buildSlottyEmailHtml({
      documentTitle: 'Тест SLOTTY — уведомления',
      preview: 'Проверка доставки писем SLOTTY.',
      title: 'Тестовое письмо',
      intro: 'Resend настроен корректно — так выглядят уведомления SLOTTY.',
      ctaLabel: 'Открыть SLOTTY',
      ctaUrl: publicAppUrl('/book'),
      metaLabel: 'Тест',
    }),
    text: 'Тестовое письмо от SLOTTY.',
  });
  return { to, messageId: result.messageId };
}

export async function sendTestBookingEmailByCode(
  adminProfileId: string,
  bookingCode: string,
): Promise<{ to: string; messageId: string | null }> {
  const to = await resolveAccountEmail(adminProfileId);
  if (!to) {
    throw ApiError.badRequest('У аккаунта нет email', 'NO_EMAIL');
  }
  const appt = await query<{ id: string }>(
    `select appointment_id as id from public.booking_vouchers where voucher_number = $1`,
    [bookingCode.trim().toUpperCase()],
  );
  const appointmentId = appt.rows[0]?.id;
  if (!appointmentId) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) {
    throw ApiError.notFound('Контекст записи не найден', 'BOOKING_NOT_FOUND');
  }
  const mail = clientBookingCreatedEmail(ctx);
  const result = await sendSlottyEmail({ to, ...mail });
  return { to, messageId: result.messageId };
}

export async function rebuildRemindersByBookingCode(bookingCode: string): Promise<void> {
  const appt = await query<{ id: string }>(
    `select appointment_id as id from public.booking_vouchers where voucher_number = $1`,
    [bookingCode.trim().toUpperCase()],
  );
  const appointmentId = appt.rows[0]?.id;
  if (!appointmentId) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  await rebuildReminderJobsForAppointment(appointmentId);
}

export async function sendTestTelegramToAdmin(
  adminProfileId: string,
): Promise<{ status: string; skipped?: boolean }> {
  const result = await sendNotificationToProfile(
    adminProfileId,
    '<b>SLOTTY</b>\n\nТестовое уведомление Telegram.',
  );
  if (result.status === 'skipped') {
    return { status: 'skipped', skipped: true };
  }
  return { status: result.status };
}

export function getNotificationDiagnostics() {
  return {
    resendConfigured: isResendConfigured(),
    resendFrom: resolveResendFrom(),
    telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN?.trim()),
    notificationJobsEnabled: env.NOTIFICATION_JOBS_ENABLED,
    environment: env.NODE_ENV,
    appPublicUrl: env.CLIENT_URL,
  };
}

export async function getExtendedNotificationDiagnostics() {
  const countsR = await query<{ status: string; count: number }>(
    `select status, count(*)::int as count
       from public.notification_jobs
      group by status`,
  );
  const jobCounts: Record<string, number> = {};
  for (const row of countsR.rows) {
    jobCounts[row.status] = row.count;
  }

  const lastFailedR = await query<{
    id: string;
    job_type: string;
    channel: string;
    last_error: string | null;
    attempts: number;
    updated_at: Date | string;
    appointment_id: string;
  }>(
    `select id, job_type, channel, last_error, attempts, updated_at, appointment_id
       from public.notification_jobs
      where status = 'failed'
      order by updated_at desc
      limit 15`,
  );

  const stillFailed = jobCounts.failed ?? 0;

  return {
    ...getNotificationDiagnostics(),
    notificationWorker: getNotificationJobsWorkerStatus(),
    autoCompleteWorker: getBookingAutoCompleteWorkerStatus(),
    jobCounts,
    pendingJobs: jobCounts.pending ?? 0,
    failedJobs: stillFailed,
    lastFailedJobs: lastFailedR.rows.map((row) => ({
      id: row.id,
      jobType: row.job_type,
      channel: row.channel,
      lastError: row.last_error,
      attempts: row.attempts,
      updatedAt:
        row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
      appointmentId: row.appointment_id,
    })),
  };
}

export { retryNotificationJob, retryAllFailedNotificationJobs };
