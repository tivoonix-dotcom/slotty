import { escapeTelegramHtml } from '../../telegram/telegram.service.js';
import { formatAppointmentDateTime } from '../../telegram/formatAppointmentDateTime.js';
import type { AppointmentNotifyContext } from '../../appointments/appointmentNotifyContext.js';
import type { NotificationType } from '../notificationsInsert.js';

export type AppointmentNotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  telegramHtml?: string;
};

function formatWhen(ctx: AppointmentNotifyContext): { date: string; time: string; plain: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { date, time, plain: `${date}, ${time}` };
}

function voucherFooter(ctx: AppointmentNotifyContext, html: boolean): string {
  if (!ctx.voucherNumber) return '';
  const v = html ? escapeTelegramHtml(ctx.voucherNumber) : ctx.voucherNumber;
  return html
    ? `\n\n<i>№ ${v}</i>`
    : `\n\n№ ${v}`;
}

function clientContactTelegramLine(ctx: AppointmentNotifyContext): string {
  if (ctx.clientPhone) {
    return `\nТелефон: ${escapeTelegramHtml(ctx.clientPhone)}`;
  }
  return '';
}

/** Клиент отправил заявку (pending). */
export function clientBookingRequestCreated(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time } = formatWhen(ctx);

  return {
    type: 'appointment_pending',
    title: 'Заявка отправлена',
    body: 'Заявка отправлена мастеру. Мы уведомим вас после подтверждения.',
    telegramHtml:
      `<b>📩 Заявка отправлена</b>\n\n` +
      `Вы записались на:\n` +
      `<b>${escapeTelegramHtml(ctx.serviceTitle)}</b>\n\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}` +
      voucherFooter(ctx, true) +
      `\n\nМы напомним, когда мастер подтвердит запись.`,
  };
}

/** Мастеру: новая заявка. */
export function masterBookingRequestCreated(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time, plain } = formatWhen(ctx);

  return {
    type: 'appointment_new',
    title: 'Новая заявка',
    body: `Новая заявка: ${ctx.clientName}, ${ctx.serviceTitle}, ${plain}. Примите или отклоните.`,
    telegramHtml:
      `<b>🔔 Новая запись</b>\n\n` +
      `Клиент: <b>${escapeTelegramHtml(ctx.clientName)}</b>` +
      clientContactTelegramLine(ctx) +
      `\nУслуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingConfirmed(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { date, time } = formatWhen(ctx);

  return {
    type: 'appointment_confirmed',
    title: 'Запись подтверждена',
    body: 'Запись подтверждена. Мастер ждёт вас.',
    telegramHtml:
      `<b>✅ Запись подтверждена</b>\n\n` +
      `Вы записаны на:\n` +
      `<b>${escapeTelegramHtml(ctx.serviceTitle)}</b>\n\n` +
      `Дата: ${escapeTelegramHtml(date)}\n` +
      `Время: ${escapeTelegramHtml(time)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingCancelledByMaster(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Запись отменена мастером',
    body: `Мастер ${ctx.masterName} отменил запись: ${ctx.serviceTitle} (${plain}).`,
    telegramHtml:
      `<b>Запись отменена</b>\n\n` +
      `Мастер ${escapeTelegramHtml(ctx.masterName)} отменил запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Было: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingCompleted(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'review_request',
    title: 'Визит завершён',
    body: 'Визит завершён. Оставьте отзыв о мастере.',
    telegramHtml:
      `<b>Визит завершён</b>\n\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true) +
      `\n\nОставьте отзыв в SLOTTY — это займёт пару минут.`,
  };
}

