import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getClientAppointmentReviewPath } from '../../../app/paths';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import {
  buildClientReviewActionPath,
  composeReviewBody,
  evaluateReviewEligibility,
} from './clientReviewFlow';

const BASE: ClientBookingDetail = {
  id: 'a1',
  master_id: 'm1',
  service_id: 's1',
  slot_id: 'sl1',
  starts_at: '2026-06-05T14:00:00.000Z',
  ends_at: '2026-06-05T15:00:00.000Z',
  status: 'completed',
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
};

describe('clientReviewFlow', () => {
  it('buildClientReviewActionPath', () => {
    assert.equal(buildClientReviewActionPath('sl-test01'), getClientAppointmentReviewPath('SL-TEST01'));
  });

  it('evaluateReviewEligibility allows completed without review', () => {
    assert.deepEqual(evaluateReviewEligibility(BASE), { ok: true });
  });

  it('evaluateReviewEligibility blocks when review exists', () => {
    const r = evaluateReviewEligibility({ ...BASE, has_review: true });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.title, /уже/i);
  });

  it('evaluateReviewEligibility blocks cancelled', () => {
    const r = evaluateReviewEligibility({ ...BASE, status: 'cancelled_by_client' });
    assert.equal(r.ok, false);
  });

  it('evaluateReviewEligibility blocks before completed', () => {
    const r = evaluateReviewEligibility({ ...BASE, status: 'confirmed' });
    assert.equal(r.ok, false);
  });

  it('composeReviewBody appends tags', () => {
    const body = composeReviewBody('Всё понравилось, спасибо!', ['Аккуратно']);
    assert.match(body, /Всё понравилось/);
    assert.match(body, /Аккуратно/);
  });
});
