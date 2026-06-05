import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeOverviewOpsSnapshot } from './overviewOpsSnapshot.ts';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments.ts';

function appt(overrides: Partial<DemoMasterAppointment> & { id: string }): DemoMasterAppointment {
  return {
    clientName: 'Клиент',
    serviceTitle: 'Услуга',
    date: '2026-06-05',
    time: '12:00',
    status: 'confirmed',
    priceByn: 50,
    ...overrides,
  };
}

describe('computeOverviewOpsSnapshot', () => {
  it('counts pending and today appointments', () => {
    const now = new Date('2026-06-05T10:00:00');
    const snapshot = computeOverviewOpsSnapshot(
      [
        appt({ id: '1', status: 'pending' }),
        appt({ id: '2', status: 'confirmed', time: '14:00' }),
        appt({ id: '3', status: 'confirmed', date: '2026-06-06' }),
      ],
      null,
      2,
      now,
    );

    assert.equal(snapshot.pendingCount, 2);
    assert.equal(snapshot.todayAppointmentsCount, 2);
    assert.equal(snapshot.todayPreview.length, 2);
  });

  it('computes fill percent from future slots today', () => {
    const now = new Date('2026-06-05T10:00:00');
    const snapshot = computeOverviewOpsSnapshot(
      [],
      [
        {
          id: 's1',
          masterId: 'm1',
          serviceId: null,
          startsAt: '2026-06-05T12:00:00.000Z',
          endsAt: '2026-06-05T13:00:00.000Z',
          status: 'available',
          source: 'manual',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 's2',
          masterId: 'm1',
          serviceId: null,
          startsAt: '2026-06-05T14:00:00.000Z',
          endsAt: '2026-06-05T15:00:00.000Z',
          status: 'booked',
          source: 'manual',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
      0,
      now,
    );

    assert.equal(snapshot.totalSlotsToday, 2);
    assert.equal(snapshot.freeSlotsToday, 1);
    assert.equal(snapshot.bookedSlotsToday, 1);
    assert.equal(snapshot.scheduleFillPercent, 50);
  });
});
