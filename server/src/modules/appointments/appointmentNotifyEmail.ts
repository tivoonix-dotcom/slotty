import type { NotifyUserEmail } from '../notifications/notifyUser.js';
import { formatAppointmentDateTime } from '../telegram/formatAppointmentDateTime.js';
import {
  buildBookingEmailLink,
  clientAppointmentsUrl,
  masterAdminAppointmentsUrl,
} from '../notifications/appointmentNotifyLinks.js';
import {
  buildBookingReceiptEmailHtml,
  type BookingReceiptEmailRow,
  type BookingReceiptStatusTone,
} from '../email/bookingReceiptEmailLayout.js';
import type { AppointmentNotifyContext } from './appointmentNotifyContext.js';

function whenRows(ctx: AppointmentNotifyContext): { when: string; date: string; time: string } {
  const { date, time } = formatAppointmentDateTime(ctx.startsAt);
  return { when: `${date}, ${time}`, date, time };
}

function clientCta(ctx: AppointmentNotifyContext): { label: string; url: string } {
  if (ctx.voucherNumber) {
    return {
      label: 'Открыть запись',
      url: buildBookingEmailLink('client', ctx.voucherNumber),
    };
  }
  return { label: 'Мои записи', url: clientAppointmentsUrl() };
}

function masterCta(ctx: AppointmentNotifyContext): { label: string; url: string } {
  return {
    label: 'К заявкам',
    url: masterAdminAppointmentsUrl({ focusAppointmentId: ctx.appointmentId }),
  };
}

function plainDetails(ctx: AppointmentNotifyContext, when: string): string {
  const lines = [
    `Мастер: ${ctx.masterName}`,
    `Услуга: ${ctx.serviceTitle}`,
    `Когда: ${when}`,
  ];
  if (ctx.voucherNumber) lines.push(`№ ${ctx.voucherNumber}`);
  return lines.join('\n');
}

