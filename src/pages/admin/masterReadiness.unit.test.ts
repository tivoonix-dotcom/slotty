import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assessMasterBookingReadiness,
  resolveDailyHubState,
} from './masterReadiness';

const baseDraft = {
  name: 'Анна',
  services: [{ id: 's1', title: 'Маникюр', durationMin: 60, priceByn: 50, isActive: true }],
  location: {
    visitType: 'studio' as const,
    street: 'ул. Ленина',
    building: '1',
  },
  schedule: { workDays: [0, 1, 2, 3, 4], startTime: '10:00', endTime: '19:00', gapMinutes: 0 },
};

describe('assessMasterBookingReadiness', () => {
  it('weekly schedule alone does not make profile bookable', () => {
    const readiness = assessMasterBookingReadiness({
      draft: baseDraft,
      activeSlotCount: 0,
      isPublished: true,
    });

    assert.equal(readiness.hasBookableSlot, false);
    assert.equal(readiness.readyToAcceptBookings, false);
    assert.match(readiness.publishBlockMessage ?? '', /окно/);
  });

  it('active service + slot + address makes profile ready', () => {
    const readiness = assessMasterBookingReadiness({
      draft: baseDraft,
      activeSlotCount: 3,
      isPublished: true,
    });

    assert.equal(readiness.readyToAcceptBookings, true);
    assert.equal(readiness.publishBlockMessage, null);
  });

  it('blocks publish without address for salon visit', () => {
    const readiness = assessMasterBookingReadiness({
      draft: {
        ...baseDraft,
        location: { visitType: 'studio', street: '', building: '' },
      },
      activeSlotCount: 2,
      isPublished: false,
    });

    assert.equal(readiness.hasLocationOrFormat, false);
    assert.match(readiness.publishBlockMessage ?? '', /адрес/);
  });
});

describe('resolveDailyHubState', () => {
  it('prioritizes missing services over missing slots', () => {
    assert.equal(
      resolveDailyHubState({ activeServiceCount: 0, activeSlotCount: 0, pendingCount: 0 }),
      'no_services',
    );
  });

  it('shows pending when slots exist', () => {
    assert.equal(
      resolveDailyHubState({ activeServiceCount: 2, activeSlotCount: 5, pendingCount: 3 }),
      'has_pending',
    );
  });
});
