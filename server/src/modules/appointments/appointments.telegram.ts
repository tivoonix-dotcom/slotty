import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import { sendNotificationToProfile } from '../telegram/telegramProfileNotifications.js';

export type AppointmentCreatedTelegramPayload = {
  clientId: string;
  masterId: string;
  serviceTitle: string;
  startsAt: string;
  voucherNumber: string;
  clientDisplayName: string;
  masterDisplayName: string;
};

function logNotifyError(context: string, err: unknown): void {
  console.warn(`[telegram] ${context}:`, err instanceof Error ? err.message : err);
}

export async function notifyAppointmentCreatedTelegram(payload: AppointmentCreatedTelegramPayload): Promise<void> {
  try {
    const { date, time } = formatAppointmentDateTime(payload.startsAt);
    const svc = escapeTelegramHtml(payload.serviceTitle);
    const masterName = escapeTelegramHtml(payload.masterDisplayName);
    const clientName = escapeTelegramHtml(payload.clientDisplayName);
    const voucher = escapeTelegramHtml(payload.voucherNumber);

    const clientText =
      `Вы записались на <b>${svc}</b>\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Мастер: ${masterName}\n` +
      `Номер записи: <code>${voucher}</code>`;

    const masterText =
      `Новая запись\n` +
      `Клиент: ${clientName}\n` +
      `Услуга: ${svc}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Номер записи: <code>${voucher}</code>`;

    const [cRes, mRes] = await Promise.all([
      sendNotificationToProfile(payload.clientId, clientText),
      sendNotificationToProfile(payload.masterId, masterText),
    ]);

    for (const [label, res] of [
      ['client', cRes],
      ['master', mRes],
    ] as const) {
      if (res.status === 'error') {
        logNotifyError(`notifyAppointmentCreatedTelegram ${label}`, res.message);
      }
    }
  } catch (e) {
    logNotifyError('notifyAppointmentCreatedTelegram', e);
  }
}

export async function notifyAppointmentConfirmedTelegram(clientId: string): Promise<void> {
  try {
    const res = await sendNotificationToProfile(clientId, 'Ваша запись подтверждена');
    if (res.status === 'error') {
      logNotifyError('notifyAppointmentConfirmedTelegram', res.message);
    }
  } catch (e) {
    logNotifyError('notifyAppointmentConfirmedTelegram', e);
  }
}

export async function notifyAppointmentCompletedTelegram(clientId: string): Promise<void> {
  try {
    const res = await sendNotificationToProfile(clientId, 'Визит завершён. Вы можете оставить отзыв.');
    if (res.status === 'error') {
      logNotifyError('notifyAppointmentCompletedTelegram', res.message);
    }
  } catch (e) {
    logNotifyError('notifyAppointmentCompletedTelegram', e);
  }
}

export async function notifyAppointmentCancelledByMasterTelegram(clientId: string): Promise<void> {
  try {
    const res = await sendNotificationToProfile(clientId, 'Мастер отменил запись');
    if (res.status === 'error') {
      logNotifyError('notifyAppointmentCancelledByMasterTelegram', res.message);
    }
  } catch (e) {
    logNotifyError('notifyAppointmentCancelledByMasterTelegram', e);
  }
}

export async function notifyAppointmentCancelledByClientTelegram(masterId: string): Promise<void> {
  try {
    const res = await sendNotificationToProfile(masterId, 'Клиент отменил запись');
    if (res.status === 'error') {
      logNotifyError('notifyAppointmentCancelledByClientTelegram', res.message);
    }
  } catch (e) {
    logNotifyError('notifyAppointmentCancelledByClientTelegram', e);
  }
}
