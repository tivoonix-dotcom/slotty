import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INSERT_PENDING_BILLING_PAYMENT_SQL } from '../modules/billing/billingPendingPaymentSql.js';
import {
  purposeExtendsProPeriod,
  purposeToPaymentKind,
} from '../modules/billing/billingCheckoutPurpose.js';

describe('billingPendingPaymentSql', () => {
  it('uses separate typed placeholders for payment_id and provider_payment_id', () => {
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4::uuid/);
    assert.match(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$5::text/);
    assert.doesNotMatch(INSERT_PENDING_BILLING_PAYMENT_SQL, /\$4,\s*\$4/);
  });
});

describe('update_card checkout', () => {
  it('maps update_card purpose to billing payment kind', () => {
    assert.equal(purposeToPaymentKind('update_card'), 'update_card');
  });

  it('does not extend Pro period on update_card', () => {
    assert.equal(purposeExtendsProPeriod('update_card'), false);
  });
});
