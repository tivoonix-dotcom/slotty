import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPhoneLikeDisplayName,
  resolveClientAnalyticsDisplayName,
} from './clientAnalyticsIdentity';

test('resolveClientAnalyticsDisplayName uses profile name', () => {
  assert.equal(
    resolveClientAnalyticsDisplayName({
      appointmentId: 'a1',
      profileFullName: 'Иванова Мария',
      nameSnapshot: '+375 44 543 45 32',
      phoneSnapshot: '+375 44 543 45 32',
    }),
    'Иванова Мария',
  );
});

test('phone is not used as primary display name', () => {
  const name = resolveClientAnalyticsDisplayName({
    appointmentId: 'a1',
    nameSnapshot: '+375 44 543 45 32',
    phoneSnapshot: '+375 44 543 45 32',
  });
  assert.equal(name, 'Клиент без имени');
  assert.equal(isPhoneLikeDisplayName(name), false);
});

test('email fallback when no name', () => {
  assert.equal(
    resolveClientAnalyticsDisplayName({
      appointmentId: 'a1',
      emailSnapshot: 'client@example.com',
    }),
    'client@example.com',
  );
});
