import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClientAnalyticsDebugSnapshot,
  buildClientAnalyticsSnapshot,
  type ClientAnalyticsVisitRow,
} from './clientAnalyticsCore.js';

function visit(
  partial: Partial<ClientAnalyticsVisitRow> & Pick<ClientAnalyticsVisitRow, 'appointmentId' | 'clientKey' | 'visitDate'>,
): ClientAnalyticsVisitRow {
  return {
    displayName: partial.displayName ?? 'Клиент',
    serviceTitle: 'Услуга',
    dbStatus: partial.dbStatus ?? 'completed',
    ...partial,
  };
}

const PERIOD = { start: '2026-06-01', end: '2026-06-30' };
const CHART = { start: '2026-06-01', end: '2026-06-30' };

test('Test 1: one client, one completed visit in period', () => {
  const rows = [
    visit({
      appointmentId: 'a1',
      clientKey: 'id:u1',
      clientId: 'u1',
      displayName: 'Анна',
      visitDate: '2026-06-10',
    }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.newClients, 1);
  assert.equal(result.newOnlyClients, 1);
  assert.equal(result.repeatClients, 0);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-10')?.newClients, 1);
});

test('Test 2: one client, two completed visits on different dates in period', () => {
  const rows = [
    visit({
      appointmentId: 'a1',
      clientKey: 'id:u1',
      visitDate: '2026-06-03',
    }),
    visit({
      appointmentId: 'a2',
      clientKey: 'id:u1',
      visitDate: '2026-06-05',
    }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.repeatClients, 1);
  assert.equal(result.roster.length, 1);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-03')?.newClients, 1);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-03')?.repeatClients, 0);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-05')?.newClients, 0);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-05')?.repeatClients, 1);
});

test('Test 3: one client, two completed visits same day', () => {
  const rows = [
    visit({ appointmentId: 'a1', clientKey: 'id:u1', visitDate: '2026-06-05' }),
    visit({ appointmentId: 'a2', clientKey: 'id:u1', visitDate: '2026-06-05' }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.repeatClients, 1);
  const day = result.clientsPerDay.find((d) => d.date === '2026-06-05');
  assert.equal(day?.newClients, 1);
  assert.equal(day?.repeatClients, 1);
});

test('Test 4: first visit before period, second in period', () => {
  const rows = [
    visit({ appointmentId: 'a1', clientKey: 'id:u1', visitDate: '2026-05-15' }),
    visit({ appointmentId: 'a2', clientKey: 'id:u1', visitDate: '2026-06-10' }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.newClients, 0);
  assert.equal(result.repeatClients, 1);
  assert.equal(result.clientsPerDay.find((d) => d.date === '2026-06-10')?.repeatClients, 1);
});

test('Test 5: same phone different formats → one clientKey', () => {
  const rows = [
    visit({
      appointmentId: 'a1',
      clientKey: 'phone:375291112233',
      phone: '+375 (29) 111-22-33',
      visitDate: '2026-06-01',
    }),
    visit({
      appointmentId: 'a2',
      clientKey: 'phone:375291112233',
      phone: '+375 29 111 22 33',
      visitDate: '2026-06-08',
    }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.roster.length, 1);
  assert.equal(result.roster[0]?.visitsCount, 2);
});

test('Test 6: pending/cancelled/no_show/expired do not count', () => {
  const rows = [
    visit({
      appointmentId: 'a1',
      clientKey: 'id:u1',
      visitDate: '2026-06-01',
      dbStatus: 'pending',
    }),
    visit({
      appointmentId: 'a2',
      clientKey: 'id:u1',
      visitDate: '2026-06-02',
      dbStatus: 'cancelled_by_client',
    }),
    visit({
      appointmentId: 'a3',
      clientKey: 'id:u1',
      visitDate: '2026-06-03',
      dbStatus: 'no_show',
    }),
    visit({
      appointmentId: 'a4',
      clientKey: 'id:u1',
      visitDate: '2026-06-04',
      dbStatus: 'expired',
    }),
    visit({
      appointmentId: 'a5',
      clientKey: 'id:u1',
      visitDate: '2026-06-05',
      dbStatus: 'confirmed',
    }),
    visit({
      appointmentId: 'a6',
      clientKey: 'id:u1',
      visitDate: '2026-06-06',
      dbStatus: 'completed',
    }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.totalClients, 1);
  assert.equal(result.newClients, 1);
  assert.equal(result.repeatClients, 0);
  assert.equal(result.roster[0]?.visitsCount, 1);
});

test('Test 7: displayName prefers full name over email', () => {
  const rows = [
    visit({
      appointmentId: 'a1',
      clientKey: 'id:u1',
      displayName: 'Мария Иванова',
      email: 'maria@example.com',
      visitDate: '2026-06-01',
    }),
  ];

  const result = buildClientAnalyticsSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(result.roster[0]?.displayName, 'Мария Иванова');
  assert.equal(result.roster[0]?.email, 'maria@example.com');
});

test('buildClientAnalyticsDebugSnapshot exposes daily classification', () => {
  const rows = [
    visit({ appointmentId: 'a1', clientKey: 'id:u1', visitDate: '2026-06-03' }),
    visit({ appointmentId: 'a2', clientKey: 'id:u1', visitDate: '2026-06-05' }),
  ];

  const debug = buildClientAnalyticsDebugSnapshot(rows, PERIOD.start, PERIOD.end, CHART.start, CHART.end);

  assert.equal(debug.clients.length, 1);
  assert.equal(debug.clients[0]?.dailyClassification.length, 2);
  assert.equal(debug.clients[0]?.dailyClassification[0]?.isFirstVisitDay, true);
  assert.equal(debug.clients[0]?.dailyClassification[1]?.isRepeatVisitDay, true);
});
