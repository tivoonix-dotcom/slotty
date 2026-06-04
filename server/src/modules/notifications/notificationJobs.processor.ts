import { fetchAppointmentNotifyContext } from '../appointments/appointmentNotifyContext.js';
import {
  clientBookingConfirmedEmail,
  clientBookingCreatedEmail,
  clientBookingReminderEmail,
  masterBookingCreatedEmail,
  masterBookingReminderEmail,
} from '../appointments/appointmentNotifyEmail.js';
import {
  clientBookingRequestCreated,
  clientBookingConfirmed,
  masterBookingRequestCreated,
} from './templates/appointmentNotificationTemplates.js';
import {
  clientBookingTelegramKeyboard,
  masterBookingTelegramKeyboard,
} from './telegramAppointmentKeyboard.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import { deliverEmailNotification } from './notifyUser.js';
import { insertUserNotification } from './notificationsInsert.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';
import type { NotificationJobRow } from './notificationJobs.types.js';
import { query } from '../../config/db.js';
import type { NotificationType } from './notificationsInsert.js';
import {
  logPreferenceDisabledDelivery,
  mapNotificationJobTypeToPreferenceEvent,
  shouldDeliverMasterNotification,
} from './masterNotificationPreferences.deliver.js';

export type ProcessJobResult =
  | { status: 'sent'; providerMessageId?: string | null }
  | { status: 'skipped'; reason: string };

async function appointmentStillActive(appointmentId: string): Promise<boolean> {
  const r = await query<{ status: string; starts_at: Date | string }>(
    `select status::text, starts_at from public.appointments where id = $1`,
    [appointmentId],
  );
  const row = r.rows[0];
  if (!row) return false;
  if (!['pending', 'confirmed'].includes(row.status)) return false;
  const startsAt = row.starts_at instanceof Date ? row.starts_at : new Date(row.starts_at);
  return startsAt.getTime() > Date.now();
}

function isReminderJob(jobType: string): boolean {
  return jobType === 'booking_reminder_1h' || jobType === 'booking_reminder_24h';
}

