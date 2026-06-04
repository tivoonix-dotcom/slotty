import { escapeTelegramHtml } from '../../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../../telegram/formatAppointmentDateTime.js';
import type { NotificationType } from '../notificationsInsert.js';

export type BillingNotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  telegramHtml?: string;
};

export function proPaymentSubmittedForMaster(): BillingNotificationPayload {
  return {
    type: 'billing',
    title: 'Заявка на Pro',
    body: 'Заявка на Pro отправлена на проверку. Мы активируем тариф после подтверждения оплаты.',
    telegramHtml:
      `<b>Заявка на Pro</b>\n` +
      'Заявка отправлена на проверку. Мы активируем тариф после подтверждения оплаты.',
  };
}

export function proPaymentSubmittedForAdmin(masterName: string): BillingNotificationPayload {
  const name = escapeTelegramHtml(masterName.trim() || 'мастер');
  return {
    type: 'billing',
    title: 'Новая заявка на Pro',
    body: `Новая заявка на Pro от мастера ${masterName.trim() || 'мастер'}. Проверьте оплату в админке.`,
    telegramHtml:
      `<b>Новая заявка на Pro</b>\n` + `Мастер: ${name}\n` + 'Проверьте оплату в разделе биллинга админки.',
  };
}

export function proPaymentApprovedForMaster(proExpiresAt: Date | string): BillingNotificationPayload {
  const { date } = formatAppointmentDateTime(proExpiresAt);
  return {
    type: 'billing',
    title: 'Pro активирован',
    body: `Pro активирован до ${date}. Теперь доступны расширенные возможности тарифа.`,
    telegramHtml:
      `<b>Pro активирован</b>\n` +
      `Тариф действует до ${escapeTelegramHtml(date)}.\n` +
      'Расширенные возможности уже доступны в кабинете.',
  };
}

export function proPaymentRejectedForMaster(reason: string): BillingNotificationPayload {
  const r = reason.trim();
  return {
    type: 'billing',
    title: 'Заявка на Pro отклонена',
    body: `Заявка на Pro отклонена. Причина: ${r}`,
    telegramHtml:
      `<b>Заявка на Pro отклонена</b>\n` + `Причина: ${escapeTelegramHtml(r)}`,
  };
}

function formatBillingDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const { date } = formatAppointmentDateTime(value);
  return date;
}

export function subscriptionActivatedNotification(nextChargeAt: Date | string | null): BillingNotificationPayload {
  const next = formatBillingDate(nextChargeAt);
  return {
    type: 'billing',
    title: 'Master Pro активирован',
    body: `Тариф Master Pro активен. Следующее списание: ${next}.`,
    telegramHtml:
      `<b>Master Pro активирован</b>\n` + `Следующее списание: ${escapeTelegramHtml(next)}.`,
  };
}

export function subscriptionRenewedNotification(periodEnd: Date | string | null): BillingNotificationPayload {
  const end = formatBillingDate(periodEnd);
  return {
    type: 'billing',
    title: 'Подписка Master Pro продлена',
    body: `Подписка продлена. Pro активен до ${end}.`,
    telegramHtml: `<b>Master Pro продлён</b>\n` + `Активен до ${escapeTelegramHtml(end)}.`,
  };
}

export function subscriptionRenewalReminderNotification(
  chargeAt: Date | string,
  amount: number,
): BillingNotificationPayload {
  const when = formatBillingDate(chargeAt);
  return {
    type: 'billing',
    title: 'Скоро продление Master Pro',
    body: `${amount} BYN будут списаны ${when}. Отменить автопродление можно в разделе «Тарифы».`,
    telegramHtml:
      `<b>Скоро продление Master Pro</b>\n` +
      `${escapeTelegramHtml(String(amount))} BYN — ${escapeTelegramHtml(when)}.`,
  };
}

export function subscriptionPaymentFailedNotification(): BillingNotificationPayload {
  return {
    type: 'billing',
    title: 'Не удалось продлить Master Pro',
    body: 'Платёж не прошёл. Обновите карту или повторите оплату в разделе «Тарифы».',
    telegramHtml:
      `<b>Не удалось продлить Master Pro</b>\n` +
      'Обновите карту или повторите оплату в кабинете.',
  };
}

export function subscriptionAutoRenewCanceledNotification(
  periodEnd: Date | string | null,
): BillingNotificationPayload {
  const end = formatBillingDate(periodEnd);
  return {
    type: 'billing',
    title: 'Автопродление отключено',
    body: `Pro будет доступен до ${end}. Следующего списания не будет.`,
    telegramHtml:
      `<b>Автопродление отключено</b>\n` + `Pro активен до ${escapeTelegramHtml(end)}.`,
  };
}

export function subscriptionAutoRenewResumedNotification(
  nextChargeAt: Date | string | null,
): BillingNotificationPayload {
  const next = formatBillingDate(nextChargeAt);
  return {
    type: 'billing',
    title: 'Автопродление включено',
    body: `Автопродление снова активно. Следующее списание: ${next}.`,
    telegramHtml:
      `<b>Автопродление включено</b>\n` + `Следующее списание: ${escapeTelegramHtml(next)}.`,
  };
}
