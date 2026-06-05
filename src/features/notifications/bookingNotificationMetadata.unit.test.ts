import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MeNotificationRow } from '../profile/api/clientNotifications';
import {
  metadataToDemoAppointment,
  parseBookingNotificationMetadata,
  resolveMetadataFallback,
  resolveNotificationBookingKeys,
} from './bookingNotificationMetadata';

const BOOKING_ID = 'a1111111-1111-4111-8111-111111111111';

const newNotificationMetadata = {
  bookingId: BOOKING_ID,
  bookingCode: 'SL-NEW01',
  clientName: 'Анна',
  clientPhone: '+375 29 111 22 33',
  serviceName: 'Стрижка',
  serviceCategory: 'Волосы',
  servicePrice: 45,
  serviceDurationMinutes: 60,
  startsAt: '2026-06-05T10:00:00.000Z',
  endsAt: '2026-06-05T11:00:00.000Z',
  address: 'Салон на Немиге',
  format: 'salon' as const,
  bookingStatus: 'pending',
  source: 'website',
};

function baseRow(overrides: Partial<MeNotificationRow>): MeNotificationRow {
  return {
    id: 'n1',
    type: 'appointment_pending',
    title: 'Новая заявка',
    body: 'Клиент: Анна\nУслуга: Стрижка',
    related_entity_type: 'appointment',
    related_entity_id: BOOKING_ID,
    booking_code: 'SL-NEW01',
    metadata: newNotificationMetadata,
    read_at: null,
    created_at: '2026-06-05T09:00:00.000Z',
    ...overrides,
  };
}

describe('bookingNotificationMetadata (frontend)', () => {
  it('resolves booking keys from row and metadata', () => {
    const keys = resolveNotificationBookingKeys(
      baseRow({ booking_code: null, related_entity_id: null }),
    );
    assert.equal(keys.bookingCode, 'SL-NEW01');
    assert.equal(keys.bookingId, BOOKING_ID);
  });

  it('builds demo appointment from metadata snapshot', () => {
    const meta = parseBookingNotificationMetadata(newNotificationMetadata);
    assert.ok(meta);
    const demo = metadataToDemoAppointment(meta!);
    assert.ok(demo);
    assert.equal(demo!.id, BOOKING_ID);
    assert.equal(demo!.clientName, 'Анна');
    assert.equal(demo!.serviceTitle, 'Стрижка');
    assert.equal(demo!.voucherNumber, 'SL-NEW01');
    assert.equal(demo!.dbStatus, 'pending');
  });

  it('provides metadata fallback for new notifications', () => {
    const fallback = resolveMetadataFallback(baseRow({}));
    assert.ok(fallback);
    assert.equal(fallback!.appointment.id, BOOKING_ID);
    assert.equal(fallback!.extras.serviceCategory, 'Волосы');
  });

  it('returns null fallback for legacy notifications without metadata', () => {
    const legacy = baseRow({
      metadata: null,
      related_entity_id: BOOKING_ID,
      booking_code: 'SL-LEGACY',
    });
    assert.equal(parseBookingNotificationMetadata(legacy.metadata), null);
    assert.equal(resolveMetadataFallback(legacy), null);
    assert.deepEqual(resolveNotificationBookingKeys(legacy), {
      bookingCode: 'SL-LEGACY',
      bookingId: BOOKING_ID,
    });
  });
});
