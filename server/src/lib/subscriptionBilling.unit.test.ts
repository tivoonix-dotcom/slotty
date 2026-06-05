import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  availableBillingActions,
  deriveSubscriptionUiState,
  isProEntitled,
} from '../modules/billing/subscriptionBilling.state.js';

describe('subscriptionBilling.state', () => {
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  it('free plan → free ui', () => {
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'free',
        status: 'active',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: false,
      }),
      'free',
    );
  });

  it('pro active with next charge', () => {
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'pro',
        status: 'active',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: false,
      }),
      'pro_active',
    );
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'active',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: false,
      }),
      true,
    );
  });

  it('cancel at period end keeps pro until end', () => {
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'pro',
        status: 'canceled_at_period_end',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: true,
      }),
      'pro_canceled_at_period_end',
    );
  });

  it('expired after period end', () => {
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'pro',
        status: 'active',
        currentPeriodEnd: past,
        cancelAtPeriodEnd: false,
      }),
      'expired',
    );
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

  it('past_due within grace is entitled', () => {
    const graceEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(
      deriveSubscriptionUiState({
        planCode: 'pro',
        status: 'past_due',
        currentPeriodEnd: graceEnd,
        cancelAtPeriodEnd: false,
      }),
      'past_due',
    );
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'past_due',
        currentPeriodEnd: graceEnd,
        cancelAtPeriodEnd: false,
      }),
      true,
    );
  });

  it('available actions per ui state', () => {
    assert.ok(availableBillingActions('free').includes('connect_pro'));
    assert.ok(availableBillingActions('pro_active').includes('cancel_auto_renew'));
    assert.ok(!availableBillingActions('pro_active').includes('connect_pro'));
    assert.ok(availableBillingActions('past_due').includes('retry_payment'));
  });

  it('trialing with future end is pro entitled', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(
      isProEntitled({
        planCode: 'pro',
        status: 'trialing',
        currentPeriodEnd: future,
        cancelAtPeriodEnd: false,
        trialEndsAt: future,
      }),
      true,
    );
  });
});
