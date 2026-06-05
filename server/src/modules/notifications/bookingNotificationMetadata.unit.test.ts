import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildBookingNotificationMetadata,
  parseBookingNotificationMetadata,
  visitTypeToNotificationFormat,
} from './bookingNotificationMetadata.js';

describe('bookingNotificationMetadata', () => {
  const snapshotRow = {
    appointment_id: 'a1111111-1111-4111-8111-111111111111',
    voucher_number: 'SL-TEST01',
    client_name: '+375 44 123 45 67',
    client_phone: '+375 44 123 45 67',
    service_title: 'Маникюр с укреплением',
    service_category: 'Маникюр',
    price_snapshot: '66',
    service_duration_snapshot: 90,
    starts_at: '2026-06-05T14:15:00.000Z',
    ends_at: '2026-06-05T15:45:00.000Z',
    public_address: 'Минск, ул. Примерная 1',
    visit_type: 'studio',
    status: 'pending',
    booking_source: 'website',
  };

  it('builds metadata snapshot for masterBookingRequestCreated', () => {
    const metadata = buildBookingNotificationMetadata(snapshotRow);
    assert.equal(metadata.bookingId, snapshotRow.appointment_id);
    assert.equal(metadata.bookingCode, 'SL-TEST01');
    assert.equal(metadata.clientName, '+375 44 123 45 67');
    assert.equal(metadata.serviceName, 'Маникюр с укреплением');
    assert.equal(metadata.serviceCategory, 'Маникюр');
    assert.equal(metadata.servicePrice, 66);
    assert.equal(metadata.serviceDurationMinutes, 90);
    assert.equal(metadata.format, 'salon');
    assert.equal(metadata.bookingStatus, 'pending');
    assert.equal(metadata.source, 'website');
  });

  it('maps visit types to notification format', () => {
    assert.equal(visitTypeToNotificationFormat('at_home'), 'home');
    assert.equal(visitTypeToNotificationFormat('studio'), 'salon');
    assert.equal(visitTypeToNotificationFormat('online'), 'online');
    assert.equal(visitTypeToNotificationFormat(null), 'other');
  });

  it('parses stored metadata json', () => {
    const built = buildBookingNotificationMetadata(snapshotRow);
    const parsed = parseBookingNotificationMetadata(built);
    assert.deepEqual(parsed, built);
  });

  it('returns null for legacy notifications without metadata', () => {
    assert.equal(parseBookingNotificationMetadata(null), null);
    assert.equal(parseBookingNotificationMetadata(undefined), null);
    assert.equal(parseBookingNotificationMetadata({}), null);
    assert.equal(parseBookingNotificationMetadata({ bookingCode: 'SL-OLD' }), null);
  });
});
