import { getClientAppointmentReviewPath } from '../../../app/paths';
import { dbStatusToUi } from '../appointmentStatus';
import type { MeNotificationRow } from '../../profile/api/clientNotifications';
import { parseBookingNotificationMetadata } from '../../notifications/bookingNotificationMetadata';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { canShowLeaveReview } from './clientAppointmentViewModel';

const SL_CODE_RE = /SL-[A-Z0-9]{12}/i;

export type ReviewEligibility =
  | { ok: true }
  | { ok: false; title: string; body: string };

export const REVIEW_TAG_OPTIONS = [
  'Аккуратно',
  'Приятное общение',
  'Чистое место',
  'Всё вовремя',
  'Хороший результат',
] as const;

export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 1000;

export function resolveBookingCodeFromNotification(item: MeNotificationRow): string | null {
  const fromRow = item.booking_code?.trim().toUpperCase();
  if (fromRow) return fromRow;
  const meta = parseBookingNotificationMetadata(item.metadata);
  const fromMeta = meta?.bookingCode?.trim().toUpperCase();
  if (fromMeta) return fromMeta;
  const fromBody = item.body.match(SL_CODE_RE)?.[0] ?? item.title.match(SL_CODE_RE)?.[0];
  return fromBody ? fromBody.toUpperCase() : null;
}

export function buildClientReviewActionPath(bookingCode: string): string {
  return getClientAppointmentReviewPath(bookingCode);
}

export function evaluateReviewEligibility(detail: ClientBookingDetail): ReviewEligibility {
  if (detail.has_review) {
    return {
      ok: false,
      title: 'Отзыв уже оставлен',
      body: 'Спасибо! Вы уже поделились впечатлением об этом визите.',
    };
  }

  const ui = dbStatusToUi(detail.status);
  if (ui === 'cancelled') {
    return {
      ok: false,
      title: 'Отзыв недоступен',
      body: 'Запись отменена — отзыв по этой записи оставить нельзя.',
    };
  }
  if (ui === 'no_show') {
    return {
      ok: false,
      title: 'Отзыв недоступен',
      body: 'Визит не состоялся — отзыв по этой записи оставить нельзя.',
    };
  }
  if (detail.dispute?.status === 'open' || detail.dispute?.status === 'in_review') {
    return {
      ok: false,
      title: 'Отзыв временно недоступен',
      body: 'Пока обращение по записи на рассмотрении, отзыв оставить нельзя.',
    };
  }
  if (!canShowLeaveReview(detail)) {
    return {
      ok: false,
      title: 'Рано для отзыва',
      body: 'Отзыв можно оставить только после завершения визита мастером.',
    };
  }

  return { ok: true };
}

export function composeReviewBody(text: string, tags: string[]): string {
  const trimmed = text.trim();
  const tagLine = tags.length ? `\n\n${tags.map((t) => `· ${t}`).join(' ')}` : '';
  return `${trimmed}${tagLine}`.trim();
}
