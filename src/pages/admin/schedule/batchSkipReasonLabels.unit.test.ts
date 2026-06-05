import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  batchSkipReasonLabel,
  formatBatchSuccessSummary,
  summarizeBatchSkipped,
} from './batchSkipReasonLabels';

describe('batchSkipReasonLabel', () => {
  it('maps reasons to Russian labels', () => {
    assert.equal(batchSkipReasonLabel('overlap'), 'Это время уже занято');
    assert.equal(batchSkipReasonLabel('past'), 'В прошлом');
    assert.equal(batchSkipReasonLabel('plan_limit'), 'За пределом тарифа');
    assert.equal(batchSkipReasonLabel('service_does_not_fit'), 'Услуга не помещается');
  });
});

describe('formatBatchSuccessSummary', () => {
  it('formats partial success', () => {
    const line = formatBatchSuccessSummary({ created: 84, skipped: 12, skippedReasons: [] });
    assert.match(line, /84/);
    assert.match(line, /12/);
  });

  it('does not claim success when created is zero', () => {
    const line = formatBatchSuccessSummary({
      created: 0,
      skipped: 3,
      skippedReasons: [{ date: '2026-06-10', time: '10:00', reason: 'overlap' }],
    });
    assert.doesNotMatch(line, /^Создано 0 окон\.$/);
    assert.ok(summarizeBatchSkipped({ skipped: 3, skippedReasons: [{ date: '2026-06-10', time: '10:00', reason: 'overlap' }] }));
  });
});
