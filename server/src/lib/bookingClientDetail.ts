import { normalizeDbStatus, isTerminalStatus, dbStatusToUi } from './appointmentStatus.js';
import type { BookingEventRow } from '../modules/appointments/bookingEvents.service.js';
import { isHiddenTimelineEvent } from './bookingTimelinePolicy.js';

const CLIENT_HIDDEN_EVENTS = new Set([
  'booking.notification_sent',
  'booking.notification_failed',
  'booking.reminder_sent',
]);

export type ClientBookingActionId =
  | 'on_the_way'
  | 'running_late'
  | 'reported_arrived'
  | 'contact_master'
  | 'add_comment'
  | 'cancel'
  | 'reschedule'
  | 'confirm_completed'
  | 'dispute'
  | 'leave_review'
  | 'rebook'
  | 'download_pdf'
  | 'open_route';

export type ClientSignalSummary = {
  kind: 'on_the_way' | 'running_late' | 'reported_arrived' | null;
  lateMinutes: number | null;
  comment: string | null;
  at: string | null;
};

export function msUntilAppointment(startsAt: string | Date): number {
  const t = startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime();
  return t - Date.now();
}

export function formatRelativeAppointmentCountdown(ms: number): string | null {
  if (ms <= 0) return null;
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin} мин`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function formatWhenPhrase(startsAt: string | Date): string {
  const d = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `сегодня в ${time}`;
  if (diff === 1) return `завтра в ${time}`;
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${date} в ${time}`;
}

export function deriveClientSignalSummary(events: BookingEventRow[]): ClientSignalSummary {
  let kind: ClientSignalSummary['kind'] = null;
  let lateMinutes: number | null = null;
  let comment: string | null = null;
  let at: string | null = null;

  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i]!;
    const t = ev.event_type;
    if (t === 'booking.client_on_the_way') {
      kind = 'on_the_way';
      comment = ev.comment;
      at = iso(ev.created_at);
      break;
    }
    if (t === 'booking.client_running_late') {
      kind = 'running_late';
      comment = ev.comment;
      at = iso(ev.created_at);
      lateMinutes = parseLateMinutes(ev.metadata);
      break;
    }
    if (t === 'booking.client_reported_arrived') {
      kind = 'reported_arrived';
      comment = ev.comment;
      at = iso(ev.created_at);
      break;
    }
  }

  return { kind, lateMinutes, comment, at };
}

function iso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function parseLateMinutes(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const n = (metadata as { lateMinutes?: unknown }).lateMinutes;
  if (typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 240) return Math.round(n);
  return null;
}

export function buildClientBookingHero(params: {
  status: string;
  startsAt: string | Date;
  signal: ClientSignalSummary;
}): { title: string; subtitle: string; countdown: string | null; lateBadge: string | null } {
  const ui = dbStatusToUi(params.status);
  const when = formatWhenPhrase(params.startsAt);
  const ms = msUntilAppointment(params.startsAt);
  const countdown = ms > 0 ? formatRelativeAppointmentCountdown(ms) : null;

  switch (ui) {
    case 'pending':
      return {
        title: 'Заявка отправлена',
        subtitle: 'Ожидайте подтверждения мастера',
        countdown,
        lateBadge: null,
      };
    case 'confirmed': {
      if (ms > 0 && ms <= 60 * 60_000) {
        return {
          title: 'Скоро запись',
          subtitle: countdown
            ? `Мастер будет ждать вас через ${countdown}`
            : `Мастер ждёт вас ${when}`,
          countdown,
          lateBadge: null,
        };
      }
      return {
        title: 'Запись подтверждена',
        subtitle: `Мастер ждёт вас ${when}`,
        countdown,
        lateBadge: null,
      };
    }
    case 'client_arrived':
      return {
        title: 'Вы на месте',
        subtitle: 'Мастер отметил, что вы пришли',
        countdown: null,
        lateBadge: null,
      };
    case 'in_progress':
      return {
        title: 'Визит начался',
        subtitle: 'Услуга выполняется',
        countdown: null,
        lateBadge: null,
      };
    case 'master_marked_completed':
      return {
        title: 'Мастер завершил услугу',
        subtitle: 'Подтвердите, что всё прошло хорошо',
        countdown: null,
        lateBadge: null,
      };
    case 'completed':
      return {
        title: 'Визит завершён',
        subtitle: 'Можно оставить отзыв',
        countdown: null,
        lateBadge: null,
      };
    case 'no_show':
      return {
        title: 'Отмечена неявка',
        subtitle: 'Мастер отметил, что клиент не пришёл',
        countdown: null,
        lateBadge: null,
      };
    case 'cancelled':
      return {
        title: 'Запись отменена',
        subtitle: 'Запись перенесена в историю',
        countdown: null,
        lateBadge: null,
      };
    case 'disputed':
      return {
        title: 'Обращение на рассмотрении',
        subtitle: 'Мы разберём ситуацию с записью',
        countdown: null,
        lateBadge: null,
      };
    default:
      return {
        title: 'Запись',
        subtitle: when,
        countdown,
        lateBadge: null,
      };
  }
}

