import { ADMIN_PATH, getProfilePath, PLATFORM_ADMIN_PATH, ADMIN_OVERVIEW_PATH } from '../../../app/paths';
import type { BackendProfile } from '../types';
import { hasMasterCabinetAccess } from './hasMasterCabinetAccess';

/** Куда отправить клиента после входа на /login. */
export function getPostClientLoginPath(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const from = params.get('from') ?? params.get('redirect');
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return from;
  }
  return getProfilePath('appointments');
}

/** Куда отправить после входа (Telegram / Google / email), с учётом роли и кабинета мастера. */
export function getPostLoginPath(
  profile: Pick<BackendProfile, 'role' | 'hasMasterProfile'> | null | undefined,
  search = '',
): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const from = params.get('from') ?? params.get('redirect');
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return from;
  }

  if (!profile) return getPostClientLoginPath(search);

  if (hasMasterCabinetAccess(profile)) {
    return ADMIN_OVERVIEW_PATH;
  }

  if (profile.role === 'client') {
    return getPostClientLoginPath(search);
  }

  if (profile.role === 'platform_admin') {
    return PLATFORM_ADMIN_PATH;
  }

  if (profile.role === 'master') {
    return ADMIN_PATH;
  }

  return getPostClientLoginPath(search);
}

/** @deprecated Используйте getPostLoginPath(profile, search) */
export function getPostMasterLoginPath(
  role: string | undefined,
  hasMasterProfile?: boolean,
): string {
  return getPostLoginPath({ role: role ?? 'client', hasMasterProfile });
}

/** После OAuth redirect (GoogleOAuthDonePage). */
export function getPostOAuthLoginPath(
  profile: Pick<BackendProfile, 'role' | 'hasMasterProfile'> | null | undefined,
  search: string,
): string {
  return getPostLoginPath(profile, search);
}