function buildReminderTelegramHtml(
  ctx: NonNullable<Awaited<ReturnType<typeof fetchAppointmentNotifyContext>>>,
  job: NotificationJobRow,
  forMaster: boolean,
): string {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  const title = forMaster
    ? job.job_type === 'booking_reminder_24h'
      ? 'Напоминание: завтра у вас запись'
      : 'Напоминание: через час у вас запись'
    : job.job_type === 'booking_reminder_24h'
      ? 'Напоминание: завтра запись'
      : 'Напоминание: через час запись';

  if (forMaster) {
    return (
      `<b>${escapeTelegramHtml(title)}</b>\n\n` +
      `Клиент: <b>${escapeTelegramHtml(ctx.clientName)}</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}`
    );
  }
  return (
    `<b>${escapeTelegramHtml(title)}</b>\n\n` +
    `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
    `Дата: ${escapeTelegramHtml(date)}\n` +
    `Время: ${escapeTelegramHtml(time)}\n` +
    `Мастер: ${escapeTelegramHtml(ctx.masterName)}`
  );
}

export async function processNotificationJob(job: NotificationJobRow): Promise<ProcessJobResult> {
  if (isReminderJob(job.job_type)) {
    const active = await appointmentStillActive(job.appointment_id);
    if (!active) {
      return { status: 'skipped', reason: 'APPOINTMENT_NOT_ACTIVE' };
    }
  }

  const ctx = await fetchAppointmentNotifyContext(job.appointment_id);
  if (!ctx) {
    return { status: 'skipped', reason: 'APPOINTMENT_NOT_FOUND' };
  }

  const forMaster = job.recipient_user_id === ctx.masterId;
  const forClient = job.recipient_user_id === ctx.clientId;
  if (!forMaster && !forClient) {
    return { status: 'skipped', reason: 'WRONG_RECIPIENT' };
  }

  if (forMaster) {
    const prefEvent = mapNotificationJobTypeToPreferenceEvent(job.job_type, true);
    if (prefEvent) {
      const allowed = await shouldDeliverMasterNotification(
        job.recipient_user_id,
        prefEvent,
        job.channel,
      );
      if (!allowed) {
        await logPreferenceDisabledDelivery({
          profileId: job.recipient_user_id,
          eventType: prefEvent,
          channel: job.channel,
        });
        return { status: 'skipped', reason: 'PREFERENCE_DISABLED' };
      }
    }
  }

  const notifyType: NotificationType = isReminderJob(job.job_type)
    ? 'appointment_reminder'
    : job.job_type === 'booking_client_confirmed'
      ? 'appointment_confirmed'
      : job.job_type === 'booking_master_new'
        ? 'appointment_new'
        : 'appointment_pending';

  if (job.channel === 'email') {
    let mail;
    if (isReminderJob(job.job_type)) {
      const kind = job.job_type as 'booking_reminder_1h' | 'booking_reminder_24h';
      mail = forMaster ? masterBookingReminderEmail(ctx, kind) : clientBookingReminderEmail(ctx, kind);
    } else if (job.job_type === 'booking_client_confirmed') {
      mail = clientBookingConfirmedEmail(ctx);
    } else if (job.job_type === 'booking_master_new') {
      mail = masterBookingCreatedEmail(ctx);
    } else {
      mail = clientBookingCreatedEmail(ctx);
    }
    return deliverEmailNotification({
      userId: job.recipient_user_id,
      type: notifyType,
      email: mail,
      template: job.job_type,
      bookingCode: ctx.voucherNumber,
      masterPreferenceEvent: forMaster
        ? mapNotificationJobTypeToPreferenceEvent(job.job_type, true) ?? undefined
        : undefined,
    });
  }

  if (job.channel === 'in_app') {
    let title: string;
    let body: string;
    if (isReminderJob(job.job_type)) {
      title =
        job.job_type === 'booking_reminder_24h'
          ? forMaster
            ? 'Напоминание: завтра у вас запись'
            : 'Напоминание: завтра запись'
          : forMaster
            ? 'Напоминание: через час у вас запись'
            : 'Напоминание: через час запись';
      body = `${ctx.serviceTitle} — ${ctx.startsAt}`;
    } else if (job.job_type === 'booking_client_confirmed') {
      const p = clientBookingConfirmed(ctx);
      title = p.title;
      body = p.body;
    } else if (job.job_type === 'booking_master_new') {
      const p = masterBookingRequestCreated(ctx);
      title = p.title;
      body = p.body;
    } else {
      const p = clientBookingRequestCreated(ctx);
      title = p.title;
      body = p.body;
    }
    await insertUserNotification({
      userId: job.recipient_user_id,
      type: notifyType,
      title,
      body,
      relatedEntityType: 'appointment',
      relatedEntityId: job.appointment_id,
    });
    return { status: 'sent' };
  }

  if (job.channel === 'telegram') {
    let payload;
    if (isReminderJob(job.job_type)) {
      const title =
        job.job_type === 'booking_reminder_24h'
          ? forMaster
            ? 'Напоминание: завтра у вас запись'
            : 'Напоминание: завтра запись'
          : forMaster
            ? 'Напоминание: через час у вас запись'
            : 'Напоминание: через час запись';
      payload = {
        type: notifyType,
        title,
        body: `${ctx.serviceTitle}`,
        telegramHtml: buildReminderTelegramHtml(ctx, job, forMaster),
        telegramReplyMarkup: (forMaster
          ? masterBookingTelegramKeyboard(ctx)
          : clientBookingTelegramKeyboard(ctx, { allowCancel: true })) as Record<string, unknown>,
        relatedEntityType: 'appointment' as const,
        relatedEntityId: job.appointment_id,
      };
    } else if (job.job_type === 'booking_client_confirmed') {
      const p = clientBookingConfirmed(ctx);
      payload = {
        ...p,
        type: notifyType,
        telegramReplyMarkup: clientBookingTelegramKeyboard(ctx, { allowCancel: true }),
        relatedEntityType: 'appointment' as const,
        relatedEntityId: job.appointment_id,
      };
    } else if (job.job_type === 'booking_master_new') {
      const p = masterBookingRequestCreated(ctx);
      payload = {
        ...p,
        type: notifyType,
        telegramReplyMarkup: masterBookingTelegramKeyboard(ctx),
        relatedEntityType: 'appointment' as const,
        relatedEntityId: job.appointment_id,
      };
    } else {
      const p = clientBookingRequestCreated(ctx);
      payload = {
        ...p,
        type: notifyType,
        telegramReplyMarkup: clientBookingTelegramKeyboard(ctx, { allowCancel: true }),
        relatedEntityType: 'appointment' as const,
        relatedEntityId: job.appointment_id,
      };
    }

    const html = payload.telegramHtml?.trim();
    if (html) {
      await sendNotificationToProfile(
        job.recipient_user_id,
        html,
        payload.telegramReplyMarkup,
      );
    }
    return { status: 'sent' };
  }

  return { status: 'skipped', reason: 'UNKNOWN_CHANNEL' };
}