function issuedSubtitle(suffix: string): string {
  const issuedAt = new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${suffix} · ${issuedAt}`;
}

function bookingEmail(params: {
  documentTitle: string;
  preview: string;
  receiptKind?: string;
  eyebrow: string;
  title: string;
  statusLabel: string;
  statusTone?: BookingReceiptStatusTone;
  subtitle: string;
  rows: BookingReceiptEmailRow[];
  ctaLabel: string;
  ctaUrl: string;
  voucherNumber?: string | null;
  footerNote?: string;
  heroTitle: string;
  heroHighlight: string;
  heroMeta: string;
  sectionTitle?: string;
  text: string;
}): NotifyUserEmail {
  return {
    subject: params.documentTitle,
    html: buildBookingReceiptEmailHtml({
      documentTitle: params.documentTitle,
      preview: params.preview,
      receiptKind: params.receiptKind,
      eyebrow: params.eyebrow,
      title: params.title,
      statusLabel: params.statusLabel,
      statusTone: params.statusTone,
      subtitle: params.subtitle,
      heroTitle: params.heroTitle,
      heroHighlight: params.heroHighlight,
      heroMeta: params.heroMeta,
      sectionTitle: params.sectionTitle,
      rows: params.rows,
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl,
      voucherNumber: params.voucherNumber,
      footerNote: params.footerNote,
    }),
    text: params.text,
  };
}

/** Клиент: заявка отправлена. */
export function clientBookingCreatedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const rows = [
    { label: 'Мастер', value: ctx.masterName },
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Когда', value: when },
  ];
  const text = `Заявка на запись отправлена.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Заявка на запись отправлена — SLOTTY',
    preview: 'Мастер получил вашу заявку и скоро подтвердит время.',
    eyebrow: 'Онлайн-запись',
    title: 'Заявка отправлена',
    statusLabel: 'Ожидает подтверждения',
    statusTone: 'pink',
    subtitle: issuedSubtitle(
      'Мастер получил вашу заявку. Когда он подтвердит время, придёт новое письмо и уведомление',
    ),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows,
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Клиент: мастер подтвердил запись. */
export function clientBookingConfirmedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const rows = [
    { label: 'Мастер', value: ctx.masterName },
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Когда', value: when },
  ];
  const text = `Запись подтверждена.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Ваша запись в SLOTTY подтверждена',
    preview: `${ctx.masterName} подтвердил(а) вашу запись.`,
    eyebrow: 'Онлайн-запись',
    title: 'Запись подтверждена',
    statusLabel: 'Подтверждено',
    statusTone: 'success',
    subtitle: issuedSubtitle('Напомним о визите в Telegram'),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows,
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    footerNote:
      'Если планы изменились, отмените запись заранее в приложении, чтобы освободить время мастера.',
    text,
  });
}

/** Клиент: мастер отменил. */
export function clientBookingCancelledByMasterEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Запись отменена мастером.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Запись отменена мастером — SLOTTY',
    preview: `${ctx.masterName} отменил(а) запись.`,
    eyebrow: 'Онлайн-запись',
    title: 'Запись отменена',
    statusLabel: 'Отменено',
    statusTone: 'neutral',
    subtitle: issuedSubtitle(`${ctx.masterName} отменил(а) запись. Вы можете выбрать другое время`),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows: [
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Было запланировано', value: when },
    ],
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Клиент: сам отменил. */
export function clientBookingCancelledBySelfEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Вы отменили запись.\n${plainDetails(ctx, when)}\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Запись отменена — SLOTTY',
    preview: 'Вы отменили запись.',
    eyebrow: 'Онлайн-запись',
    title: 'Запись отменена',
    statusLabel: 'Отменено',
    statusTone: 'neutral',
    subtitle: issuedSubtitle('Вы отменили запись. При необходимости можно записаться снова'),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows: [
      { label: 'Мастер', value: ctx.masterName },
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Было', value: when },
    ],
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Клиент: визит завершён. */
export function clientBookingCompletedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const text = `Визит завершён.\n${plainDetails(ctx, when)}\n\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Визит завершён — SLOTTY',
    preview: `Спасибо за визит к ${ctx.masterName}.`,
    eyebrow: 'Онлайн-запись',
    title: 'Спасибо за визит',
    statusLabel: 'Завершено',
    statusTone: 'success',
    subtitle: issuedSubtitle('Надеемся, вам понравился визит. Оставьте отзыв — это помогает другим клиентам'),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows: [
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Когда', value: when },
    ],
    ctaLabel: 'Оставить отзыв',
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Мастер: новая заявка. */
export function masterBookingCreatedEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const rows = [
    { label: 'Клиент', value: ctx.clientName },
    ...(ctx.clientPhone ? [{ label: 'Телефон', value: ctx.clientPhone }] : []),
    { label: 'Услуга', value: ctx.serviceTitle },
    { label: 'Когда', value: when },
  ];
  const text = `Новая заявка на запись.\nКлиент: ${ctx.clientName}\n${plainDetails(ctx, when)}\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Новая запись в SLOTTY',
    preview: 'Клиент записался онлайн — подтвердите или отклоните заявку.',
    receiptKind: 'Заявка',
    eyebrow: 'Кабинет мастера',
    title: 'Новая заявка на запись',
    statusLabel: 'Новая',
    statusTone: 'pink',
    subtitle: issuedSubtitle('Клиент записался онлайн. Подтвердите или отклоните заявку в кабинете'),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.clientName} · SLOTTY`,
    sectionTitle: 'Детали заявки',
    rows,
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Напоминание клиенту (1ч / 24ч). */
export function clientBookingReminderEmail(
  ctx: AppointmentNotifyContext,
  kind: 'booking_reminder_1h' | 'booking_reminder_24h',
): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = clientCta(ctx);
  const lead = kind === 'booking_reminder_24h' ? 'завтра' : 'через 1 час';
  const text = `Напоминание: запись ${lead}.\n${plainDetails(ctx, when)}\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Напоминание: запись — SLOTTY',
    preview: `Напоминание: ${lead} у вас запись в SLOTTY.`,
    eyebrow: 'Онлайн-запись',
    title: 'Напоминание о записи',
    statusLabel: 'Скоро',
    statusTone: 'warning',
    subtitle: issuedSubtitle(`Напоминание: ${lead} у вас запись в SLOTTY`),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.masterName} · SLOTTY`,
    rows: [
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Мастер', value: ctx.masterName },
      { label: 'Когда', value: when },
    ],
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Напоминание мастеру (1ч / 24ч). */
export function masterBookingReminderEmail(
  ctx: AppointmentNotifyContext,
  kind: 'booking_reminder_1h' | 'booking_reminder_24h',
): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const lead = kind === 'booking_reminder_24h' ? 'завтра' : 'через 1 час';
  const text = `Напоминание: запись ${lead}.\nКлиент: ${ctx.clientName}\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Напоминание: запись — SLOTTY',
    preview: `Через ${lead === 'завтра' ? 'сутки' : 'час'} у вас запись с клиентом.`,
    receiptKind: 'Напоминание',
    eyebrow: 'Кабинет мастера',
    title: 'Напоминание о записи',
    statusLabel: 'Скоро',
    statusTone: 'warning',
    subtitle: issuedSubtitle(`Через ${lead === 'завтра' ? 'сутки' : 'час'} у вас запись с клиентом`),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.clientName} · SLOTTY`,
    sectionTitle: 'Детали записи',
    rows: [
      { label: 'Клиент', value: ctx.clientName },
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Когда', value: when },
    ],
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}

/** Мастер: клиент отменил. */
export function masterClientCancelledEmail(ctx: AppointmentNotifyContext): NotifyUserEmail {
  const { when } = whenRows(ctx);
  const cta = masterCta(ctx);
  const text = `Клиент отменил запись.\nКлиент: ${ctx.clientName}\nУслуга: ${ctx.serviceTitle}\nКогда: ${when}\n${cta.url}`;

  return bookingEmail({
    documentTitle: 'Клиент отменил запись — SLOTTY',
    preview: `${ctx.clientName} отменил(а) запись.`,
    receiptKind: 'Отмена',
    eyebrow: 'Кабинет мастера',
    title: 'Клиент отменил запись',
    statusLabel: 'Отменено',
    statusTone: 'neutral',
    subtitle: issuedSubtitle(`${ctx.clientName} отменил(а) запись. Слот снова доступен для других клиентов`),
    heroTitle: ctx.serviceTitle,
    heroHighlight: when,
    heroMeta: `${ctx.clientName} · SLOTTY`,
    sectionTitle: 'Детали записи',
    rows: [
      { label: 'Клиент', value: ctx.clientName },
      { label: 'Услуга', value: ctx.serviceTitle },
      { label: 'Было', value: when },
    ],
    ctaLabel: cta.label,
    ctaUrl: cta.url,
    voucherNumber: ctx.voucherNumber,
    text,
  });
}
