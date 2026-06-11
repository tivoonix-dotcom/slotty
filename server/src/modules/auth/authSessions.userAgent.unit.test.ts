import assert from 'node:assert/strict';
import test from 'node:test';
import { maskClientIp, normalizeStoredClientIp } from './authSessions.userAgent.js';

test('normalizeStoredClientIp unwraps IPv4-mapped localhost', () => {
  assert.equal(normalizeStoredClientIp('::ffff:127.0.0.1'), '127.0.0.1');
  assert.equal(normalizeStoredClientIp('127.0.0.1:49366'), '127.0.0.1');
  assert.equal(normalizeStoredClientIp('::1'), '127.0.0.1');
});

test('maskClientIp hides localhost as local network label', () => {
  assert.equal(maskClientIp('::ffff:127.0.0.1'), 'Локальная сеть');
  assert.equal(maskClientIp('127.0.0.1'), 'Локальная сеть');
  assert.equal(maskClientIp('203.0.113.45'), '203.0.*.*');
});
