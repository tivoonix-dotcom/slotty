import { dbStatusToUi, type UiAppointmentStatus } from '../appointmentStatus';
import { formatServiceName } from '../../../shared/lib/displayFormat';
import { formatDurationMinutes } from '../../../pages/admin/appointments/appointmentsFormat';
import { formatPriceByn } from '../../../pages/profile/profileFormat';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { bookingStatusBadgeClass } from './clientBookingDetailUi';

const SOON_WINDOW_MS = 60 * 60_000;

export type ClientAppointmentPrimaryAction =
  | 'cancel_request'
  | 'open_route'
  | 'call_master'
  | 'leave_review'
  | 'book_again'
  | null;

export type ClientAppointmentSecondaryAction =
  | 'open_master_profile'
  | 'copy_address'
  | 'open_route'
  | 'add_to_calendar'
  | 'cancel_booking'
  | 'write_master'
  | 'call_master'
  | 'book_again'
  | 'download_pdf'
  | 'dispute'
  | null;

export type ClientAppointmentQuickMessage = 'running_late' | 'cannot_find_entrance';

/** Клиентские фазы — без внутренних DB-статусов. */
export type ClientAppointmentUiPhase =
  | 'pending'
  | 'confirmed'
  | 'soon'
  | 'visit_soon'
  | 'visit_active'
  | 'awaiting_master_completion'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'disputed';

export type ClientAppointmentHeroView = {
  statusLabel: string;
  statusBadgeClass: string;
  serviceTitle: string;
  whenLabel: string;
  durationLabel: string;
  priceLabel: string;
  hint: string;
  voucherNumber: string | null;
  showCompletedPhoto: boolean;
  reviewThankYou: boolean;
};

export type ClientAppointmentNextStepView = {
  title: string;
  body: string;
};

export type ClientAppointmentActionsView = {
  primary: ClientAppointmentPrimaryAction;
  secondary: ClientAppointmentSecondaryAction[];
  quickMessages: ClientAppointmentQuickMessage[];
  showMap: boolean;
  showComment: boolean;
  showTimeline: boolean;
  showReviewPendingHint: boolean;
};

export function msUntilAppointment(startsAt: string, now = Date.now()): number {
  return new Date(startsAt).getTime() - now;
}

export function resolveClientAppointmentPhase(
  detail: ClientBookingDetail,
  now = Date.now(),
): ClientAppointmentUiPhase {
  const ui = dbStatusToUi(detail.status);
  const startMs = new Date(detail.starts_at).getTime();
  const endMs = new Date(detail.ends_at).getTime();

  if (ui === 'confirmed') {
    if (now >= startMs && now < endMs) return 'visit_active';
    const ms = startMs - now;
    if (ms > 0 && ms <= SOON_WINDOW_MS) return 'soon';
    if (ms > 0 && ms <= 15 * 60_000) return 'visit_soon';
    return 'confirmed';
  }

  if (ui === 'client_arrived' || ui === 'in_progress') {
    return 'visit_active';
  }

  if (ui === 'master_marked_completed' || ui === 'client_confirmed_completed') {
    return 'awaiting_master_completion';
  }

  if (ui === 'pending') return 'pending';
  if (ui === 'completed') return 'completed';
  if (ui === 'cancelled') return 'cancelled';
  if (ui === 'no_show') return 'no_show';
  if (ui === 'disputed') return 'disputed';

  return 'confirmed';
}

/** Человекочитаемая метка для списка записей (без raw enum). */
export function clientFacingStatusLabelFromUi(ui: UiAppointmentStatus): string {
  switch (ui) {
    case 'pending':
      return 'Заявка отправлена';
    case 'confirmed':
      return 'Запись подтверждена';
    case 'client_arrived':
    case 'in_progress':
      return 'Визит проходит';
    case 'master_marked_completed':
    case 'client_confirmed_completed':
      return 'Ожидаем завершения мастером';
    case 'completed':
      return 'Визит завершён';
    case 'cancelled':
      return 'Запись отменена';
    case 'no_show':
      return 'Визит не состоялся';
    case 'disputed':
      return 'Обращение на рассмотрении';
    default:
      return 'Запись';
  }
}

export function clientFacingStatusLabelFromDb(status: string): string {
  return clientFacingStatusLabelFromUi(dbStatusToUi(status));
}

export function isVisitCompleted(detail: ClientBookingDetail): boolean {
  const ui = dbStatusToUi(detail.status);
  if (ui === 'completed') return true;
  if (detail.completed_at) return true;
  return false;
}

