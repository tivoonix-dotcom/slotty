import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { resolvePublicApiBaseUrl } from '../telegram/telegram.webhookConfig.js';

export function isBePaidEnabled(): boolean {
  return env.BEPAID_ENABLED === true;
}

export function isBePaidConfigured(): boolean {
  return Boolean(env.BEPAID_SHOP_ID?.trim() && env.BEPAID_SECRET_KEY?.trim());
}

/** Готовность checkout: включён флаг и заданы shop id + secret. */
export function assertBePaidReady(): void {
  if (!isBePaidEnabled()) {
    throw ApiError.serviceUnavailable(
      'Онлайн-оплата временно недоступна. Включите BEPAID_ENABLED на сервере.',
      'BEPAID_DISABLED',
    );
  }
  if (!env.BEPAID_SHOP_ID?.trim()) {
    throw ApiError.serviceUnavailable(
      'Онлайн-оплата не настроена: укажите BEPAID_SHOP_ID (ID магазина в CRM bePaid).',
      'BEPAID_SHOP_ID_MISSING',
    );
  }
  if (!env.BEPAID_SECRET_KEY?.trim()) {
    throw ApiError.serviceUnavailable(
      'Онлайн-оплата не настроена: укажите BEPAID_SECRET_KEY (секретный ключ магазина).',
      'BEPAID_SECRET_MISSING',
    );
  }
}

/** @deprecated use assertBePaidReady */
export function assertBePaidConfigured(): void {
  assertBePaidReady();
}

export function logBePaidConfigStatus(): void {
  const enabled = isBePaidEnabled();
  const configured = isBePaidConfigured();
  const notificationUrl = getBePaidNotificationUrl();
  if (enabled && configured) {
    console.info('[SLOTTY] bePaid: включён', {
      shopId: env.BEPAID_SHOP_ID?.trim(),
      env: env.BEPAID_ENV,
      testCheckout: isBePaidTestMode(),
      notificationUrl: notificationUrl ?? '(не задан — webhook не придёт)',
    });
    return;
  }
  if (env.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!enabled) missing.push('BEPAID_ENABLED=true');
    if (!env.BEPAID_SHOP_ID?.trim()) missing.push('BEPAID_SHOP_ID');
    if (!env.BEPAID_SECRET_KEY?.trim()) missing.push('BEPAID_SECRET_KEY');
    console.warn(
      `[SLOTTY] bePaid: не готов — POST /api/payments/bepaid/create вернёт 503. Нужно: ${missing.join(', ')}`,
    );
  }
}

export function getBePaidCheckoutApiUrl(): string {
  const base = env.BEPAID_CHECKOUT_API_URL?.trim() || 'https://checkout.bepaid.by/ctp/api/checkouts';
  return base;
}

export function getBePaidNotificationUrl(): string | undefined {
  const explicit = env.BEPAID_NOTIFICATION_URL?.trim();
  if (explicit) return explicit;
  const publicApi = resolvePublicApiBaseUrl();
  if (publicApi) {
    return `${publicApi}/api/payments/bepaid/webhook`;
  }
  return undefined;
}

const DEFAULT_SUCCESS = 'https://slotty.of.by/payment/success';
const DEFAULT_FAIL = 'https://slotty.of.by/payment/fail';

export function getBePaidSuccessUrl(returnUrl?: string): string {
  if (returnUrl?.trim()) return returnUrl.trim();
  return env.BEPAID_SUCCESS_URL ?? DEFAULT_SUCCESS;
}

export function getBePaidFailUrl(): string {
  return env.BEPAID_FAIL_URL ?? DEFAULT_FAIL;
}

export function isBePaidTestMode(): boolean {
  return env.BEPAID_ENV !== 'production';
}
