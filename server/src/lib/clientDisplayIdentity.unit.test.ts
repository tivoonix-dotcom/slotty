import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveClientDisplayIdentity, resolveClientDisplayName } from './clientDisplayIdentity.js';

test('resolveClientDisplayName prefers master display name', () => {
  const name = resolveClientDisplayName({
    masterDisplayName: 'Анна Мастер',
    masterPhotoUrl: 'https://cdn.example/photo.jpg',
    profileFullName: '',
    nameSnapshot: '+375 44 543 45 32',
    phoneSnapshot: '+375 44 543 45 32',
  });
  assert.equal(name, 'Анна Мастер');
});

test('resolveClientDisplayName uses profile name over phone snapshot', () => {
  const name = resolveClientDisplayName({
    profileFullName: 'Мария Иванова',
    nameSnapshot: '+375 44 543 45 32',
    phoneSnapshot: '+375 44 543 45 32',
  });
  assert.equal(name, 'Мария Иванова');
});

test('resolveClientDisplayName never shows bare phone', () => {
  assert.equal(
    resolveClientDisplayName({
      profileFullName: '',
      nameSnapshot: '+375 44 543 45 32',
      phoneSnapshot: '+375 44 543 45 32',
    }),
    'Клиент',
  );
  assert.equal(
    resolveClientDisplayName({
      profileFullName: '',
      nameSnapshot: '+375 44 543 45 32',
      phoneSnapshot: '+375 44 543 45 32',
      telegramUsername: 'maria_nails',
    }),
    '@maria_nails',
  );
});

test('resolveClientDisplayIdentity returns master photo first', () => {
  const identity = resolveClientDisplayIdentity({
    masterDisplayName: 'Анна',
    masterPhotoUrl: 'https://cdn.example/master.jpg',
    profileAvatarUrl: 'https://cdn.example/profile.jpg',
  });
  assert.equal(identity.avatarUrl, 'https://cdn.example/master.jpg');
});