export function canShowLeaveReview(detail: ClientBookingDetail): boolean {
  if (detail.has_review) return false;
  if (detail.dispute?.status === 'open' || detail.dispute?.status === 'in_review') return false;
  if (detail.can_leave_review === false) return false;
  const ui = dbStatusToUi(detail.status);
  if (ui === 'cancelled' || ui === 'no_show') return false;
  return isVisitCompleted(detail);
}

export function shouldShowReviewPendingHint(detail: ClientBookingDetail, now = Date.now()): boolean {
  if (canShowLeaveReview(detail) || detail.has_review) return false;
  const phase = resolveClientAppointmentPhase(detail, now);
  if (phase === 'awaiting_master_completion' || phase === 'visit_active') {
    return new Date(detail.ends_at).getTime() < now;
  }
  if (phase === 'confirmed' || phase === 'soon' || phase === 'visit_soon') {
    return new Date(detail.ends_at).getTime() < now;
  }
  return false;
}

export function formatAppointmentWhen(detail: ClientBookingDetail, now = Date.now()): string {
  const start = new Date(detail.starts_at);
  const end = new Date(detail.ends_at);
  if (Number.isNaN(start.getTime())) return 'Дата уточняется';

  const startTime = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return `Сегодня, ${startTime}–${endTime}`;
  if (diff === 1) return `Завтра, ${startTime}–${endTime}`;
  if (diff === -1) return `Вчера, ${startTime}`;
  const dateStr = start.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${dateStr}, ${startTime}`;
}

function clientFacingStatusLabel(detail: ClientBookingDetail, phase: ClientAppointmentUiPhase): string {
  switch (phase) {
    case 'pending':
      return 'Заявка отправлена';
    case 'confirmed':
      return 'Запись подтверждена';
    case 'soon':
      return 'Скоро визит';
    case 'visit_soon':
      return 'Визит скоро начнётся';
    case 'visit_active':
      return 'Визит проходит';
    case 'awaiting_master_completion':
      return 'Ожидаем завершения мастером';
    case 'completed':
      return 'Визит завершён';
    case 'cancelled':
      return 'Запись отменена';
    case 'no_show':
      return 'Визит не состоялся';
    case 'disputed':
      return 'Обращение на рассмотрении';
    default:
      return clientFacingStatusLabelFromDb(detail.status);
  }
}

function nextStepBody(
  detail: ClientBookingDetail,
  phase: ClientAppointmentUiPhase,
  now = Date.now(),
): string {
  if (shouldShowReviewPendingHint(detail, now)) {
    return 'После завершения визита мастером вы сможете оставить отзыв.';
  }
  switch (phase) {
    case 'pending':
      return 'Мастер получил вашу заявку. Мы уведомим вас после подтверждения.';
    case 'confirmed':
      return 'Запись подтверждена. Мастер ждёт вас. Если планы изменились, отмените запись заранее.';
    case 'soon': {
      const time = new Date(detail.starts_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Сегодня запись в ${time}. Проверьте адрес и маршрут.`;
    }
    case 'visit_soon':
      return 'Визит скоро начнётся. При необходимости свяжитесь с мастером.';
    case 'visit_active':
      return 'Визит проходит. При необходимости свяжитесь с мастером.';
    case 'awaiting_master_completion':
      return 'Мастер завершит визит в ближайшее время. После этого вы сможете оставить отзыв.';
    case 'completed':
      return detail.has_review
        ? 'Спасибо за отзыв — он помогает другим клиентам.'
        : 'Можно оставить отзыв о визите.';
    case 'cancelled':
      return detail.cancel_reason
        ? `Запись отменена. Причина: ${detail.cancel_reason}`
        : 'Запись отменена.';
    case 'no_show':
      return 'Визит не состоялся.';
    case 'disputed':
      return 'Мы рассматриваем ваше обращение по этой записи.';
    default:
      return '';
  }
}

export function buildClientAppointmentHero(
  detail: ClientBookingDetail,
  now = Date.now(),
): ClientAppointmentHeroView {
  const phase = resolveClientAppointmentPhase(detail, now);
  const durationLabel = formatDurationMinutes(
    detail.service_duration_minutes,
    detail.service_title_snapshot,
  );
  const price = Number.parseFloat(String(detail.price_snapshot));
  const priceLabel = Number.isFinite(price) && price > 0 ? formatPriceByn(price) : '—';

  return {
    statusLabel: clientFacingStatusLabel(detail, phase),
    statusBadgeClass: bookingStatusBadgeClass(detail.status),
    serviceTitle: formatServiceName(detail.service_title_snapshot) || 'Услуга',
    whenLabel: formatAppointmentWhen(detail, now),
    durationLabel: durationLabel || '—',
    priceLabel,
    hint: '',
    voucherNumber: detail.voucher_number?.trim() || null,
    showCompletedPhoto: phase === 'completed',
    reviewThankYou: phase === 'completed' && Boolean(detail.has_review),
  };
}