export function clientBookingNoShow(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Неявка на запись',
    body: `Вы не пришли на запись: ${ctx.serviceTitle} — ${plain}, мастер ${ctx.masterName}.`,
    telegramHtml:
      `<b>Неявка на запись</b>\n\n` +
      `Запись отмечена как неявка.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Было: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingCancelledBySelf(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);

  return {
    type: 'appointment_cancelled',
    title: 'Вы отменили запись',
    body: `Отменена запись: ${ctx.serviceTitle} — ${plain}, мастер ${ctx.masterName}.`,
    telegramHtml:
      `<b>Запись отменена</b>\n\n` +
      `Вы отменили запись.\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Было: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingMasterMarkedCompleted(
  ctx: AppointmentNotifyContext,
): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  return {
    type: 'appointment_confirmed',
    title: 'Подтвердите выполнение услуги',
    body: `Мастер ${ctx.masterName} отметил, что услуга выполнена (${ctx.serviceTitle}, ${plain}). Подтвердите или сообщите о проблеме.`,
    telegramHtml:
      `<b>Мастер отметил выполнение</b>\n\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Мастер: ${escapeTelegramHtml(ctx.masterName)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true) +
      `\n\nПодтвердите, если всё прошло хорошо, или сообщите о проблеме в карточке записи.`,
  };
}

export function clientBookingDisputedAck(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  return {
    type: 'system',
    title: 'Обращение принято',
    body: 'Мы получили ваше обращение. Администратор рассмотрит ситуацию.',
    telegramHtml:
      `<b>Обращение принято</b>\n\n` +
      `Запись ${escapeTelegramHtml(ctx.voucherNumber ?? '')} на рассмотрении.`,
  };
}

export function clientBookingDisputedByMaster(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  return {
    type: 'system',
    title: 'Мастер сообщил о проблеме',
    body: `Мастер ${ctx.masterName} открыл обращение по записи. Мы свяжемся с вами при необходимости.`,
    telegramHtml: `<b>Обращение мастера</b>\n\nМастер: ${escapeTelegramHtml(ctx.masterName)}`,
  };
}

export function masterBookingCompleted(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  const body = [
    `Клиент: ${ctx.clientName}`,
    ctx.clientPhone ? `Телефон: ${ctx.clientPhone}` : null,
    `Услуга: ${ctx.serviceTitle}`,
    `Когда: ${plain}`,
    ctx.voucherNumber ? `Номер: ${ctx.voucherNumber}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  return {
    type: 'appointment_confirmed',
    title: 'Запись завершена',
    body,
    telegramHtml:
      `<b>Запись завершена</b>\n\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function masterBookingClientConfirmed(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  return {
    type: 'appointment_confirmed',
    title: 'Клиент подтвердил выполнение',
    body: `${ctx.clientName} подтвердил, что услуга «${ctx.serviceTitle}» выполнена.`,
    telegramHtml:
      `<b>Клиент подтвердил выполнение</b>\n\n` +
      `Клиент: <b>${escapeTelegramHtml(ctx.clientName)}</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}` +
      voucherFooter(ctx, true),
  };
}

export function masterBookingClientSignal(
  ctx: AppointmentNotifyContext,
  kind: 'client_on_the_way' | 'client_running_late' | 'client_reported_arrived',
  extras?: { lateMinutes?: number | null; comment?: string | null },
): AppointmentNotificationPayload {
  const titles = {
    client_on_the_way: 'Клиент в пути',
    client_running_late: 'Клиент опаздывает',
    client_reported_arrived: 'Клиент на месте',
  };
  let body: string;
  if (kind === 'client_running_late' && extras?.lateMinutes) {
    body = `${ctx.clientName} опаздывает на ${extras.lateMinutes} минут.`;
  } else {
    const bodies = {
      client_on_the_way: `${ctx.clientName} сообщил, что едет на запись.`,
      client_running_late: `${ctx.clientName} сообщил об опоздании.`,
      client_reported_arrived: `${ctx.clientName} сообщил, что на месте. Подтвердите приход.`,
    };
    body = bodies[kind];
  }
  if (extras?.comment?.trim()) {
    body += ` Комментарий: ${extras.comment.trim()}`;
  }
  return {
    type: 'appointment_new',
    title: titles[kind],
    body,
    telegramHtml: `<b>${escapeTelegramHtml(titles[kind])}</b>\n\n${escapeTelegramHtml(body)}${voucherFooter(ctx, true)}`,
  };
}

export function masterBookingClientComment(
  ctx: AppointmentNotifyContext,
  comment?: string | null,
): AppointmentNotificationPayload {
  const text = comment?.trim() || 'без текста';
  const body = `${ctx.clientName} оставил комментарий к записи: ${text}`;
  return {
    type: 'appointment_new',
    title: 'Комментарий клиента',
    body,
    telegramHtml: `<b>Комментарий клиента</b>\n\n${escapeTelegramHtml(body)}${voucherFooter(ctx, true)}`,
  };
}

export function masterBookingDisputedByClient(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  return {
    type: 'system',
    title: 'Клиент сообщил о проблеме',
    body: `${ctx.clientName} открыл обращение по записи ${ctx.serviceTitle}.`,
    telegramHtml:
      `<b>Жалоба клиента</b>\n\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}` +
      voucherFooter(ctx, true),
  };
}

export function clientBookingExpired(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  return {
    type: 'appointment_cancelled',
    title: 'Заявка истекла',
    body: 'Мастер не успел подтвердить заявку. Выберите другое время.',
    telegramHtml:
      `<b>Заявка истекла</b>\n\n` +
      `Мастер не успел подтвердить заявку на «${escapeTelegramHtml(ctx.serviceTitle)}».\n` +
      `Выберите другое время у мастера ${escapeTelegramHtml(ctx.masterName)}.` +
      voucherFooter(ctx, true),
  };
}

export function masterBookingPendingReminder(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  return {
    type: 'appointment_new',
    title: 'Заявка ждёт решения',
    body: `Заявка всё ещё ждёт решения: ${ctx.clientName}, ${ctx.serviceTitle}, ${plain}. Подтвердите или отклоните её.`,
    telegramHtml:
      `<b>Заявка ждёт решения</b>\n\n` +
      `Клиент: <b>${escapeTelegramHtml(ctx.clientName)}</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function masterBookingPendingDeadline(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  return {
    type: 'appointment_new',
    title: 'Заявка скоро истечёт',
    body: `Заявка скоро истечёт, если вы её не подтвердите: ${ctx.clientName}, ${ctx.serviceTitle}, ${plain}.`,
    telegramHtml:
      `<b>Заявка скоро истечёт</b>\n\n` +
      `Подтвердите или отклоните заявку, иначе она будет отменена автоматически.\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function masterBookingExpired(ctx: AppointmentNotifyContext): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  return {
    type: 'appointment_cancelled',
    title: 'Заявка истекла',
    body: `Заявка истекла: ${ctx.clientName}, ${ctx.serviceTitle}, ${plain}. Вы не успели подтвердить её — слот снова свободен.`,
    telegramHtml:
      `<b>Заявка истекла</b>\n\n` +
      `Вы не успели подтвердить заявку — она отменена автоматически.\n` +
      `Клиент: ${escapeTelegramHtml(ctx.clientName)}\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Когда: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}

export function masterClientCancelledBooking(
  ctx: AppointmentNotifyContext,
): AppointmentNotificationPayload {
  const { plain } = formatWhen(ctx);
  const body = [
    `Клиент: ${ctx.clientName}`,
    ctx.clientPhone ? `Телефон: ${ctx.clientPhone}` : null,
    `Услуга: ${ctx.serviceTitle}`,
    `Когда: ${plain}`,
    ctx.voucherNumber ? `Номер: ${ctx.voucherNumber}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    type: 'appointment_cancelled',
    title: 'Клиент отменил запись',
    body,
    telegramHtml:
      `<b>Клиент отменил запись</b>\n\n` +
      `Клиент: <b>${escapeTelegramHtml(ctx.clientName)}</b>\n` +
      `Услуга: ${escapeTelegramHtml(ctx.serviceTitle)}\n` +
      `Было: ${escapeTelegramHtml(plain)}` +
      voucherFooter(ctx, true),
  };
}
