/** Синхронно с server/src/lib/bookingTimelinePolicy.ts */

export const HIDDEN_TIMELINE_EVENT_TYPES = new Set([
  'booking.notification_sent',
  'booking.notification_failed',
  'booking.client_on_the_way',
  'booking.client_running_late',
  'booking.client_reported_arrived',
]);

export const VISIBLE_CLIENT_TIMELINE_EVENT_TYPES = new Set([
  'booking.created',
  'booking.confirmed',
  'booking.reminder_sent',
  'booking.started',
  'booking.completed',
  'booking.completed_auto_confirmed',
  'booking.completed_by_master',
  'booking.master_marked_completed',
  'booking.client_confirmed_completed',
  'booking.client_arrived',
  'booking.cancelled_by_client',
  'booking.cancelled_by_master',
  'booking.no_show',
  'booking.review_left',
  'booking.expired',
  'booking.disputed_by_client',
  'booking.disputed_by_master',
]);

export function isHiddenTimelineEvent(eventType: string): boolean {
  return HIDDEN_TIMELINE_EVENT_TYPES.has(eventType);
}

export function isVisibleClientTimelineEvent(eventType: string): boolean {
  return VISIBLE_CLIENT_TIMELINE_EVENT_TYPES.has(eventType);
}

export type TimelineDedupeItem = {
  eventType: string;
  label: string;
  createdAt: string;
};

const DEDUPE_WINDOW_MS = 5000;

export function dedupeTimelineItems<T extends TimelineDedupeItem>(items: T[]): T[] {
  const out: T[] = [];

  for (const item of items) {
    const itemTime = Date.parse(item.createdAt);
    const isDuplicate = out.some((existing) => {
      if (existing.eventType !== item.eventType) return false;
      if (existing.label.trim() !== item.label.trim()) return false;
      const existingTime = Date.parse(existing.createdAt);
      if (Number.isNaN(itemTime) || Number.isNaN(existingTime)) {
        return existing.createdAt === item.createdAt;
      }
      return Math.abs(itemTime - existingTime) < DEDUPE_WINDOW_MS;
    });
    if (!isDuplicate) out.push(item);
  }

  return out;
}
