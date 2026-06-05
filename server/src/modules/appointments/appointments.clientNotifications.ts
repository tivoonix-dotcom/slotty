import { notifyUser } from '../notifications/notifyUser.js';
import { clientBookingTelegramKeyboard } from '../notifications/telegramAppointmentKeyboard.js';
import {
  clientBookingCancelledByMaster,
  clientBookingCancelledBySelf,
  clientBookingCompleted,
  clientBookingConfirmed,
  clientBookingExpired,
  clientBookingDisputedAck,
  clientBookingDisputedByMaster,
  clientBookingNoShow,
  clientBookingRequestCreated,
} from '../notifications/templates/appointmentNotificationTemplates.js';
import {
  clientBookingCancelledByMasterEmail,
  clientBookingCancelledBySelfEmail,
  clientBookingCompletedEmail,
  clientBookingConfirmedEmail,
  clientBookingCreatedEmail,
} from './appointmentNotifyEmail.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

function clientMarkup(ctx: AppointmentNotifyContext, allowCancel = false) {
  return clientBookingTelegramKeyboard(ctx, { allowCancel }) as unknown as Record<string, unknown>;
}

/** Клиент отправил заявку на запись (pending). */
export async function notifyClientBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingRequestCreated(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    bookingCode: ctx.voucherNumber,
    telegramReplyMarkup: clientMarkup(ctx, true),
    email: clientBookingCreatedEmail(ctx),
  });
}

/** Мастер подтвердил запись. */
export async function notifyClientBookingConfirmed(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingConfirmed(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx, true),
    bookingCode: ctx.voucherNumber,
    email: clientBookingConfirmedEmail(ctx),
  });
}

/** Мастер отменил запись. */
export async function notifyClientBookingCancelledByMaster(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCancelledByMaster(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    email: clientBookingCancelledByMasterEmail(ctx),
  });
}

/** Визит завершён — предложение оставить отзыв. */
export async function notifyClientBookingCompleted(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCompleted(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    email: clientBookingCompletedEmail(ctx),
  });
}

export async function notifyClientBookingExpired(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingExpired(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    bookingCode: ctx.voucherNumber,
  });
}

/** @deprecated Двустороннее завершение отключено — мастер завершает сразу в completed. */
export async function notifyClientMasterMarkedCompleted(ctx: AppointmentNotifyContext): Promise<void> {
  await notifyClientBookingCompleted(ctx);
}

export async function notifyClientDisputedAck(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingDisputedAck(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    bookingCode: ctx.voucherNumber,
  });
}

export async function notifyClientDisputedByMaster(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingDisputedByMaster(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    bookingCode: ctx.voucherNumber,
  });
}

/** Неявка клиента на подтверждённую запись. */
export async function notifyClientBookingNoShow(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingNoShow(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    bookingCode: ctx.voucherNumber,
  });
}

/** Клиент сам отменил запись. */
export async function notifyClientBookingCancelledBySelf(ctx: AppointmentNotifyContext): Promise<void> {
  const payload = clientBookingCancelledBySelf(ctx);
  await notifyUser({
    userId: ctx.clientId,
    ...payload,
    ...related(ctx),
    telegramReplyMarkup: clientMarkup(ctx),
    email: clientBookingCancelledBySelfEmail(ctx),
  });
}

export async function notifyClientByAppointmentId(
  appointmentId: string,
  kind:
    | 'confirmed'
    | 'cancelled_by_master'
    | 'completed'
    | 'cancelled_by_self'
    | 'no_show'
    | 'master_marked_completed'
    | 'disputed_ack'
    | 'disputed_by_master'
    | 'expired',
): Promise<void> {
  const ctx = await fetchAppointmentNotifyContext(appointmentId);
  if (!ctx) return;

  switch (kind) {
    case 'confirmed':
      await notifyClientBookingConfirmed(ctx);
      break;
    case 'cancelled_by_master':
      await notifyClientBookingCancelledByMaster(ctx);
      break;
    case 'completed':
      await notifyClientBookingCompleted(ctx);
      break;
    case 'cancelled_by_self':
      await notifyClientBookingCancelledBySelf(ctx);
      break;
    case 'no_show':
      await notifyClientBookingNoShow(ctx);
      break;
    case 'master_marked_completed':
      await notifyClientMasterMarkedCompleted(ctx);
      break;
    case 'disputed_ack':
      await notifyClientDisputedAck(ctx);
      break;
    case 'disputed_by_master':
      await notifyClientDisputedByMaster(ctx);
      break;
    case 'expired':
      await notifyClientBookingExpired(ctx);
      break;
    default:
      break;
  }
}
