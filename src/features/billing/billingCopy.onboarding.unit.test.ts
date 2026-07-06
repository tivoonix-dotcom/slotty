import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  onboardingPaymentFreePath,
  onboardingPaymentRetryPath,
  onboardingPaymentTariffPath,
  paymentReturnPath,
} from './billingCopy';

describe('billingCopy onboarding payment paths', () => {
  it('paymentReturnPath for onboarding', () => {
    assert.equal(paymentReturnPath('onboarding'), '/become-master?step=8');
  });

  it('distinct fail-page actions', () => {
    const retry = onboardingPaymentRetryPath();
    const tariff = onboardingPaymentTariffPath();
    const free = onboardingPaymentFreePath();
    assert.match(retry, /intent=pro_retry/);
    assert.equal(tariff, '/become-master?step=8');
    assert.match(free, /step=5/);
    assert.match(free, /intent=free/);
    assert.notEqual(retry, tariff);
    assert.notEqual(tariff, free);
  });
});
