import { eventLabel, type BookingEventRow } from './bookingEvents.service.js';
import { dedupeTimelineItems, isHiddenTimelineEvent } from '../../lib/bookingTimelinePolicy.js';

export type MasterTimelineItem = {
  eventType: string;
  label: string;
  createdAt: string;
  reason: string | null;
  comment: string | null;
  lateMinutes: number | null;
};

const REMINDER_JOB_LABELS: Record<string, string> = {
  booking_reminder_24h: 'Напоминание за 24 ч отправлено',
  booking_reminder_1h: 'Напоминание за 1 ч отправлено',
  booking_visit_start: 'Уведомление о начале визита отправлено',
};

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function reminderJobType(metadata: Record<string, unknown> | null): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const jobType = metadata.jobType;
  return typeof jobType === 'string' && jobType.trim() ? jobType.trim() : null;
}

function mapRow(ev: BookingEventRow, label: string): MasterTimelineItem {
  return {
    eventType: ev.event_type,
    label,
    createdAt: iso(ev.created_at),
    reason: ev.reason,
    comment: ev.comment,
    lateMinutes:
      ev.event_type === 'booking.client_running_late' && ev.metadata && typeof ev.metadata === 'object'
        ? ((ev.metadata as { lateMinutes?: number }).lateMinutes ?? null)
        : null,
  };
}

/** Лента событий для кабинета мастера: без шума каналов, одно напоминание на тип job. */
export function buildMasterAppointmentTimeline(events: BookingEventRow[]): MasterTimelineItem[] {
  const items: MasterTimelineItem[] = [];
  const seenReminderJobs = new Set<string>();

  for (const ev of events) {
    if (isHiddenTimelineEvent(ev.event_type)) continue;

    if (ev.event_type === 'booking.reminder_sent') {
      const jobType = reminderJobType(ev.metadata) ?? 'reminder';
      if (seenReminderJobs.has(jobType)) continue;
      seenReminderJobs.add(jobType);
      const label = REMINDER_JOB_LABELS[jobType] ?? 'Напоминание отправлено';
      items.push(mapRow(ev, label));
      continue;
    }

    items.push(mapRow(ev, eventLabel(ev.event_type, 'master')));
  }

  return dedupeTimelineItems(items);
}
