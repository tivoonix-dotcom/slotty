/** События, которые не показываем клиенту и мастеру в обычном UI (legacy travel signals, шум каналов). */
export const HIDDEN_TIMELINE_EVENT_TYPES = new Set([
  'booking.notification_sent',
  'booking.notification_failed',
  'booking.client_on_the_way',
  'booking.client_running_late',
  'booking.client_reported_arrived',
]);

export function isHiddenTimelineEvent(eventType: string): boolean {
  return HIDDEN_TIMELINE_EVENT_TYPES.has(eventType);
}

export type TimelineDedupeItem = {
  eventType: string;
  label: string;
  createdAt: string;
};

const DEDUPE_WINDOW_MS = 5000;

/** Убирает дубли одного типа/заголовка в пределах 5 секунд. */
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
