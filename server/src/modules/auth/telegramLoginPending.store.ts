import { randomUUID } from 'node:crypto';
import { ApiError } from '../../utils/ApiError.js';

export type TelegramBrowserPendingSession = {
  token: string;
  profile: Record<string, unknown>;
};

type PendingEntry = {
  returnPath: string;
  createdAt: number;
  session?: TelegramBrowserPendingSession;
};

const TTL_MS = 15 * 60 * 1000;
const store = new Map<string, PendingEntry>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(id);
  }
}

export function createTelegramBrowserPending(returnPath: string): string {
  purgeExpired();
  const pendingId = randomUUID();
  const path = returnPath.trim().startsWith('/') ? returnPath.trim() : '/';
  store.set(pendingId, { returnPath: path, createdAt: Date.now() });
  return pendingId;
}

export function getTelegramBrowserPendingReturnPath(pendingId: string): string | null {
  purgeExpired();
  return store.get(pendingId.trim())?.returnPath ?? null;
}

export function completeTelegramBrowserPending(
  pendingId: string,
  session: TelegramBrowserPendingSession,
): void {
  purgeExpired();
  const key = pendingId.trim();
  const entry = store.get(key);
  if (!entry) {
    throw ApiError.badRequest(
      'Сессия входа через Telegram устарела. Начните вход заново в браузере.',
      'TELEGRAM_LOGIN_PENDING_EXPIRED',
    );
  }
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(key);
    throw ApiError.badRequest(
      'Сессия входа через Telegram устарела. Начните вход заново в браузере.',
      'TELEGRAM_LOGIN_PENDING_EXPIRED',
    );
  }
  entry.session = session;
  store.set(key, entry);
}

export type TelegramBrowserPendingPoll =
  | { status: 'waiting' }
  | { status: 'complete'; token: string; profile: Record<string, unknown> };

export function pollTelegramBrowserPending(pendingId: string): TelegramBrowserPendingPoll {
  purgeExpired();
  const key = pendingId.trim();
  const entry = store.get(key);
  if (!entry) {
    throw ApiError.badRequest(
      'Сессия входа через Telegram устарела. Начните вход заново.',
      'TELEGRAM_LOGIN_PENDING_EXPIRED',
    );
  }
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(key);
    throw ApiError.badRequest(
      'Сессия входа через Telegram устарела. Начните вход заново.',
      'TELEGRAM_LOGIN_PENDING_EXPIRED',
    );
  }
  if (!entry.session) {
    return { status: 'waiting' };
  }
  store.delete(key);
  return {
    status: 'complete',
    token: entry.session.token,
    profile: entry.session.profile,
  };
}
