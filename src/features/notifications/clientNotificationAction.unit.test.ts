import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getClientAppointmentPath, getClientAppointmentReviewPath } from '../../app/paths';
import { resolveClientNotificationAction } from './clientNotificationAction';
import type { MeNotificationRow } from '../profile/api/clientNotifications';

function row(partial: Partial<MeNotificationRow> & Pick<MeNotificationRow, 'type'>): MeNotificationRow {
  return {
    id: 'n1',
    title: 'Визит завершён',
    body: 'Оставьте отзыв',
    related_entity_type: 'appointment',
    related_entity_id: 'a1',
    read_at: null,
    created_at: '2026-06-05T12:00:00.000Z',
    ...partial,
  };
}

describe('resolveClientNotificationAction', () => {
  it('review_request → leave review path', () => {
    const action = resolveClientNotificationAction(
      row({ type: 'review_request', booking_code: 'SL-ABCD12345678' }),
    );
    assert.equal(action?.label, 'Оставить отзыв');
    assert.equal(action?.to, getClientAppointmentReviewPath('SL-ABCD12345678'));
  });

  it('review_request with has_review metadata still links to review (guard on page)', () => {
    const action = resolveClientNotificationAction(
      row({
        type: 'review_request',
        booking_code: 'SL-ABCD12345678',
        metadata: { bookingId: 'a1', bookingCode: 'SL-ABCD12345678', bookingStatus: 'completed' },
      }),
    );
    assert.equal(action?.label, 'Оставить отзыв');
  });

  it('review_request non-completed status → open booking', () => {
    const action = resolveClientNotificationAction(
      row({
        type: 'review_request',
        booking_code: 'SL-ABCD12345678',
        metadata: { bookingId: 'a1', bookingStatus: 'confirmed' },
      }),
    );
    assert.equal(action?.label, 'Открыть запись');
    assert.equal(action?.to, getClientAppointmentPath('SL-ABCD12345678'));
  });

  it('appointment_confirmed → open booking', () => {
    const action = resolveClientNotificationAction(
      row({ type: 'appointment_confirmed', booking_code: 'SL-ABCD12345678' }),
    );
    assert.equal(action?.label, 'Открыть запись');
    assert.equal(action?.to, getClientAppointmentPath('SL-ABCD12345678'));
  });
});