export function buildClientAppointmentNextStep(
  detail: ClientBookingDetail,
  now = Date.now(),
): ClientAppointmentNextStepView {
  const phase = resolveClientAppointmentPhase(detail, now);
  return { title: 'Что дальше', body: nextStepBody(detail, phase, now) };
}

function hasRouteTarget(detail: ClientBookingDetail): boolean {
  return Boolean(detail.address?.line?.trim() || detail.address?.map_available);
}

function hasOpenDispute(detail: ClientBookingDetail): boolean {
  return detail.dispute?.status === 'open' || detail.dispute?.status === 'in_review';
}

export function buildClientAppointmentActions(
  detail: ClientBookingDetail,
  now = Date.now(),
): ClientAppointmentActionsView {
  const phase = resolveClientAppointmentPhase(detail, now);
  const secondary: ClientAppointmentSecondaryAction[] = [];
  let primary: ClientAppointmentPrimaryAction = null;
  let quickMessages: ClientAppointmentQuickMessage[] = [];

  const showMap =
    hasRouteTarget(detail) &&
    phase !== 'pending' &&
    phase !== 'cancelled' &&
    phase !== 'no_show' &&
    phase !== 'awaiting_master_completion';

  switch (phase) {
    case 'pending':
      primary = 'cancel_request';
      secondary.push('open_master_profile');
      break;
    case 'confirmed':
      primary = showMap ? 'open_route' : 'call_master';
      secondary.push('write_master', 'call_master', 'add_to_calendar', 'cancel_booking', 'open_master_profile');
      if (showMap) secondary.push('copy_address');
      break;
    case 'soon':
    case 'visit_soon':
      primary = showMap ? 'open_route' : 'call_master';
      secondary.push('call_master', 'write_master', 'add_to_calendar', 'cancel_booking');
      if (showMap) secondary.push('copy_address');
      quickMessages = [];
      break;
    case 'visit_active':
      primary = 'call_master';
      if (showMap) secondary.push('open_route', 'copy_address');
      secondary.push('write_master');
      break;
    case 'awaiting_master_completion':
      primary = 'call_master';
      secondary.push('write_master');
      break;
    case 'completed':
      primary = canShowLeaveReview(detail) ? 'leave_review' : 'book_again';
      secondary.push('book_again', 'open_master_profile', 'download_pdf');
      break;
    case 'cancelled':
      primary = 'book_again';
      secondary.push('open_master_profile');
      break;
    case 'no_show':
      primary = 'book_again';
      if (!hasOpenDispute(detail)) secondary.push('dispute');
      secondary.push('open_master_profile');
      break;
    case 'disputed':
      primary = 'call_master';
      secondary.push('write_master', 'download_pdf');
      break;
    default:
      break;
  }

  const dedupedSecondary = [...new Set(secondary)].filter((action) => {
    if (action === 'call_master' && primary === 'call_master') return false;
    if (action === 'book_again' && primary === 'book_again') return false;
    return true;
  });

  return {
    primary,
    secondary: dedupedSecondary,
    quickMessages,
    showMap,
    showComment: phase === 'pending' || phase === 'confirmed',
    showTimeline: Boolean(detail.timeline?.length),
    showReviewPendingHint: shouldShowReviewPendingHint(detail, now),
  };
}

export function primaryActionLabel(action: ClientAppointmentPrimaryAction): string {
  switch (action) {
    case 'cancel_request':
      return 'Отменить заявку';
    case 'open_route':
      return 'Построить маршрут';
    case 'call_master':
      return 'Позвонить';
    case 'leave_review':
      return 'Оставить отзыв';
    case 'book_again':
      return 'Записаться снова';
    default:
      return '';
  }
}

export function secondaryActionLabel(action: ClientAppointmentSecondaryAction): string {
  switch (action) {
    case 'open_master_profile':
      return 'Профиль мастера';
    case 'copy_address':
      return 'Скопировать адрес';
    case 'open_route':
      return 'Маршрут';
    case 'add_to_calendar':
      return 'Добавить в календарь';
    case 'cancel_booking':
      return 'Отменить запись';
    case 'write_master':
      return 'Написать';
    case 'call_master':
      return 'Позвонить';
    case 'book_again':
      return 'Записаться снова';
    case 'download_pdf':
      return 'Скачать PDF';
    case 'dispute':
      return 'Есть проблема';
    default:
      return '';
  }
}

export function quickMessageLabel(message: ClientAppointmentQuickMessage): string {
  switch (message) {
    case 'running_late':
      return 'Опаздываю';
    case 'cannot_find_entrance':
      return 'Не могу найти вход';
    default:
      return '';
  }
}
