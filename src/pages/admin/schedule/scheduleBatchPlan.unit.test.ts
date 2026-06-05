import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterNonOverlappingBatch,
  planBatchSlots,
  todayIsoLocal,
} from './scheduleBatchPlan.ts';

describe('planBatchSlots', () => {
  it('creates slots for selected weekdays only', () => {
    const start = todayIsoLocal();
    const planned = planBatchSlots(
      {
        startDateIso: start,
        endDateIso: start,
        weekdays: [0],
        dayStartTime: '10:00',
        dayEndTime: '12:00',
        slotDurationMinutes: 60,
      },
      new Date(`${start}T08:00:00`),
    );

    const jsDay = new Date(`${start}T12:00:00`).getDay();
    const isMonday = jsDay === 1;
    assert.equal(planned.length, isMonday ? 2 : 0);
  });

  it('skips slots in the past', () => {
    const start = todayIsoLocal();
    const planned = planBatchSlots(
      {
        startDateIso: start,
        endDateIso: start,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        dayStartTime: '08:00',
        dayEndTime: '09:00',
        slotDurationMinutes: 60,
      },
      new Date(`${start}T23:59:00`),
    );

    assert.equal(planned.length, 0);
  });
});

describe('filterNonOverlappingBatch', () => {
  it('skips overlaps against existing and planned slots', () => {
    const planned = planBatchSlots(
      {
        startDateIso: '2026-06-08',
        endDateIso: '2026-06-08',
        weekdays: [0],
        dayStartTime: '10:00',
        dayEndTime: '13:00',
        slotDurationMinutes: 60,
      },
      new Date('2026-06-01T00:00:00'),
    );

    assert.ok(planned.length >= 2);

    const filtered = filterNonOverlappingBatch(planned, [
      { startsAt: planned[0]!.startsAtIso, endsAt: planned[0]!.endsAtIso },
    ]);

    assert.equal(filtered.skippedOverlap, 1);
    assert.equal(filtered.toCreate.length, planned.length - 1);
  });
});
