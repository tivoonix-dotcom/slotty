import { notifyUser } from '../notifications/notifyUser.js';
import { escapeTelegramHtml } from '../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

function formatWhen(ctx: AppointmentNotifyContext): { date: string; time: string; plain: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { date, time, plain: `${date}, ${time}` };
}

function voucherLine(ctx: AppointmentNotifyContext, html: boolean): string {
  if (!ctx.voucherNumber) return '';
  const v = html ? escapeTelegramHtml(ctx.voucherNumber) : ctx.voucherNumber;
  return html ? `\nНомер записи: <code>${v}</code>` : `\nНомер: ${v}`;
}

const related = (ctx: AppointmentNotifyContext) => ({
  relatedEntityType: 'appointment' as const,
  relatedEntityId: ctx.appointmentId,
});

/** Мастеру: новая запись от клиента. */
export async function notifyMasterBookingCreated(ctx: AppointmentNotifyContext): Promise<void> {
  const { date, time, plain } = formatWhen(ctx);

  await notifyUser({
    userId: ctx.masterId,
    type: 'appointment_new',
    title: 'Новая запись',
    body: `${ctx.clientName} записался: ${ctx.serviceTitle} — ${plain}.${ctx.voucherNumber ? ` Номер: ${ctx.voucherNumber}.` : ''}`,
    ...related(ctx),
    telegramHtml:
      `<b>Новая запись</b>\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}` +
      voucherLine(ctx, true),
  });
}
