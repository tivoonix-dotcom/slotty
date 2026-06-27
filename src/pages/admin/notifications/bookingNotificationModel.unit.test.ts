import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  bookingNotificationHint,
  isOverdueBookingNotification,
  resolveBookingNotificationActions,
} from './bookingNotificationModel';

describe('resolveBookingNotificationActions', () => {
  const pastEndsAt = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
  const futureEndsAt = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
  const now = new Date();

  it('hides cancel for confirmed visit that already ended', () => {
    const actions = resolveBookingNotificationActions('confirmed', {
      endsAt: pastEndsAt,
      now,
    });
    assert.deepEqual(
      actions.map((a) => a.id),
      ['open', 'close'],
    );
  });

  it('keeps cancel for upcoming confirmed visit', () => {
    const actions = resolveBookingNotificationActions('confirmed', {
      endsAt: futureEndsAt,
      now,
    });
    assert.deepEqual(
      actions.map((a) => a.id),
      ['open', 'cancel', 'close'],
    );
  });
});

describe('isOverdueBookingNotification', () => {
  it('detects overdue confirmed visit', () => {
    const endsAt = new Date(Date.now() - 60_000).toISOString();
    assert.equal(isOverdueBookingNotification('confirmed', { endsAt }), true);
    assert.equal(isOverdueBookingNotification('completed', { endsAt }), false);
  });
});

describe('bookingNotificationHint', () => {
  it('explains overdue visit instead of reminder copy', () => {
    const endsAt = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
    const hint = bookingNotificationHint('confirmed', 'appointment_reminder', null, { endsAt });
    assert.match(hint, /Время записи уже прошло/);
  });
});
