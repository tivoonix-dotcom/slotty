import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import {
  dedupeTimelineItems,
  isHiddenTimelineEvent,
} from '../../../features/appointments/bookingTimelinePolicy';
import { clientNameInputForResolve, formatCardDateTime } from './appointmentsFormat';
import type { MasterAppointmentLifecycleResult } from '../../../features/appointments/masterAppointmentLifecycle';

export type TimelineEvent = {
  eventType: string;
  label: string;
  createdAt: string;
  comment?: string | null;
  lateMinutes?: number | null;
};

const HIDDEN_EVENT_TYPES = new Set(['booking.notification_sent', 'booking.notification_failed']);

/** Имя клиента для шапки записи и уведомлений. */
export function resolveClientDisplayName(
  appointment: Pick<
    DemoMasterAppointment,
    'clientName' | 'contact' | 'clientTelegramUsername' | 'clientEmail'
  >,
): string {
  const resolved = resolveNotificationClientName({
    full_name: clientNameInputForResolve(appointment.clientName),
    phone: appointment.contact,
    telegram_username: appointment.clientTelegramUsername,
  });
  if (resolved) return resolved;

  const raw = clientNameInputForResolve(appointment.clientName);
  return raw ?? 'Клиент';
}

export function formatTimelineEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Клиентский fallback, если timeline пришёл без серверной агрегации. */
export function normalizeMasterTimeline(events: TimelineEvent[]): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  let collapsedReminders = false;

  for (const ev of events) {
    if (HIDDEN_EVENT_TYPES.has(ev.eventType) || isHiddenTimelineEvent(ev.eventType)) continue;

    if (ev.eventType === 'booking.reminder_sent') {
      if (collapsedReminders) continue;
      collapsedReminders = true;
      const label =
        ev.label !== 'Напоминание' && ev.label !== 'Напоминание отправлено'
          ? ev.label
          : 'Напоминания отправлены';
      out.push({ ...ev, label });
      continue;
    }

    out.push(ev);
  }

  return dedupeTimelineItems(out);
}

export function buildDetailHelperText(
  lifecycle: MasterAppointmentLifecycleResult,
  appointment: DemoMasterAppointment,
): string {
  const when = formatCardDateTime(appointment.date, appointment.timeLabel ?? appointment.time);

  switch (lifecycle.phase) {
    case 'pending':
      return 'Проверьте детали и подтвердите или отклоните заявку.';
    case 'before_visit':
      return `Клиент придёт ${when}. За сутки и за час до визита ему уйдут напоминания — вам тоже.`;
    case 'visit_window':
      return lifecycle.helperText;
    case 'in_progress':
      return 'Когда услуга оказана, нажмите «Завершить визит».';
    case 'requires_attention':
      return `Время визита (${when}) уже прошло. Закройте запись или сообщите о проблеме.`;
    case 'completed':
      return 'Визит завершён. Запись сохранена в истории.';
    default:
      return lifecycle.helperText;
  }
}

export function formatVoucherLabel(voucher?: string | null): string | null {
  const code = voucher?.trim();
  if (!code) return null;
  return code.toUpperCase();
}
