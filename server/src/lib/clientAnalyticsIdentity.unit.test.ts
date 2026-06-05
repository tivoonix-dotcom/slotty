import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClientAnalyticsKey,
  normalizePhoneForClientKey,
  resolveClientAnalyticsDisplayName,
} from './clientAnalyticsIdentity.js';

test('resolveClientAnalyticsDisplayName prefers profile name over phone snapshot', () => {
  assert.equal(
    resolveClientAnalyticsDisplayName({
      appointmentId: 'a1',
      profileFullName: 'Мария Иванова',
      nameSnapshot: '+375 44 543 45 32',
      phoneSnapshot: '+375 44 543 45 32',
    }),
    'Мария Иванова',
  );
});

test('resolveClientAnalyticsDisplayName never uses phone as primary name', () => {
  assert.equal(
    resolveClientAnalyticsDisplayName({
      appointmentId: 'a1',
      nameSnapshot: '+375 44 543 45 32',
      phoneSnapshot: '+375 44 543 45 32',
    }),
    'Клиент без имени',
  );
});

test('buildClientAnalyticsKey groups by client id first', () => {
  assert.equal(
    buildClientAnalyticsKey({
      appointmentId: 'a1',
      clientId: 'user-1',
      phoneSnapshot: '+375 29 111 22 33',
    }),
    'id:user-1',
  );
});

test('buildClientAnalyticsKey falls back to normalized phone', () => {
  const phone = '+375 29 111-22-33';
  assert.equal(
    buildClientAnalyticsKey({
      appointmentId: 'a1',
      phoneSnapshot: phone,
    }),
    `phone:${normalizePhoneForClientKey(phone)}`,
  );
});
