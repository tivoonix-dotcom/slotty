import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBookingTimelineEventForClient } from './bookingClientDetail.js';
import { dedupeTimelineItems, isHiddenTimelineEvent } from './bookingTimelinePolicy.js';
import type { BookingEventRow } from '../modules/appointments/bookingEvents.service.js';
import { buildMasterAppointmentTimeline } from '../modules/appointments/bookingMasterTimeline.js';

function ev(event_type: string, created_at: string): BookingEventRow {
  return {
    id: `${event_type}-${created_at}`,
    event_type,
    old_status: null,
    new_status: null,
    actor_role: 'client',
    reason: null,
    comment: null,
    metadata: null,
    created_at,
  };
}

test('isHiddenTimelineEvent hides legacy client travel signals', () => {
  assert.equal(isHiddenTimelineEvent('booking.client_on_the_way'), true);
  assert.equal(isHiddenTimelineEvent('booking.client_running_late'), true);
  assert.equal(isHiddenTimelineEvent('booking.client_reported_arrived'), true);
  assert.equal(isHiddenTimelineEvent('booking.confirmed'), false);
});

test('formatBookingTimelineEventForClient hides legacy travel signals', () => {
  assert.equal(formatBookingTimelineEventForClient(ev('booking.client_on_the_way', '2026-06-05T10:00:00Z')), null);
  assert.equal(
    formatBookingTimelineEventForClient(ev('booking.confirmed', '2026-06-05T10:05:00Z')),
    'Мастер подтвердил запись',
  );
});

test('dedupeTimelineItems removes duplicate events within 5 seconds', () => {
  const items = dedupeTimelineItems([
    { eventType: 'booking.client_on_the_way', label: 'Клиент в пути', createdAt: '2026-06-05T10:00:00.000Z' },
    { eventType: 'booking.client_on_the_way', label: 'Клиент в пути', createdAt: '2026-06-05T10:00:02.000Z' },
    { eventType: 'booking.confirmed', label: 'Мастер подтвердил', createdAt: '2026-06-05T09:00:00.000Z' },
  ]);
  assert.equal(items.length, 2);
});

test('buildMasterAppointmentTimeline hides travel signals and dedupes', () => {
  const rows = buildMasterAppointmentTimeline([
    ev('booking.confirmed', '2026-06-05T10:05:00.000Z'),
    ev('booking.client_on_the_way', '2026-06-05T11:00:00.000Z'),
    ev('booking.client_on_the_way', '2026-06-05T11:00:01.000Z'),
    ev('booking.started', '2026-06-05T11:30:00.000Z'),
    ev('booking.completed', '2026-06-05T12:30:00.000Z'),
  ]);

  assert.deepEqual(
    rows.map((r) => r.label),
    ['Мастер подтвердил', 'Визит начат', 'Визит завершён'],
  );
});
