import assert from 'node:assert/strict';
import {
  buildClientAvailableActions,
  buildClientBookingHero,
  formatBookingTimelineEventForClient,
  formatRelativeAppointmentCountdown,
} from './bookingClientDetail.js';
import type { BookingEventRow } from '../modules/appointments/bookingEvents.service.js';

function testHeroConfirmed() {
  const starts = new Date(Date.now() + 30 * 60_000).toISOString();
  const hero = buildClientBookingHero({
    status: 'confirmed',
    startsAt: starts,
    signal: { kind: 'on_the_way', lateMinutes: null, comment: null, at: null },
  });
  assert.equal(hero.title, 'Скоро запись');
  assert.ok(hero.countdown);
}

function testHeroIgnoresLegacyTravelSignal() {
  const hero = buildClientBookingHero({
    status: 'confirmed',
    startsAt: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
    signal: { kind: 'running_late', lateMinutes: 10, comment: 'Пробки', at: new Date().toISOString() },
  });
  assert.equal(hero.title, 'Запись подтверждена');
  assert.equal(hero.lateBadge, null);
}

function testAvailableActionsConfirmedSoon() {
  const starts = new Date(Date.now() + 45 * 60_000).toISOString();
  const actions = buildClientAvailableActions({
    status: 'confirmed',
    startsAt: starts,
    hasOpenDispute: false,
    canLeaveReview: false,
    hasReview: false,
    hasAddress: true,
    hasDirectContact: true,
  });
  assert.equal(actions.includes('on_the_way'), false);
  assert.equal(actions.includes('running_late'), false);
  assert.ok(actions.includes('open_route'));
}

function testTimelineHidesTechnical() {
  const ev: BookingEventRow = {
    id: '1',
    event_type: 'booking.notification_sent',
    old_status: null,
    new_status: null,
    actor_role: 'system',
    reason: null,
    comment: null,
    metadata: null,
    created_at: new Date().toISOString(),
  };
  assert.equal(formatBookingTimelineEventForClient(ev), null);
}

function testCountdown() {
  const label = formatRelativeAppointmentCountdown(75 * 60_000);
  assert.equal(label, '1 ч 15 мин');
}

testHeroConfirmed();
testHeroIgnoresLegacyTravelSignal();
testAvailableActionsConfirmedSoon();
testTimelineHidesTechnical();
testCountdown();
console.log('bookingClientDetail.unit.test.ts: 5/5 passed');
