import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMasterEntryLabel,
  resolveMasterEntryPath,
  resolveMasterHeroCtaLabel,
} from './resolveMasterEntryPath';

describe('resolveMasterEntryPath', () => {
  it('master user goes to cabinet', () => {
    assert.equal(
      resolveMasterEntryPath({ isAuthenticated: true, isMasterUser: true }),
      '/admin/overview',
    );
  });

  it('authenticated client goes to onboarding', () => {
    assert.equal(
      resolveMasterEntryPath({ isAuthenticated: true, isMasterUser: false }),
      '/become-master',
    );
  });

  it('guest goes to master register with return', () => {
    const path = resolveMasterEntryPath({ isAuthenticated: false, isMasterUser: false });
    assert.match(path, /^\/master\/register\?from=/);
  });

  it('labels reflect auth state', () => {
    assert.equal(
      resolveMasterEntryLabel({ isAuthenticated: true, isMasterUser: false }),
      'Продолжить регистрацию',
    );
    assert.equal(
      resolveMasterHeroCtaLabel({ isAuthenticated: true, isMasterUser: false }),
      'Продолжить анкету мастера',
    );
  });
});
