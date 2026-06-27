import { isBePaidTestMode } from './bepaid.config.js';

export type WebhookValidationPayment = {
  id: string;
  trackingId: string;
  amountMinor: number;
  currency: string;
  status: string;
};

export type WebhookValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

function extractTransaction(body: Record<string, unknown>): Record<string, unknown> | null {
  if (body.transaction && typeof body.transaction === 'object') {
    return body.transaction as Record<string, unknown>;
  }
  return null;
}

function extractOrder(body: Record<string, unknown>): Record<string, unknown> | null {
  if (body.order && typeof body.order === 'object') {
    return body.order as Record<string, unknown>;
  }
  const tx = extractTransaction(body);
  if (tx?.order && typeof tx.order === 'object') {
    return tx.order as Record<string, unknown>;
  }
  return null;
}

export function extractWebhookTrackingId(body: Record<string, unknown>): string {
  const tx = extractTransaction(body);
  const fromTx = tx?.tracking_id ? String(tx.tracking_id) : '';
  if (fromTx) return fromTx;
  const order = extractOrder(body);
  const fromOrder = order?.tracking_id ? String(order.tracking_id) : '';
  if (fromOrder) return fromOrder;
  return String(body.tracking_id ?? '');
}

function extractWebhookAmountMinor(body: Record<string, unknown>): number | null {
  const order = extractOrder(body);
  if (order?.amount != null) {
    const n = Number(order.amount);
    return Number.isFinite(n) ? n : null;
  }
  const tx = extractTransaction(body);
  if (tx?.amount != null) {
    const n = Number(tx.amount);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractWebhookCurrency(body: Record<string, unknown>): string | null {
  const order = extractOrder(body);
  if (order?.currency) return String(order.currency).toUpperCase();
  const tx = extractTransaction(body);
  if (tx?.currency) return String(tx.currency).toUpperCase();
  return null;
}

function extractWebhookTestFlag(body: Record<string, unknown>): boolean | null {
  const tx = extractTransaction(body);
  if (tx && typeof tx.test === 'boolean') return tx.test;
  if (typeof body.test === 'boolean') return body.test;
  const checkout = body.checkout;
  if (checkout && typeof checkout === 'object' && typeof (checkout as Record<string, unknown>).test === 'boolean') {
    return (checkout as Record<string, unknown>).test as boolean;
  }
  return null;
}

/** Сверка webhook payload с payment row (fail-closed для success path). */
export function validateWebhookAgainstPayment(
  body: Record<string, unknown>,
  payment: WebhookValidationPayment,
): WebhookValidationResult {
  const trackingId = extractWebhookTrackingId(body);
  if (!trackingId || trackingId !== payment.trackingId) {
    return {
      ok: false,
      code: 'WEBHOOK_TRACKING_MISMATCH',
      message: 'tracking_id does not match payment',
    };
  }

  const amountMinor = extractWebhookAmountMinor(body);
  if (amountMinor != null && amountMinor !== payment.amountMinor) {
    return {
      ok: false,
      code: 'WEBHOOK_AMOUNT_MISMATCH',
      message: 'amount does not match payment',
    };
  }

  const currency = extractWebhookCurrency(body);
  if (currency && currency !== payment.currency.toUpperCase()) {
    return {
      ok: false,
      code: 'WEBHOOK_CURRENCY_MISMATCH',
      message: 'currency does not match payment',
    };
  }

  const testFlag = extractWebhookTestFlag(body);
  const expectedTest = isBePaidTestMode();
  if (testFlag != null && testFlag !== expectedTest) {
    return {
      ok: false,
      code: 'WEBHOOK_TEST_FLAG_MISMATCH',
      message: 'test flag does not match environment',
    };
  }

  return { ok: true };
}

export type WebhookAuthInput = {
  basicAuthOk: boolean;
  secretHeaderOk: boolean;
  webhookSecretConfigured: boolean;
  bePaidEnabled: boolean;
  isProduction: boolean;
};

/** Fail-closed: в production/live bePaid webhook требует Basic Auth или webhook secret. */
export function assertWebhookAuthorized(input: WebhookAuthInput): WebhookValidationResult {
  if (input.basicAuthOk || input.secretHeaderOk) {
    return { ok: true };
  }

  if (input.bePaidEnabled && input.isProduction && !input.webhookSecretConfigured) {
    return {
      ok: false,
      code: 'WEBHOOK_SECRET_NOT_CONFIGURED',
      message: 'BEPAID_WEBHOOK_SECRET must be set in production',
    };
  }

  if (input.bePaidEnabled && input.isProduction) {
    return {
      ok: false,
      code: 'WEBHOOK_UNAUTHORIZED',
      message: 'Invalid webhook credentials',
    };
  }

  // sandbox / dev: still require at least one auth method when bePaid enabled
  if (input.bePaidEnabled) {
    return {
      ok: false,
      code: 'WEBHOOK_UNAUTHORIZED',
      message: 'Invalid webhook credentials',
    };
  }

  return { ok: true };
}
