import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { getBePaidCheckoutApiUrl, isBePaidTestMode } from './bepaid.config.js';

export type BePaidCheckoutCreateParams = {
  trackingId: string;
  amountMinor: number;
  currency: string;
  description: string;
  notificationUrl?: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string | null;
  language?: string;
};

export type BePaidCheckoutCreateResult = {
  token: string;
  redirectUrl: string;
};

function basicAuthHeader(): string {
  const shopId = env.BEPAID_SHOP_ID!.trim();
  const secret = env.BEPAID_SECRET_KEY!.trim();
  const encoded = Buffer.from(`${shopId}:${secret}`, 'utf8').toString('base64');
  return `Basic ${encoded}`;
}

export async function createBePaidCheckout(
  params: BePaidCheckoutCreateParams,
): Promise<BePaidCheckoutCreateResult> {
  const body = {
    checkout: {
      test: isBePaidTestMode(),
      transaction_type: 'payment',
      order: {
        amount: params.amountMinor,
        currency: params.currency,
        description: params.description,
        tracking_id: params.trackingId,
        additional_data: {
          contract: ['recurring'],
        },
      },
      settings: {
        success_url: params.successUrl,
        fail_url: params.failUrl,
        decline_url: params.failUrl,
        cancel_url: params.failUrl,
        language: params.language ?? 'ru',
        ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
      },
      ...(params.customerEmail
        ? {
            customer: {
              email: params.customerEmail,
            },
          }
        : {}),
    },
  };

  const res = await fetch(getBePaidCheckoutApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-Version': '2',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    console.error('[bepaid] checkout create failed', {
      status: res.status,
      message: typeof json === 'object' && json && 'message' in json ? (json as { message: string }).message : undefined,
    });
    throw ApiError.badRequest('Не удалось создать платёж у провайдера', 'BEPAID_CHECKOUT_FAILED');
  }

  const checkout =
    json && typeof json === 'object' && 'checkout' in json
      ? (json as { checkout?: { token?: string; redirect_url?: string } }).checkout
      : null;
  const token = checkout?.token?.trim();
  const redirectUrl = checkout?.redirect_url?.trim();
  if (!token || !redirectUrl) {
    console.error('[bepaid] checkout response missing token/redirect_url');
    throw ApiError.internal('Некорректный ответ bePaid');
  }

  return { token, redirectUrl };
}

export function verifyBePaidWebhookBasicAuth(authorizationHeader: string | undefined): boolean {
  if (!authorizationHeader?.startsWith('Basic ')) return false;
  const expectedShop = env.BEPAID_SHOP_ID?.trim();
  const expectedSecret = env.BEPAID_SECRET_KEY?.trim();
  if (!expectedShop || !expectedSecret) return false;
  try {
    const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon < 0) return false;
    const shopId = decoded.slice(0, colon);
    const secret = decoded.slice(colon + 1);
    return shopId === expectedShop && secret === expectedSecret;
  } catch {
    return false;
  }
}

/** Проверка shared secret в заголовке X-Webhook-Secret. Без секрета в env — false (fail-closed). */
export function verifyBePaidWebhookSecret(headerValue: string | undefined): boolean {
  const expected = env.BEPAID_WEBHOOK_SECRET?.trim();
  if (!expected) return false;
  return Boolean(headerValue?.trim() && headerValue.trim() === expected);
}
