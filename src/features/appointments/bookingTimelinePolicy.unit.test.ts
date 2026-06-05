import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dedupeTimelineItems,
  isHiddenTimelineEvent,
  isVisibleClientTimelineEvent,
} from './bookingTimelinePolicy';
import { normalizeMasterTimeline } from '../../pages/admin/appointments/appointmentDetailHelpers';

test('client timeline policy hides travel signals', () => {
  assert.equal(isHiddenTimelineEvent('booking.client_on_the_way'), true);
  assert.equal(isVisibleClientTimelineEvent('booking.confirmed'), true);
  assert.equal(isVisibleClientTimelineEvent('booking.client_on_the_way'), false);
});

test('normalizeMasterTimeline filters legacy events and dedupes', () => {
  const normalized = normalizeMasterTimeline([
    {
      eventType: 'booking.client_on_the_way',
      label: 'Клиент в пути',
      createdAt: '2026-06-05T10:00:00.000Z',
    },
    {
      eventType: 'booking.client_on_the_way',
      label: 'Клиент в пути',
      createdAt: '2026-06-05T10:00:01.000Z',
    },
    {
      eventType: 'booking.confirmed',
      label: 'Мастер подтвердил',
      createdAt: '2026-06-05T09:00:00.000Z',
    },
  ]);

  assert.deepEqual(
    normalized.map((e) => e.label),
    ['Мастер подтвердил'],
  );
});

test('dedupeTimelineItems keeps distinct events', () => {
  const items = dedupeTimelineItems([
    { eventType: 'booking.confirmed', label: 'Мастер подтвердил', createdAt: '2026-06-05T09:00:00.000Z' },
    { eventType: 'booking.completed', label: 'Визит завершён', createdAt: '2026-06-05T12:00:00.000Z' },
  ]);
  assert.equal(items.length, 2);
});
