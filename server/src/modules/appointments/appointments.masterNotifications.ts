import { notifyUser } from '../notifications/notifyUser.js';
import { buildBookingNotificationMetadataForAppointment } from './appointmentNotifySnapshot.js';
import {
  masterBookingClientConfirmed,
  masterBookingClientComment,
  masterBookingClientSignal,
  masterBookingCompleted,
  masterBookingDisputedByClient,
  masterBookingExpired,
  masterBookingRequestCreated,
} from '../notifications/templates/appointmentNotificationTemplates.js';
import { masterBookingTelegramKeyboard } from '../notifications/telegramAppointmentKeyboard.js';
import { masterBookingCreatedEmail, masterBookingExpiredEmail } from './appointmentNotifyEmail.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';
import type { MasterNotificationEventKey } from '../notifications/masterNotificationPreferences.state.js';
import type { MasterImmediateNotifyKind } from '../notifications/masterNotificationPreferences.deliver.js';
import { mapMasterImmediateNotifyKind } from '../notifications/masterNotificationPreferences.deliver.js';

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

/** Мастеру: заявка истекла без подтверждения. */
export async function notifyMasterBookingExpired(appointmentId: string): Promise<void> {
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) return;

  const payload = masterBookingExpired(ctx);
  const metadata = await buildBookingNotificationMetadataForAppointment(ctx.appointmentId);
  await notifyUser({
    userId: ctx.masterId,
    audience: 'master',
    ...payload,
    relatedEntityType: 'appointment',
    relatedEntityId: ctx.appointmentId,
    metadata,
    bookingCode: ctx.voucherNumber,
    masterPreferenceEvent: 'cancel',
    email: masterBookingExpiredEmail(ctx),
  });
}

/** Мастеру: новая заявка от клиента. */
export async function notifyMasterBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = masterBookingRequestCreated(ctx);
  const metadata = await buildBookingNotificationMetadataForAppointment(ctx.appointmentId);
  await notifyUser({
    userId: ctx.masterId,
    audience: 'master',
    ...payload,
    ...related(ctx),
    metadata,
    telegramReplyMarkup: masterBookingTelegramKeyboard(ctx) as unknown as Record<string, unknown>,
    bookingCode: ctx.voucherNumber,
    email: masterBookingCreatedEmail(ctx),
    masterPreferenceEvent: 'new_booking',
  });
}

export type MasterNotifyExtras = {
  lateMinutes?: number | null;
  comment?: string | null;
};

export async function notifyMasterByAppointmentId(
  appointmentId: string,
  kind:
    | 'completed'
    | 'client_confirmed_completed'
    | 'client_on_the_way'
    | 'client_running_late'
    | 'client_reported_arrived'
    | 'disputed_by_client'
    | 'client_comment',
  extras?: MasterNotifyExtras,
): Promise<void> {
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) return;

  const related = {
    relatedEntityType: 'appointment' as const,
    relatedEntityId: ctx.appointmentId,
  };
  const markup = masterBookingTelegramKeyboard(ctx) as unknown as Record<string, unknown>;

  const kindToImmediate: Partial<Record<typeof kind, MasterImmediateNotifyKind>> = {
    completed: 'booking_completed',
    client_confirmed_completed: 'booking_completed',
    client_on_the_way: 'client_on_the_way',
    client_running_late: 'client_running_late',
    client_reported_arrived: 'client_arrived',
    client_comment: 'client_comment',
    disputed_by_client: 'dispute_created',
  };
  const masterPreferenceEvent: MasterNotificationEventKey | undefined = (() => {
    const immediate = kindToImmediate[kind];
    return immediate ? mapMasterImmediateNotifyKind(immediate) ?? undefined : undefined;
  })();

  const metadata = await buildBookingNotificationMetadataForAppointment(ctx.appointmentId);

  switch (kind) {
    case 'completed': {
      const payload = masterBookingCompleted(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        metadata,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
        masterPreferenceEvent,
      });
      break;
    }
    case 'client_confirmed_completed': {
      const payload = masterBookingClientConfirmed(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        metadata,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
        masterPreferenceEvent,
      });
      break;
    }
    case 'client_on_the_way':
    case 'client_running_late':
    case 'client_reported_arrived': {
      const payload = masterBookingClientSignal(ctx, kind, extras);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        metadata,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
        masterPreferenceEvent,
      });
      break;
    }
    case 'client_comment': {
      const payload = masterBookingClientComment(ctx, extras?.comment);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        metadata,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
        masterPreferenceEvent,
      });
      break;
    }
    case 'disputed_by_client': {
      const payload = masterBookingDisputedByClient(ctx);
      await notifyUser({
        userId: ctx.masterId,
        ...payload,
        ...related,
        metadata,
        bookingCode: ctx.voucherNumber,
        telegramReplyMarkup: markup,
        masterPreferenceEvent,
      });
      break;
    }
    default:
      break;
  }
}
