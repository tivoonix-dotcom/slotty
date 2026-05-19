import { notifyUser } from '../notifications/notifyUser.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';
import { fetchAppointmentNotifyContext } from './appointmentNotifyContext.js';

function formatWhen(ctx: AppointmentNotifyContext): { date: string; time: string; plain: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { date, time, plain: `${date}, ${time}` };
}

function voucherLine(ctx: AppointmentNotifyContext, html: boolean): string {
  if (!ctx.voucherNumber) return '';
  const v = html ? escapeTelegramHtml(ctx.voucherNumber) : ctx.voucherNumber;
  return html ? `\nНомер записи: <code>${v}</code>` : `\nНомер записи: ${v}`;
}

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

/** Клиент успешно записался. */
export async function notifyClientBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const { date, time, plain } = formatWhen(ctx);
  const svc = ctx.serviceTitle;
  const master = ctx.masterName;

  await notifyUser({
    userId: ctx.clientId,
    type: 'appointment_confirmed',
    title: 'Запись оформлена',
    body: `${svc} — ${plain}. Мастер: ${master}.${ctx.voucherNumber ? ` Номер: ${ctx.voucherNumber}.` : ''}`,
    ...related(ctx),
    telegramHtml:
      `<b>Запись оформлена</b>\n` +
      `Услуга: ${escapeTelegramHtml(svc)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Мастер: ${escapeTelegramHtml(master)}` +
      voucherLine(ctx, true),
  });
}

/** Мастер подтвердил запись. */
export async function notifyClientBookingConfirmed(ctx: AppointmentNotifyContext): Promise<void> {
  const { date, time, plain } = formatWhen(ctx);

  await notifyUser({
    userId: ctx.clientId,
    type: 'appointment_confirmed',
    title: 'Запись подтверждена',
    body: `Мастер ${ctx.masterName} подтвердил запись: ${ctx.serviceTitle} — ${plain}.`,
    ...related(ctx),
    telegramHtml:
      `<b>Запись подтверждена</b>\n` +
      `Мастер ${escapeTelegramHtml(ctx.masterName)} подтвердил вашу запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}` +
      voucherLine(ctx, true),
  });
}

/** Мастер отменил запись. */
export async function notifyClientBookingCancelledByMaster(ctx: AppointmentNotifyContext): Promise<void> {
  const { plain } = formatWhen(ctx);

  await notifyUser({
    userId: ctx.clientId,
    type: 'appointment_cancelled',
    title: 'Запись отменена мастером',
    body: `Мастер ${ctx.masterName} отменил запись: ${ctx.serviceTitle} (${plain}). Выберите другое время или мастера.`,
    ...related(ctx),
    telegramHtml:
      `<b>Запись отменена</b>\n` +
      `Мастер ${escapeTelegramHtml(ctx.masterName)} отменил запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Было: ${escapeTelegramHtml(plain)}`,
  });
}

/** Визит завершён — предложение оставить отзыв. */
export async function notifyClientBookingCompleted(ctx: AppointmentNotifyContext): Promise<void> {
  const { plain } = formatWhen(ctx);

  await notifyUser({
    userId: ctx.clientId,
    type: 'review_request',
    title: 'Визит завершён',
    body: `Спасибо за визит к ${ctx.masterName} (${ctx.serviceTitle}, ${plain}). Оставьте отзыв в профиле — это поможет другим клиентам.`,
    ...related(ctx),
    telegramHtml:
      `<b>Визит завершён</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}\n\n` +
      `Оставьте отзыв в приложении SLOTTY — это займёт пару минут.`,
  });
}

/** Клиент сам отменил запись. */
export async function notifyClientBookingCancelledBySelf(ctx: AppointmentNotifyContext): Promise<void> {
  const { plain } = formatWhen(ctx);

  await notifyUser({
    userId: ctx.clientId,
    type: 'appointment_cancelled',
    title: 'Вы отменили запись',
    body: `Отменена запись: ${ctx.serviceTitle} — ${plain}, мастер ${ctx.masterName}.`,
    ...related(ctx),
    telegramHtml:
      `<b>Запись отменена</b>\n` +
      `Вы отменили запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Было: ${escapeTelegramHtml(plain)}`,
  });
}

export async function notifyClientByAppointmentId(
  appointmentId: string,
  kind: 'confirmed' | 'cancelled_by_master' | 'completed' | 'cancelled_by_self',
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
    default:
      break;
  }
}
