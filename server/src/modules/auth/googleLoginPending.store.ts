import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

type PendingGoogleLogin = {
  idToken: string;
  createdAt: number;
};

const TTL_MS = 15 * 60 * 1000;
const store = new Map<string, PendingGoogleLogin>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [jti, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(jti);
  }
}

export function createPendingGoogleLogin(idToken: string): string {
  purgeExpired();
  const jti = randomUUID();
  store.set(jti, { idToken: idToken.trim(), createdAt: Date.now() });
  return jti;
}

export function consumePendingGoogleLogin(jti: string): string {
  purgeExpired();
  const key = jti.trim();
  const entry = store.get(key);
  if (!entry) {
    throw ApiError.badRequest(
      'Сессия входа через Google устарела. Начните вход заново.',
      'GOOGLE_LOGIN_PENDING_EXPIRED',
    );
  }
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(key);
    throw ApiError.badRequest(
      'Сессия входа через Google устарела. Начните вход заново.',
      'GOOGLE_LOGIN_PENDING_EXPIRED',
    );
  }
  store.delete(key);
  return entry.idToken;
}

/** Warn in production multi-instance (same pattern as google link handoff). */
export function warnIfPendingStoreNotShared(): void {
  if (env.NODE_ENV === 'production' && env.API_REPLICA_COUNT > 1) {
    console.warn(
      '[auth] Google login pending store is in-memory (single instance). Use sticky sessions or shared store for OAuth consent gate.',
    );
  }
}
