import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertBePaidReady, isBePaidTestMode } from '../payments/bepaid.config.js';

export type BePaidTokenChargeParams = {
  trackingId: string;
  amountMinor: number;
  currency: string;
  description: string;
  cardToken: string;
  customerEmail?: string | null;
};

export type BePaidTokenChargeResult = {
  uid: string;
  status: 'successful' | 'failed' | 'pending' | 'error';
  message?: string;
  brand?: string;
  last4?: string;
  raw: unknown;
};

function gatewayAuthHeader(): string {
  const shopId = env.BEPAID_SHOP_ID!.trim();
  const secret = env.BEPAID_SECRET_KEY!.trim();
  return `Basic ${Buffer.from(`${shopId}:${secret}`, 'utf8').toString('base64')}`;
}

function gatewayBaseUrl(): string {
  return env.BEPAID_GATEWAY_URL?.trim() || 'https://gateway.bepaid.by';
}

/** Merchant-initiated recurring charge по сохранённому токену карты. */
export async function chargeBePaidWithCardToken(
  params: BePaidTokenChargeParams,
): Promise<BePaidTokenChargeResult> {
  assertBePaidReady();
  if (!env.BEPAID_RECURRING_ENABLED) {
    throw ApiError.serviceUnavailable(
      'Автосписание отключено (BEPAID_RECURRING_ENABLED=false)',
      'BEPAID_RECURRING_DISABLED',
    );
  }
  if (!params.cardToken.trim()) {
    throw ApiError.badRequest('Нет токена карты для списания', 'CARD_TOKEN_MISSING');
  }

  const body = {
    request: {
      amount: params.amountMinor,
      currency: params.currency,
      description: params.description,
      tracking_id: params.trackingId,
      test: isBePaidTestMode(),
      credit_card: {
        token: params.cardToken.trim(),
        skip_three_d_secure_verification: false,
      },
      additional_data: {
        contract: ['recurring'],
      },
      customer: {
        email: params.customerEmail ?? undefined,
        ip: '127.0.0.1',
      },
    },
  };

  const res = await fetch(`${gatewayBaseUrl()}/transactions/payments`, {
    method: 'POST',
    headers: {
      Authorization: gatewayAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 800) };
  }

  if (!res.ok) {
    console.error('[bepaid] token charge HTTP error', { status: res.status });
    throw ApiError.badRequest('Ошибка списания у провайдера', 'BEPAID_TOKEN_CHARGE_FAILED');
  }

  const tx =
    json && typeof json === 'object' && 'transaction' in json
      ? (json as { transaction?: Record<string, unknown> }).transaction
      : null;
  if (!tx) {
    throw ApiError.internal('Некорректный ответ gateway bePaid');
  }

  const rawStatus = String(tx.status ?? '').toLowerCase();
  const uid = tx.uid ? String(tx.uid) : params.trackingId;
  const cc =
    tx.credit_card && typeof tx.credit_card === 'object'
      ? (tx.credit_card as Record<string, unknown>)
      : null;

  let status: BePaidTokenChargeResult['status'] = 'pending';
  if (rawStatus === 'successful') status = 'successful';
  else if (rawStatus === 'failed' || rawStatus === 'error') status = 'failed';

  return {
    uid,
    status,
    message: tx.message ? String(tx.message) : undefined,
    brand: cc?.brand ? String(cc.brand) : undefined,
    last4: cc?.last_4 ? String(cc.last_4) : cc?.last4 ? String(cc.last4) : undefined,
    raw: json,
  };
}

export function isBePaidRecurringConfigured(): boolean {
  return env.BEPAID_RECURRING_ENABLED === true && Boolean(env.BEPAID_SHOP_ID?.trim() && env.BEPAID_SECRET_KEY?.trim());
}
