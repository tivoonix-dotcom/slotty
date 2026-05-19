import { getApiBaseUrl, getStoredAuthToken } from '../../../shared/api/backendClient';

/** UUID мастера из PostgreSQL (не demo-*). */
export const MASTER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hasApiBackend(): boolean {
  return Boolean(getApiBaseUrl());
}

export function canSyncFavoritesWithApi(): boolean {
  return hasApiBackend() && Boolean(getStoredAuthToken());
}

/** В production (VITE_API_URL) избранное только через API + Telegram. */
export function favoritesRequireTelegramAuth(): boolean {
  return hasApiBackend();
}

export function isPersistableMasterId(masterId: string | undefined | null): boolean {
  const id = typeof masterId === 'string' ? masterId.trim() : '';
  if (!id || id.startsWith('demo-')) return false;
  if (hasApiBackend()) return MASTER_UUID_RE.test(id);
  return true;
}
