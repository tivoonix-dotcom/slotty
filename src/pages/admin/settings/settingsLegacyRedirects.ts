import {
  MASTER_SETTINGS_PATH,
  MASTER_SETTINGS_SECURITY_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
} from '../../../app/paths';

/** Maps `/admin/settings/*` to canonical `/master/settings/*`. */
export function mapLegacyAdminSettingsPath(pathname: string): string {
  const rest = pathname.replace(/^\/admin\/settings\/?/, '');

  if (!rest || rest === '/') {
    return MASTER_SETTINGS_SECURITY_PATH;
  }
  if (rest === 'login-methods') {
    return MASTER_SETTINGS_SECURITY_PATH;
  }
  if (rest === 'support' || rest.startsWith('documents')) {
    return MASTER_SETTINGS_SUPPORT_PATH;
  }
  if (rest === 'sponsor') {
    return MASTER_SETTINGS_SUPPORT_PATH;
  }

  const known = ['security', 'notifications', 'billing', 'team', 'integrations', 'privacy', 'support', 'about'];
  const seg = rest.split('/')[0] ?? '';
  if (known.includes(seg)) {
    return `${MASTER_SETTINGS_PATH}/${rest}`;
  }

  return MASTER_SETTINGS_SECURITY_PATH;
}
