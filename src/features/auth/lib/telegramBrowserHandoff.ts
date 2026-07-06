import { completeTelegramBrowserLoginPending } from '../api/authApi';
import { getStoredAuthToken } from '../../../shared/api/backendClient';

export const TG_BROWSER_PENDING_PARAM = 'tg_browser_pending';
export const TG_BROWSER_PENDING_STORAGE_KEY = 'slotty_tg_browser_pending_id';
const TG_BROWSER_HANDOFF_DONE_PREFIX = 'slotty_tg_browser_handoff_done:';

export function readTelegramBrowserPendingIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get(TG_BROWSER_PENDING_PARAM)?.trim();
  return id || null;
}

export function readStoredTelegramBrowserPendingId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(TG_BROWSER_PENDING_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function persistTelegramBrowserPendingId(pendingId: string): void {
  try {
    sessionStorage.setItem(TG_BROWSER_PENDING_STORAGE_KEY, pendingId);
  } catch {
    /* ignore */
  }
}

export function clearStoredTelegramBrowserPendingId(): void {
  try {
    sessionStorage.removeItem(TG_BROWSER_PENDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function markHandoffDone(pendingId: string): void {
  try {
    sessionStorage.setItem(`${TG_BROWSER_HANDOFF_DONE_PREFIX}${pendingId}`, '1');
  } catch {
    /* ignore */
  }
}

function isHandoffDone(pendingId: string): boolean {
  try {
    return sessionStorage.getItem(`${TG_BROWSER_HANDOFF_DONE_PREFIX}${pendingId}`) === '1';
  } catch {
    return false;
  }
}

export function stripTelegramBrowserPendingParam(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(TG_BROWSER_PENDING_PARAM)) return;
  url.searchParams.delete(TG_BROWSER_PENDING_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Mini App передаёт JWT в ожидающий браузер. */
export async function completeTelegramBrowserHandoffIfNeeded(): Promise<boolean> {
  const pendingId = readTelegramBrowserPendingIdFromUrl();
  if (!pendingId) return false;
  if (isHandoffDone(pendingId)) {
    stripTelegramBrowserPendingParam();
    return true;
  }
  if (!getStoredAuthToken()) return false;

  try {
    await completeTelegramBrowserLoginPending(pendingId);
    markHandoffDone(pendingId);
    stripTelegramBrowserPendingParam();
    return true;
  } catch (e) {
    console.warn('[auth] telegram browser handoff complete failed:', e);
    return false;
  }
}
