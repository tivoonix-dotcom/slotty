import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertWebhookAuthorized,
  validateWebhookAgainstPayment,
} from '../modules/payments/bepaidWebhookValidation.js';

const payment = {
  id: 'pay-1',
  trackingId: 'track-1',
  amountMinor: 2900,
  currency: 'BYN',
  status: 'pending',
};

describe('bepaidWebhookValidation auth', () => {
  it('rejects when no auth in production with bePaid enabled', () => {
    const r = assertWebhookAuthorized({
      basicAuthOk: false,
      secretHeaderOk: false,
      webhookSecretConfigured: true,
      bePaidEnabled: true,
      isProduction: true,
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'WEBHOOK_UNAUTHORIZED');
  });

  it('rejects when secret not configured in production', () => {
    const r = assertWebhookAuthorized({
      basicAuthOk: false,
      secretHeaderOk: false,
      webhookSecretConfigured: false,
      bePaidEnabled: true,
      isProduction: true,
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'WEBHOOK_SECRET_NOT_CONFIGURED');
  });

  it('accepts Basic Auth', () => {
    const r = assertWebhookAuthorized({
      basicAuthOk: true,
      secretHeaderOk: false,
      webhookSecretConfigured: false,
      bePaidEnabled: true,
      isProduction: true,
    });
    assert.equal(r.ok, true);
  });
});

describe('bepaidWebhookValidation payload', () => {
  const validBody = {
    transaction: {
      tracking_id: 'track-1',
      status: 'successful',
      test: true,
      order: { amount: 2900, currency: 'BYN' },
    },
  };

  it('valid webhook passes', () => {
    const r = validateWebhookAgainstPayment(validBody, payment);
    assert.equal(r.ok, true);
  });

  it('wrong amount rejected', () => {
    const r = validateWebhookAgainstPayment(
      {
        transaction: {
          tracking_id: 'track-1',
          test: true,
          order: { amount: 100, currency: 'BYN' },
        },
      },
      payment,
    );
    assert.equal(r.ok, false);
    assert.equal(r.code, 'WEBHOOK_AMOUNT_MISMATCH');
  });

  it('wrong currency rejected', () => {
    const r = validateWebhookAgainstPayment(
      {
        transaction: {
          tracking_id: 'track-1',
          test: true,
          order: { amount: 2900, currency: 'USD' },
        },
      },
      payment,
    );
    assert.equal(r.ok, false);
    assert.equal(r.code, 'WEBHOOK_CURRENCY_MISMATCH');
  });

  it('wrong tracking_id rejected', () => {
    const r = validateWebhookAgainstPayment(
      {
        transaction: {
          tracking_id: 'other',
          test: true,
          order: { amount: 2900, currency: 'BYN' },
        },
      },
      payment,
    );
    assert.equal(r.ok, false);
    assert.equal(r.code, 'WEBHOOK_TRACKING_MISMATCH');
  });
});
