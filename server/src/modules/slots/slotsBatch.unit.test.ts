import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildBatchCandidates, mapSkipReason } from './slotsBatch.service.js';

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('buildBatchCandidates', () => {
  it('generates slots for weekdays in range', () => {
    const start = isoToday();
    const end = addDaysIso(start, 6);
    const candidates = buildBatchCandidates(
      {
        startDate: start,
        endDate: end,
        weekdays: [0, 1, 2, 3, 4],
        dayStartTime: '10:00',
        dayEndTime: '12:00',
        slotDurationMinutes: 60,
      },
      new Date(`${start}T08:00:00`),
    );
    assert.ok(candidates.length > 0);
    for (const c of candidates) {
      assert.ok(c.date >= start && c.date <= end);
      assert.ok(c.startsAt >= new Date(`${start}T08:00:00`));
    }
  });

  it('excludes past slot times from candidates', () => {
    const start = isoToday();
    const candidates = buildBatchCandidates(
      {
        startDate: start,
        endDate: start,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        dayStartTime: '08:00',
        dayEndTime: '09:00',
        slotDurationMinutes: 60,
      },
      new Date(`${start}T23:59:00`),
    );
    assert.equal(candidates.length, 0);
  });

  it('returns empty for invalid time range', () => {
    const start = isoToday();
    const candidates = buildBatchCandidates(
      {
        startDate: start,
        endDate: start,
        weekdays: [0],
        dayStartTime: '18:00',
        dayEndTime: '10:00',
        slotDurationMinutes: 60,
      },
      new Date(`${start}T08:00:00`),
    );
    assert.equal(candidates.length, 0);
  });
});

describe('mapSkipReason', () => {
  it('maps API codes to batch reasons', () => {
    assert.equal(mapSkipReason('SLOT_OVERLAP'), 'overlap');
    assert.equal(mapSkipReason('SLOT_IN_PAST'), 'past');
    assert.equal(mapSkipReason('LIMIT_SCHEDULE_DAYS_REACHED'), 'plan_limit');
    assert.equal(mapSkipReason('SERVICE_DOES_NOT_FIT'), 'service_does_not_fit');
    assert.equal(mapSkipReason(undefined), 'invalid');
  });
});
