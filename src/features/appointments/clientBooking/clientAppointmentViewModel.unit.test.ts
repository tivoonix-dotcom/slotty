import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import {
  buildClientAppointmentActions,
  canShowLeaveReview,
  clientFacingStatusLabelFromDb,
  resolveClientAppointmentPhase,
  shouldShowReviewPendingHint,
} from './clientAppointmentViewModel';

const BASE: ClientBookingDetail = {
  id: 'a1',
  master_id: 'm1',
  service_id: 's1',
  slot_id: 'sl1',
  starts_at: '2026-06-05T14:00:00.000Z',
  ends_at: '2026-06-05T15:00:00.000Z',
  status: 'confirmed',
  price_snapshot: '45',
  service_title_snapshot: 'Маникюр',
  client_note: null,
  client_reference_photo_url: null,
  created_at: '2026-06-01T10:00:00.000Z',
  master_display_name: 'Анна',
  location_visit_type: 'studio',
  location_city: 'Минск',
  location_street: 'Немига',
  location_building: '1',
  location_public_address: null,
  location_lat: 53.9,
  location_lng: 27.5,
  voucher_number: 'SL-TEST01',
  has_review: false,
  service_duration_minutes: 60,
  address: { line: 'Минск, Немига 1', hint: null, map_available: true },
};

function withStatus(status: string, extra: Partial<ClientBookingDetail> = {}): ClientBookingDetail {
  return { ...BASE, status, ...extra };
}

describe('clientAppointmentViewModel', () => {
  it('pending actions', () => {
    const actions = buildClientAppointmentActions(withStatus('pending'));
    assert.equal(actions.primary, 'cancel_request');
    assert.ok(actions.secondary.includes('open_master_profile'));
    assert.equal(actions.quickMessages.length, 0);
    assert.equal(actions.showMap, false);
    assert.equal(clientFacingStatusLabelFromDb('pending'), 'Заявка отправлена');
  });

  it('confirmed actions', () => {
    const starts = new Date(Date.now() + 4 * 60 * 60_000).toISOString();
    const actions = buildClientAppointmentActions(
      withStatus('confirmed', { starts_at: starts, ends_at: starts }),
    );
    assert.equal(actions.primary, 'open_route');
    assert.ok(actions.secondary.includes('cancel_booking'));
    assert.ok(actions.secondary.includes('add_to_calendar'));
    assert.equal(actions.quickMessages.length, 0);
    assert.equal(canShowLeaveReview(withStatus('confirmed')), false);
  });

  it('soon actions without legacy quick messages', () => {
    const starts = new Date(Date.now() + 30 * 60_000).toISOString();
    const ends = new Date(Date.now() + 90 * 60_000).toISOString();
    const detail = withStatus('confirmed', { starts_at: starts, ends_at: ends });
    assert.equal(resolveClientAppointmentPhase(detail), 'soon');
    const actions = buildClientAppointmentActions(detail);
    assert.equal(actions.primary, 'open_route');
    assert.deepEqual(actions.quickMessages, []);
  });

  it('in_progress maps to visit_active', () => {
    const actions = buildClientAppointmentActions(withStatus('in_progress'));
    assert.equal(resolveClientAppointmentPhase(withStatus('in_progress')), 'visit_active');
    assert.equal(actions.primary, 'call_master');
    assert.equal(canShowLeaveReview(withStatus('in_progress')), false);
  });

  it('master_marked_completed maps to awaiting_master_completion without confirm action', () => {
    const actions = buildClientAppointmentActions(withStatus('master_marked_completed'));
    assert.equal(resolveClientAppointmentPhase(withStatus('master_marked_completed')), 'awaiting_master_completion');
    assert.equal(actions.primary, 'call_master');
    assert.equal(canShowLeaveReview(withStatus('master_marked_completed')), false);
  });

  it('completed actions without review', () => {
    const actions = buildClientAppointmentActions(withStatus('completed'));
    assert.equal(actions.primary, 'leave_review');
    assert.equal(canShowLeaveReview(withStatus('completed')), true);
  });

  it('completed with review_exists', () => {
    const detail = withStatus('completed', { has_review: true });
    const actions = buildClientAppointmentActions(detail);
    assert.equal(actions.primary, 'book_again');
    assert.equal(canShowLeaveReview(detail), false);
  });

  it('cancelled actions', () => {
    const actions = buildClientAppointmentActions(
      withStatus('cancelled_by_client', { cancel_reason: 'Изменились планы' }),
    );
    assert.equal(actions.primary, 'book_again');
    assert.equal(actions.quickMessages.length, 0);
    assert.equal(canShowLeaveReview(withStatus('cancelled_by_client')), false);
  });

  it('no_show actions', () => {
    const actions = buildClientAppointmentActions(withStatus('no_show'));
    assert.equal(actions.primary, 'book_again');
    assert.ok(actions.secondary.includes('dispute'));
    assert.equal(canShowLeaveReview(withStatus('no_show')), false);
  });

  it('review only after completed', () => {
    assert.equal(canShowLeaveReview(withStatus('confirmed')), false);
    assert.equal(canShowLeaveReview(withStatus('in_progress')), false);
    assert.equal(canShowLeaveReview(withStatus('master_marked_completed')), false);
    assert.equal(canShowLeaveReview(withStatus('completed')), true);
    assert.equal(
      canShowLeaveReview(withStatus('confirmed', { completed_at: '2026-06-05T16:00:00.000Z' })),
      true,
    );
  });

  it('past time but not completed does not show review', () => {
    const past = withStatus('confirmed', {
      starts_at: '2026-06-01T10:00:00.000Z',
      ends_at: '2026-06-01T11:00:00.000Z',
    });
    assert.equal(canShowLeaveReview(past), false);
    assert.equal(shouldShowReviewPendingHint(past), true);
  });

  it('quick messages visible only when relevant', () => {
    const far = buildClientAppointmentActions(
      withStatus('confirmed', {
        starts_at: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
        ends_at: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
      }),
    );
    assert.equal(far.quickMessages.length, 0);

    const pending = buildClientAppointmentActions(withStatus('pending'));
    assert.equal(pending.quickMessages.length, 0);
  });

  it('expired maps to cancelled client phase', () => {
    assert.equal(resolveClientAppointmentPhase(withStatus('expired')), 'cancelled');
  });
});
