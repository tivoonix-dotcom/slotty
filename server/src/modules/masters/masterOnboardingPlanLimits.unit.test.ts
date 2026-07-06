import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countActiveOnboardingServices,
  FREE_MAX_ACTIVE_SERVICES,
  resolveOnboardingCompleteContext,
  shouldServiceBeActiveOnOnboardingComplete,
  validateOnboardingServiceCount,
  validateOnboardingServices,
} from './masterOnboardingPlanLimits.js';

test('free_publish allows up to 3 active services', () => {
  assert.equal(
    validateOnboardingServices(
      [{ isActive: true }, { isActive: true }, { isActive: true }],
      'free_publish',
    ).ok,
    true,
  );
});

test('free_publish rejects 4 active services even if total is 5', () => {
  const result = validateOnboardingServices(
    [
      { isActive: true },
      { isActive: true },
      { isActive: true },
      { isActive: true },
      { isActive: false },
    ],
    'free_publish',
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, 'LIMIT_SERVICES_REACHED');
  }
});

test('free_publish allows 5 services when only 3 are active', () => {
  assert.equal(
    validateOnboardingServices(
      [
        { isActive: true },
        { isActive: true },
        { isActive: true },
        { isActive: false },
        { isActive: false },
      ],
      'free_publish',
    ).ok,
    true,
  );
});

test('pro_checkout allows 4+ services', () => {
  assert.equal(validateOnboardingServices(Array.from({ length: 4 }, () => ({ isActive: true })), 'pro_checkout').ok, true);
});

test('pro_checkout keeps only first 3 services active until payment', () => {
  assert.equal(shouldServiceBeActiveOnOnboardingComplete(0, 'pro_checkout'), true);
  assert.equal(shouldServiceBeActiveOnOnboardingComplete(2, 'pro_checkout'), true);
  assert.equal(shouldServiceBeActiveOnOnboardingComplete(3, 'pro_checkout'), false);
});

test('free_publish respects explicit inactive services', () => {
  assert.equal(shouldServiceBeActiveOnOnboardingComplete(0, 'free_publish', false), false);
  assert.equal(shouldServiceBeActiveOnOnboardingComplete(0, 'free_publish', true), true);
});

test('countActiveOnboardingServices ignores inactive rows', () => {
  assert.equal(
    countActiveOnboardingServices([{ isActive: true }, { isActive: false }, { isActive: true }]),
    2,
  );
});

test('validateOnboardingServiceCount still guards total max', () => {
  assert.equal(validateOnboardingServiceCount(101, 'pro_checkout').ok, false);
});

test('resolveOnboardingCompleteContext maps pro checkout intent', () => {
  assert.equal(resolveOnboardingCompleteContext(true), 'pro_checkout');
  assert.equal(resolveOnboardingCompleteContext(false), 'free_publish');
});

test('free_publish requires at least one active service', () => {
  const result = validateOnboardingServices([{ isActive: false }, { isActive: false }], 'free_publish');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, 'SERVICES_EMPTY');
  }
});

test('free_publish activates all services within limit when active unspecified', () => {
  for (let i = 0; i < FREE_MAX_ACTIVE_SERVICES; i += 1) {
    assert.equal(shouldServiceBeActiveOnOnboardingComplete(i, 'free_publish'), true);
  }
});
