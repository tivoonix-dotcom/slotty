import type { MeNotificationRow } from '../profile/api/clientNotifications';
import { parseBookingNotificationMetadata } from './bookingNotificationMetadata';

export function isReviewNotificationRow(item: MeNotificationRow): boolean {
  const title = item.title.trim().toLowerCase();
  return item.related_entity_type === 'review' || title.includes('отзыв');
}

/** Отзыв ещё без ответа мастера — показываем в «Требуют действия» и подсвечиваем репутацию. */
export function reviewNotificationNeedsMasterReply(item: MeNotificationRow): boolean {
  if (!isReviewNotificationRow(item)) return false;
  const meta = parseBookingNotificationMetadata(item.metadata);
  if (meta?.needsMasterReply === false) return false;
  return true;
}

export function countReviewNotificationsNeedingReply(items: MeNotificationRow[]): number {
  return items.filter(reviewNotificationNeedsMasterReply).length;
}
