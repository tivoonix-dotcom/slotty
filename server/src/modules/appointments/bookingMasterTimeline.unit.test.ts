import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMasterAppointmentTimeline } from './bookingMasterTimeline.js';
import type { BookingEventRow } from './bookingEvents.service.js';

function ev(
  event_type: string,
  created_at: string,
  metadata: Record<string, unknown> | null = null,
): BookingEventRow {
  return {
    id: '1',
    event_type,
    old_status: null,
    new_status: null,
    actor_role: 'system',
    reason: null,
    comment: null,
    metadata,
    created_at,
  };
}

test('buildMasterAppointmentTimeline collapses reminder channels', () => {
  const rows = buildMasterAppointmentTimeline([
    ev('booking.created', '2026-06-05T10:00:00.000Z'),
    ev('booking.confirmed', '2026-06-05T10:05:00.000Z'),
    ev('booking.reminder_sent', '2026-06-05T11:00:00.000Z', {
      jobType: 'booking_reminder_24h',
      channel: 'email',
    }),
    ev('booking.reminder_sent', '2026-06-05T11:00:01.000Z', {
      jobType: 'booking_reminder_24h',
      channel: 'telegram',
    }),
    ev('booking.reminder_sent', '2026-06-05T12:00:00.000Z', {
      jobType: 'booking_reminder_1h',
      channel: 'email',
    }),
    ev('booking.notification_sent', '2026-06-05T12:01:00.000Z'),
  ]);

  assert.equal(rows.length, 4);
  assert.equal(rows[0]?.label, 'Создана заявка');
  assert.equal(rows[1]?.label, 'Мастер подтвердил');
  assert.equal(rows[2]?.label, 'Напоминание за 24 ч отправлено');
  assert.equal(rows[3]?.label, 'Напоминание за 1 ч отправлено');
});
