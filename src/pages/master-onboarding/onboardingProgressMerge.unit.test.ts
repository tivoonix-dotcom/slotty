import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeOnboardingStepFromSources,
  onboardingPaymentStatusHint,
  resolveRestoredTariff,
} from './onboardingProgressMerge';

describe('onboardingProgressMerge (frontend)', () => {
  it('onboardingPaymentStatusHint for subscription active', () => {
    const hint = onboardingPaymentStatusHint({
      onboardingStatus: 'subscription_active',
      checkoutStatus: 'paid',
      subscriptionActive: true,
    });
    assert.match(hint ?? '', /Pro активен/);
  });

  it('onboardingPaymentStatusHint for failed payment', () => {
    const hint = onboardingPaymentStatusHint({
      onboardingStatus: 'payment_failed',
      checkoutStatus: 'failed',
      subscriptionActive: false,
    });
    assert.match(hint ?? '', /Оплата не прошла/);
  });

  it('merge restores tariff from server on checkout_pending', () => {
    assert.equal(
      resolveRestoredTariff(
        { selectedTariff: 'pro_purchase', onboardingStatus: 'checkout_pending' },
        'basic',
      ),
      'pro_purchase',
    );
  });

  it('merge step uses max of local and server', () => {
    const merged = mergeOnboardingStepFromSources(
      { currentStep: 3, furthestStep: 4 },
      { step: 7, furthestStep: 7 },
    );
    assert.equal(merged.step, 7);
  });
});
