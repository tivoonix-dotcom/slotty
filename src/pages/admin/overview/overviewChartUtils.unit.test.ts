import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChartYTicks, focusChartStats, niceChartAxisMax } from './overviewChartUtils.ts';

test('buildChartYTicks avoids duplicate labels for small visit counts', () => {
  assert.deepEqual(buildChartYTicks(1, 'visits'), [0, 1]);
});

test('niceChartAxisMax caps visits axis at 1 for single booking', () => {
  assert.equal(niceChartAxisMax(1, 'visits'), 1);
});

test('focusChartStats zooms to active days when period is sparse', () => {
  const stats = [
    { date: '2026-06-01', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-02', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-03', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-04', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-05', completedRevenue: 44, activeVisits: 1 },
    { date: '2026-06-06', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-07', completedRevenue: 0, activeVisits: 0 },
    { date: '2026-06-08', completedRevenue: 0, activeVisits: 0 },
  ];

  const focused = focusChartStats(stats, 'visits');
  assert.ok(focused.length <= 5);
  assert.equal(focused.some((s) => s.date === '2026-06-05'), true);
});
