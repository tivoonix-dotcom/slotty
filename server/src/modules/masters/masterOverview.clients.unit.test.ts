import assert from 'node:assert/strict';
import test from 'node:test';
import { computeOverviewClients, type OverviewAppointmentRow } from './masterOverview.analytics.js';

function row(
  partial: Partial<OverviewAppointmentRow> & Pick<OverviewAppointmentRow, 'id' | 'clientId' | 'date'>,
): OverviewAppointmentRow {
  const clientDisplayName =
    partial.clientDisplayName ??
    partial.clientName ??
    'Клиент без имени';
  const clientKey =
    partial.clientKey ??
    (partial.clientId?.trim()
      ? `id:${partial.clientId.trim()}`
      : partial.clientPhone
        ? `phone:${partial.clientPhone.replace(/\D/g, '')}`
        : `appt:${partial.id}`);

  return {
    clientName: clientDisplayName,
    clientDisplayName,
    clientPhone: partial.clientPhone ?? null,
    clientEmail: partial.clientEmail ?? null,
    clientKey,
    serviceTitle: 'Услуга',
    time: '10:00',
    priceByn: 50,
    status: partial.status ?? 'completed',
    dbStatus: partial.dbStatus ?? partial.status ?? 'completed',
    ...partial,
  };
}

test('Scenario B: two completed visits in same period → one unique repeat client', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: 'user-1',
      clientDisplayName: 'Мария Иванова',
      clientPhone: '+375 29 123 45 67',
      date: '2026-06-04',
    }),
    row({
      id: 'a2',
      clientId: 'user-1',
      clientDisplayName: 'Мария Иванова',
      clientPhone: '+375 29 123 45 67',
      date: '2026-06-05',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');

  assert.equal(result.totalClients, 1);
  assert.equal(result.newClients, 1);
  assert.equal(result.newOnlyClients, 0);
  assert.equal(result.returningClients, 1);
  assert.equal(result.repeatClients, 1);
  assert.equal(result.returningRate, 1);
  assert.equal(result.roster[0]?.displayName, 'Мария Иванова');
  assert.equal(result.roster[0]?.phone, '+375 29 123 45 67');
  assert.equal(result.roster[0]?.visitsCount, 2);
  assert.equal(result.roster[0]?.totalCompletedVisitsAllTime, 2);
  assert.equal(result.roster[0]?.isReturning, true);
});

test('Scenario A: one completed visit → new client', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: 'user-1',
      clientDisplayName: 'Анна Петрова',
      date: '2026-06-10',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');

  assert.equal(result.totalClients, 1);
  assert.equal(result.newClients, 1);
  assert.equal(result.newOnlyClients, 1);
  assert.equal(result.returningClients, 0);
  assert.equal(result.roster[0]?.isReturning, false);
});

test('repeat client grouped by client_id despite phone label on first row', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: 'user-1',
      clientDisplayName: '+375291234567',
      clientPhone: '+375291234567',
      date: '2026-05-01',
    }),
    row({
      id: 'a2',
      clientId: 'user-1',
      clientDisplayName: 'Мария Иванова',
      clientPhone: '+375 29 123 45 67',
      date: '2026-06-01',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');

  assert.equal(result.returningClients, 1);
  assert.equal(result.newClients, 0);
  assert.equal(result.roster[0]?.displayName, 'Мария Иванова');
  assert.equal(result.roster[0]?.isReturning, true);
  assert.equal(result.roster[0]?.visitsCount, 1);
});

test('Scenario C: visit before period + one in period → returning', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({ id: 'a1', clientId: 'u1', clientDisplayName: 'Клиент A', date: '2026-05-15' }),
    row({ id: 'a2', clientId: 'u1', clientDisplayName: 'Клиент A', date: '2026-06-10' }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');
  assert.equal(result.totalClients, 1);
  assert.equal(result.returningClients, 1);
  assert.equal(result.newClients, 0);
});

test('Scenario D: two clients — one new-only, one repeat', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({ id: 'a1', clientId: 'a', clientDisplayName: 'Клиент A', date: '2026-06-01' }),
    row({ id: 'a2', clientId: 'b', clientDisplayName: 'Клиент B', date: '2026-06-02' }),
    row({ id: 'a3', clientId: 'b', clientDisplayName: 'Клиент B', date: '2026-06-10' }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');
  assert.equal(result.totalClients, 2);
  assert.equal(result.newClients, 2);
  assert.equal(result.newOnlyClients, 1);
  assert.equal(result.returningClients, 1);
});

test('Scenario E: client without name shows fallback and phone separately', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: '',
      clientKey: 'phone:375291112233',
      clientDisplayName: 'Клиент без имени',
      clientPhone: '+375 29 111 22 33',
      date: '2026-06-01',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');
  assert.equal(result.roster[0]?.displayName, 'Клиент без имени');
  assert.equal(result.roster[0]?.phone, '+375 29 111 22 33');
});

test('Scenario F: cancelled visits do not count toward client metrics', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: 'u1',
      clientDisplayName: 'Клиент',
      date: '2026-06-01',
      status: 'cancelled',
      dbStatus: 'cancelled_by_client',
    }),
    row({
      id: 'a2',
      clientId: 'u1',
      clientDisplayName: 'Клиент',
      date: '2026-06-05',
      status: 'completed',
      dbStatus: 'completed',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');
  assert.equal(result.returningClients, 0);
  assert.equal(result.newClients, 1);
  assert.equal(result.roster[0]?.visitsCount, 1);
});

test('repeat client counted by normalized phone when no clientId', () => {
  const appointments: OverviewAppointmentRow[] = [
    row({
      id: 'a1',
      clientId: '',
      clientKey: 'phone:375291112233',
      clientDisplayName: 'Клиент без имени',
      clientPhone: '+375 (29) 111-22-33',
      date: '2026-06-01',
    }),
    row({
      id: 'a2',
      clientId: '',
      clientKey: 'phone:375291112233',
      clientDisplayName: 'Клиент без имени',
      clientPhone: '+375 29 111 22 33',
      date: '2026-06-08',
    }),
  ];

  const result = computeOverviewClients(appointments, '2026-06-01', '2026-06-30');
  assert.equal(result.returningClients, 1);
  assert.equal(result.roster[0]?.visitsCount, 2);
  assert.equal(result.roster.length, 1);
});
