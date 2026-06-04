import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveSubscriptionUiState, isProEntitled } from '../modules/billing/subscriptionBilling.state.js';

describe('billing worker entitlement rules', () => {
  const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  it('cancel_at_period_end keeps Pro until period end', () => {
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'pro',
        status: 'canceled_at_period_end',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: true,
      }),
      'pro_canceled_at_period_end',
    );
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'canceled_at_period_end',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: true,
      }),
      true,
    );
  });

  it('past_due within grace remains entitled', () => {
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'past_due',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: false,
      }),
      true,
    );
  });

  it('expired after period is not entitled', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'active',
        currentPeriodEnd: past,
        cancelAtPeriodEnd: false,
      }),
      false,
    );
  });
});
