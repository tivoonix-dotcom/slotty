import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOKING_CONFIRMATION_RULES,
  computePendingExpiresAt,
  msUntilStart,
} from './bookingConfirmationDeadlines.js';

describe('bookingConfirmationDeadlines', () => {
  it('pending > 24h expires after response window', () => {
    const created = new Date('2026-06-01T10:00:00.000Z');
    const starts = new Date('2026-06-05T14:00:00.000Z');
    const expires = computePendingExpiresAt(created, starts);
    assert.equal(expires.toISOString(), '2026-06-01T13:00:00.000Z');
  });

  it('same day booking expires at min confirmation lead', () => {
    const created = new Date('2026-06-05T08:00:00.000Z');
    const starts = new Date('2026-06-05T17:00:00.000Z');
    const expires = computePendingExpiresAt(created, starts);
    assert.equal(expires.toISOString(), '2026-06-05T14:00:00.000Z');
  });

  it('urgent booking expires after 15 minutes', () => {
    const created = new Date('2026-06-05T16:00:00.000Z');
    const starts = new Date('2026-06-05T17:00:00.000Z');
    const expires = computePendingExpiresAt(created, starts);
    assert.equal(expires.toISOString(), '2026-06-05T16:15:00.000Z');
  });

  it('msUntilStart', () => {
    const now = Date.parse('2026-06-05T16:00:00.000Z');
    assert.equal(msUntilStart('2026-06-05T17:00:00.000Z', now), 60 * 60_000);
  });

  it('platform min lead is 1 hour', () => {
    assert.equal(BOOKING_CONFIRMATION_RULES.PLATFORM_MIN_BOOKING_LEAD_MS, 60 * 60_000);
  });
});
