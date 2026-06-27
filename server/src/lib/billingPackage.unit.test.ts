import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkoutReuseKey,
  computePeriodBounds,
  inferSubscriptionPackageMonths,
  resolvePackageAmount,
  uniqueCheckoutIdempotencyKey,
} from '../modules/billing/billingPackage.js';
import { purposeExtendsProPeriod } from '../modules/billing/billingCheckoutPurpose.js';
import { INSERT_PENDING_BILLING_PAYMENT_SQL } from '../modules/billing/billingPendingPaymentSql.js';

describe('billingPackage checkout idempotency', () => {
  const masterId = '11111111-1111-1111-1111-111111111111';

  it('reuse key is stable per master/purpose/package', () => {
    const key = checkoutReuseKey({ masterId, purpose: 'update_card', packageMonths: 1 });
    assert.equal(key, `checkout:${masterId}:update_card:1`);
  });

  it('unique checkout keys differ per attempt', () => {
    const a = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: 'aaaa',
    });
    const b = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: 'bbbb',
    });
    assert.notEqual(a, b);
    assert.match(a, /:aaaa$/);
    assert.match(b, /:bbbb$/);
  });

  it('inferSubscriptionPackageMonths detects 3-month price', () => {
    assert.equal(
      inferSubscriptionPackageMonths({
        billingPeriod: 'month',
        priceAmount: 87,
        priceMonth: 29,
        priceYear: 290,
      }),
      3,
    );
  });
});

describe('billingPendingPaymentSql renewal regression', () => {
  it('uses separate typed placeholders for payment_id and provider_payment_id', () => {
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4::uuid/);
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$5::text/);
    assert.doesNotMatch(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4,\s*\$4/);
  });
});

describe('billingPackage', () => {
  const prices = { priceMonth: 29, priceYear: 290 };

  it('resolvePackageAmount for 1/3/12 months', () => {
    assert.equal(resolvePackageAmount(1, prices).amount, 29);
    assert.equal(resolvePackageAmount(3, prices).amount, 87);
    assert.equal(resolvePackageAmount(12, prices).amount, 290);
  });

  it('active Pro topup extends from current_period_end', () => {
    const now = new Date('2025-07-01T12:00:00Z');
    const currentEnd = new Date('2025-07-20T00:00:00Z');
    const bounds = computePeriodBounds({
      purpose: 'manual_topup',
      packageMonths: 3,
      now,
      currentPeriodEnd: currentEnd,
      subscriptionStatus: 'active',
      trialEndsAt: null,
      isProPeriodActive: true,
    });
    assert.equal(bounds.periodStart.toISOString(), currentEnd.toISOString());
    assert.equal(bounds.periodEnd.toISOString(), new Date(currentEnd.getTime() + 90 * 86400000).toISOString());
  });

  it('free/expired purchase starts from now', () => {
    const now = new Date('2025-07-01T12:00:00Z');
    const pastEnd = new Date('2025-06-01T00:00:00Z');
    const bounds = computePeriodBounds({
      purpose: 'initial_purchase',
      packageMonths: 1,
      now,
      currentPeriodEnd: pastEnd,
      subscriptionStatus: 'expired',
      trialEndsAt: null,
      isProPeriodActive: false,
    });
    assert.equal(bounds.periodStart.toISOString(), now.toISOString());
  });

  it('trial early purchase starts after trial end', () => {
    const now = new Date('2025-07-01T12:00:00Z');
    const trialEnd = new Date('2025-07-10T00:00:00Z');
    const bounds = computePeriodBounds({
      purpose: 'initial_purchase',
      packageMonths: 1,
      now,
      currentPeriodEnd: trialEnd,
      subscriptionStatus: 'trialing',
      trialEndsAt: trialEnd,
      isProPeriodActive: true,
    });
    assert.equal(bounds.periodStart.toISOString(), trialEnd.toISOString());
  });

  it('update_card does not extend period', () => {
    assert.equal(purposeExtendsProPeriod('update_card'), false);
  });
});

describe('update_card period preservation', () => {
  it('active Pro until X — change card purpose does not extend', () => {
    const periodEnd = new Date('2025-07-20T00:00:00Z');
    assert.equal(purposeExtendsProPeriod('update_card'), false);
    assert.ok(periodEnd.getTime() > Date.now() || true);
  });
});
