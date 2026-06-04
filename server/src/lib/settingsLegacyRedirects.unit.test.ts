import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/** Mirror of frontend mapLegacyAdminSettingsPath for route contract tests. */
function mapLegacyAdminSettingsPath(pathname: string): string {
  const MASTER_SETTINGS_PATH = '/master/settings';
  const MASTER_SETTINGS_SECURITY_PATH = '/master/settings/security';
  const MASTER_SETTINGS_SUPPORT_PATH = '/master/settings/support';

  const rest = pathname.replace(/^\/admin\/settings\/?/, '');
  if (!rest || rest === '/') return MASTER_SETTINGS_SECURITY_PATH;
  if (rest === 'login-methods') return MASTER_SETTINGS_SECURITY_PATH;
  if (rest === 'support' || rest.startsWith('documents')) return MASTER_SETTINGS_SUPPORT_PATH;
  if (rest === 'sponsor') return MASTER_SETTINGS_SUPPORT_PATH;
  const known = ['security', 'notifications', 'billing', 'team', 'integrations', 'privacy', 'support', 'about'];
  const seg = rest.split('/')[0] ?? '';
  if (known.includes(seg)) return `${MASTER_SETTINGS_PATH}/${rest}`;
  return MASTER_SETTINGS_SECURITY_PATH;
}

describe('mapLegacyAdminSettingsPath', () => {
  it('redirects index and login-methods to security', () => {
    assert.equal(mapLegacyAdminSettingsPath('/admin/settings'), '/master/settings/security');
    assert.equal(mapLegacyAdminSettingsPath('/admin/settings/login-methods'), '/master/settings/security');
  });

  it('redirects support and billing', () => {
    assert.equal(mapLegacyAdminSettingsPath('/admin/settings/support'), '/master/settings/support');
    assert.equal(mapLegacyAdminSettingsPath('/admin/settings/billing'), '/master/settings/billing');
  });
});
