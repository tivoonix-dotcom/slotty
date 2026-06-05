import assert from 'node:assert/strict';
import test from 'node:test';
import { pickProfileFullNameOnOAuthSync } from './displayFormat.js';

test('pickProfileFullNameOnOAuthSync keeps user-set name over Google', () => {
  assert.equal(
    pickProfileFullNameOnOAuthSync('Даник Титовец', 'Иванова Мария'),
    'Даник Титовец',
  );
});

test('pickProfileFullNameOnOAuthSync uses Google only when profile name is empty', () => {
  assert.equal(pickProfileFullNameOnOAuthSync('', 'Иванова Мария'), 'Иванова Мария');
  assert.equal(pickProfileFullNameOnOAuthSync(null, 'Иванова Мария'), 'Иванова Мария');
});

test('pickProfileFullNameOnOAuthSync replaces blocked placeholder with OAuth name', () => {
  assert.equal(pickProfileFullNameOnOAuthSync('чат', 'Иванова Мария'), 'Иванова Мария');
});
