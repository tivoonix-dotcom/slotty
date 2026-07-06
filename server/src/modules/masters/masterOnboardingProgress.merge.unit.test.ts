import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeOnboardingStepFromSources,
  resolveRestoredTariff,
  shouldPreferServerTariff,
  stepToOnboardingStatus,
} from './masterOnboardingProgress.merge.js';
import { shouldStartProTrialAfterComplete } from './masterOnboardingProgress.service.js';

describe('masterOnboardingProgress.merge', () => {
  it('mergeOnboardingStepFromSources prefers max step from server and local', () => {
    const merged = mergeOnboardingStepFromSources(
      { currentStep: 5, furthestStep: 6 },
      { step: 7, furthestStep: 7 },
    );
    assert.equal(merged.step, 7);
    assert.equal(merged.furthestStep, 7);
  });

  it('resolveRestoredTariff uses server tariff when checkout pending', () => {
    const tariff = resolveRestoredTariff(
      { selectedTariff: 'pro_purchase', onboardingStatus: 'checkout_pending' },
      'basic',
    );
    assert.equal(tariff, 'pro_purchase');
  });

  it('resolveRestoredTariff keeps local when server has no tariff lock', () => {
    const tariff = resolveRestoredTariff(
      { selectedTariff: null, onboardingStatus: 'draft' },
      'basic',
    );
    assert.equal(tariff, 'basic');
  });

  it('shouldPreferServerTariff for payment_failed', () => {
    assert.equal(
      shouldPreferServerTariff({ selectedTariff: 'pro_purchase', onboardingStatus: 'payment_failed' }),
      true,
    );
  });

  it('stepToOnboardingStatus maps steps', () => {
    assert.equal(stepToOnboardingStatus(1), 'draft');
    assert.equal(stepToOnboardingStatus(5), 'services_added');
    assert.equal(stepToOnboardingStatus(7), 'tariff_selected');
  });
});

describe('shouldStartProTrialAfterComplete', () => {
  it('skips trial when proCheckoutIntent', () => {
    assert.equal(shouldStartProTrialAfterComplete(true), false);
  });

  it('allows trial on free path when enabled in env', () => {
    assert.equal(shouldStartProTrialAfterComplete(false), true);
  });
});
