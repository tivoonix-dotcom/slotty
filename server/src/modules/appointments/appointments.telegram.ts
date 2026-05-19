import { notifyUser } from '../notifications/notifyUser.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import { notifyClientBookingCreated } from './appointments.clientNotifications.js';
import { notifyMasterBookingCreated } from './appointments.masterNotifications.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

export type AppointmentCreatedPayload = {
  appointmentId: string;
  clientId: string;
  masterId: string;
  serviceTitle: string;
  startsAt: string;
  voucherNumber: string;
  clientDisplayName: string;
  masterDisplayName: string;
};

function logNotifyError(context: string, err: unknown): void {
  console.warn(`[notify] ${context}:`, err instanceof Error ? err.message : err);
}

function toContext(payload: AppointmentCreatedPayload): AppointmentNotifyContext {
  return {
    appointmentId: payload.appointmentId,
    clientId: payload.clientId,
    masterId: payload.masterId,
    serviceTitle: payload.serviceTitle,
    startsAt: payload.startsAt,
    voucherNumber: payload.voucherNumber,
    clientName: payload.clientDisplayName,
    masterName: payload.masterDisplayName,
  };
}

/** После новой записи: клиенту и мастеру (in-app + Telegram). */
export async function notifyAppointmentCreated(payload: AppointmentCreatedPayload): Promise<void> {
  try {
    const ctx = toContext(payload);
    await Promise.all([notifyClientBookingCreated(ctx), notifyMasterBookingCreated(ctx)]);
  } catch (e) {
    logNotifyError('notifyAppointmentCreated', e);
  }
}

/** Мастеру: клиент отменил запись (in-app + Telegram). */
export async function notifyMasterClientCancelledBooking(
  masterId: string,
  appointmentId: string,
): Promise<void> {
  try {
    const ctx = await fetchAppointmentNotifyContext(appointmentId);
    if (!ctx) return;

    const w = formatAppointmentDateTime(ctx.startsAt);
    const plain = `${w.date}, ${w.time}`;

    await notifyUser({
      userId: masterId,
      type: 'appointment_cancelled',
      title: 'Клиент отменил запись',
      body: `${ctx.clientName} отменил запись: ${ctx.serviceTitle} (${plain}).`,
      relatedEntityType: 'appointment',
      relatedEntityId: appointmentId,
      telegramHtml:
        `<b>Клиент отменил запись</b>\n` +
        `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
        `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
        `Было: ${escapeTelegramHtml(plain)}`,
    });
  } catch (e) {
    logNotifyError('notifyMasterClientCancelledBooking', e);
  }
}
