import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeCatalogProBoostScore, MAX_PRO_BOOST } from './catalogProBoost.js';
import { isProEntitled, deriveSubscriptionUiState } from './subscriptionBilling.state.js';

describe('catalogProBoost', () => {
  it('Pro without slots gets zero boost', () => {
    assert.equal(
      computeCatalogProBoostScore({
        rating: 5,
        reviewsCount: 100,
        hasActiveSlot: false,
        isVerified: true,
        isProEntitled: true,
      }),
      0,
    );
  });

  it('Free master gets zero boost', () => {
    assert.equal(
      computeCatalogProBoostScore({
        rating: 5,
        reviewsCount: 100,
        hasActiveSlot: true,
        isVerified: true,
        isProEntitled: false,
      }),
      0,
    );
  });

  it('Pro with good profile gets capped boost', () => {
    const score = computeCatalogProBoostScore({
      rating: 5,
      reviewsCount: 50,
      hasActiveSlot: true,
      isVerified: true,
      isProEntitled: true,
    });
    assert.ok(score > 0);
    assert.ok(score <= MAX_PRO_BOOST);
  });

  it('weak Pro profile gets smaller boost than strong Free metrics would imply base quality', () => {
    const weakPro = computeCatalogProBoostScore({
      rating: 3,
      reviewsCount: 1,
      hasActiveSlot: true,
      isVerified: false,
      isProEntitled: true,
    });
    const strongPro = computeCatalogProBoostScore({
      rating: 5,
      reviewsCount: 80,
      hasActiveSlot: true,
      isVerified: true,
      isProEntitled: true,
    });
    assert.ok(strongPro > weakPro);
  });
});

describe('subscriptionBilling.state trialing', () => {
  const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  it('active trial is pro entitled', () => {
    const row = {
      planCode: 'pro',
      status: 'trialing',
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      trialEndsAt: future,
    };
    assert.equal(deriveSubscriptionUiState(row), 'pro_active');
    assert.equal(isProEntitled(row), true);
  });

  it('expired trial is not entitled', () => {
    const row = {
      planCode: 'pro',
      status: 'trialing',
      currentPeriodEnd: past,
      cancelAtPeriodEnd: false,
      trialEndsAt: past,
    };
    assert.equal(deriveSubscriptionUiState(row), 'expired');
    assert.equal(isProEntitled(row), false);
  });
});