export function buildClientAvailableActions(params: {
  status: string;
  startsAt: string | Date;
  hasOpenDispute: boolean;
  canLeaveReview: boolean;
  hasReview: boolean;
  hasAddress: boolean;
  hasDirectContact: boolean;
}): ClientBookingActionId[] {
  const db = normalizeDbStatus(params.status);
  const ui = dbStatusToUi(params.status);
  const ms = msUntilAppointment(params.startsAt);
  const actions: ClientBookingActionId[] = [];

  if (ui === 'disputed') {
    actions.push('contact_master', 'download_pdf');
    return actions;
  }

  if (ui === 'no_show') {
    if (!params.hasOpenDispute) actions.push('dispute');
    actions.push('rebook', 'download_pdf');
    return actions;
  }

  if (isTerminalStatus(db)) {
    if (params.canLeaveReview && !params.hasReview && ui === 'completed') {
      actions.push('leave_review', 'rebook');
    } else if (ui === 'cancelled') {
      actions.push('rebook', 'download_pdf');
      return actions;
    }
    actions.push('download_pdf');
    return actions;
  }

  if (ui === 'confirmed' && ms > 0) {
    if (params.hasAddress) actions.push('open_route');
    actions.push('contact_master', 'add_comment', 'cancel');
    if (ms > 2 * 60 * 60_000) {
      actions.push('reschedule');
    }
    actions.push('download_pdf');
    return actions;
  }

  if (ui === 'pending') {
    actions.push('contact_master', 'add_comment', 'cancel', 'download_pdf');
    return actions;
  }

  if (ui === 'client_arrived' || ui === 'in_progress') {
    actions.push('contact_master', 'add_comment', 'download_pdf');
    if (!params.hasOpenDispute) actions.push('dispute');
    return actions;
  }

  if (ui === 'master_marked_completed' || ui === 'client_confirmed_completed') {
    actions.push('confirm_completed');
    if (!params.hasOpenDispute) actions.push('dispute');
    actions.push('contact_master', 'download_pdf');
    return actions;
  }

  actions.push('contact_master', 'download_pdf');
  return actions;
}

export function formatBookingTimelineEventForClient(ev: BookingEventRow): string | null {
  if (CLIENT_HIDDEN_EVENTS.has(ev.event_type) || isHiddenTimelineEvent(ev.event_type)) return null;

  switch (ev.event_type) {
    case 'booking.created':
      return 'Заявка отправлена';
    case 'booking.confirmed':
      return 'Мастер подтвердил запись';
    case 'booking.cancelled_by_client':
      return ev.reason ? `Вы отменили запись: ${ev.reason}` : 'Вы отменили запись';
    case 'booking.cancelled_by_master':
      return 'Мастер отменил запись';
    case 'booking.client_arrived':
      return 'Мастер отметил ваш приход';
    case 'booking.started':
      return 'Визит начался';
    case 'booking.master_marked_completed':
      return 'Мастер отметил выполнение услуги';
    case 'booking.client_confirmed_completed':
      return 'Вы подтвердили выполнение';
    case 'booking.completed':
    case 'booking.completed_auto_confirmed':
    case 'booking.completed_by_master':
      return 'Визит завершён';
    case 'booking.no_show':
      return 'Отмечена неявка';
    case 'booking.expired':
      return 'Заявка истекла';
    case 'booking.review_left':
      return 'Оставлен отзыв';
    case 'booking.client_comment':
      return ev.comment ? `Ваш комментарий: ${ev.comment}` : 'Комментарий к записи';
    case 'booking.disputed_by_client':
      return 'Вы отправили обращение';
    default:
      return null;
  }
}

export function formatTimelineCreatedAt(createdAt: Date | string): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `сегодня, ${time}`;
  if (diff === -1) return `вчера, ${time}`;
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${date}, ${time}`;
}
