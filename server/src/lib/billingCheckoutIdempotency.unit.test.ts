import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkoutReuseKey,
  inferSubscriptionPackageMonths,
  uniqueCheckoutIdempotencyKey,
} from '../modules/billing/billingPackage.js';
import { INSERT_PENDING_BILLING_PAYMENT_SQL } from '../modules/billing/billingPendingPaymentSql.js';

describe('checkout idempotency keys', () => {
  const masterId = '11111111-1111-1111-1111-111111111111';
  const attemptA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const attemptB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  it('reuse key is stable per master/purpose/package', () => {
    const key = checkoutReuseKey({ masterId, purpose: 'update_card', packageMonths: 1 });
    assert.equal(key, `checkout:${masterId}:update_card:1`);
  });

  it('unique checkout keys differ between attempts', () => {
    const a = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: attemptA,
    });
    const b = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: attemptB,
    });
    assert.notEqual(a, b);
    assert.match(a, new RegExp(`${attemptA}$`));
    assert.match(b, new RegExp(`${attemptB}$`));
  });

  it('second update_card attempt gets new unique key after first terminal checkout', () => {
    const first = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: attemptA,
    });
    const second = uniqueCheckoutIdempotencyKey({
      masterId,
      purpose: 'update_card',
      packageMonths: 1,
      attemptId: attemptB,
    });
    assert.notEqual(first, second);
  });
});

describe('renewal billing_payments INSERT', () => {
  it('uses separate typed placeholders (no $4, $4)', () => {
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4::uuid/);
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$5::text/);
    assert.doesNotMatch(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4,\s*\$4/);
  });
});

describe('inferSubscriptionPackageMonths', () => {
  const prices = { priceMonth: 29, priceYear: 290 };

  it('detects 3-month package from price', () => {
    assert.equal(
      inferSubscriptionPackageMonths({
        billingPeriod: 'month',
        priceAmount: 87,
        ...prices,
      }),
      3,
    );
  });
});
