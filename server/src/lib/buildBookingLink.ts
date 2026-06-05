import { env } from '../config/env.js';
import { publicAppUrl, resolvePublicAppOrigin } from './publicAppUrl.js';

export type BookingLinkRole = 'client' | 'master';
export type BookingLinkSource = 'telegram' | 'email' | 'web';

const VOUCHER_PATTERN = /^SL-[A-Z0-9]{12}$/i;

export function normalizeBookingCode(raw: string): string {
  const code = raw.trim().toUpperCase();
  if (!VOUCHER_PATTERN.test(code)) {
    throw new Error('INVALID_BOOKING_CODE');
  }
  return code;
}

/** Путь в SPA (без origin). Клиент — страница записи с картой и действиями. */
export function buildBookingPath(role: BookingLinkRole, bookingCode: string): string {
  const code = encodeURIComponent(normalizeBookingCode(bookingCode));
  return role === 'client' ? `/client/appointments/${code}` : `/master/appointments/${code}`;
}

function resolveLinkOrigin(preferWebApp: boolean): string {
  if (preferWebApp) {
    const webApp = env.WEB_APP_URL?.trim().replace(/\/$/, '');
    if (webApp) return webApp;
    const client = env.CLIENT_URL?.trim().replace(/\/$/, '');
    if (client) return client;
  }
  return resolvePublicAppOrigin();
}

/**
 * Абсолютная ссылка на конкретную запись в кабинете клиента или мастера.
 * Для Telegram inline-кнопок используйте source: 'telegram' (origin = WEB_APP_URL).
 */
export function buildBookingLink(params: {
  role: BookingLinkRole;
  bookingCode: string;
  source?: BookingLinkSource;
}): string {
  const path = buildBookingPath(params.role, params.bookingCode);
  const preferWebApp = params.source === 'telegram';
  const base = resolveLinkOrigin(preferWebApp);
  const url = new URL(path, `${base}/`);
  if (params.source) {
    url.searchParams.set('source', params.source);
  }
  return url.toString();
}

/** Ссылка для email (канонический публичный origin). */
export function buildBookingEmailLink(role: BookingLinkRole, bookingCode: string): string {
  const path = buildBookingPath(role, bookingCode);
  const url = new URL(path, `${publicAppUrl('/')}/`);
  url.searchParams.set('source', 'email');
  return url.toString();
}
