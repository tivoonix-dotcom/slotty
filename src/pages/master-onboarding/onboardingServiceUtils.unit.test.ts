import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAddServiceDuringOnboarding,
  countActiveOnboardingServices,
  exceedsFreeActiveServiceLimit,
  findDuplicateOnboardingService,
  hasDuplicateOnboardingServices,
  onboardingServiceFingerprint,
  onboardingServicesListDescription,
  ONBOARDING_BASIC_MAX_SERVICES,
  ONBOARDING_MAX_SERVICES,
} from './onboardingServiceUtils';

test('onboardingServiceFingerprint treats identical services as equal', () => {
  const a = onboardingServiceFingerprint({
    title: ' Маникюр ',
    durationMin: 60,
    priceByn: 45,
    priceType: 'fixed',
    description: 'С покрытием',
  });
  const b = onboardingServiceFingerprint({
    title: 'маникюр',
    durationMin: 60,
    priceByn: 45,
    priceType: 'fixed',
    description: 'с покрытием',
  });
  assert.equal(a, b);
});

test('onboardingServiceFingerprint differs when price type changes', () => {
  const fixed = onboardingServiceFingerprint({
    title: 'Маникюр',
    durationMin: 60,
    priceByn: 45,
    priceType: 'fixed',
  });
  const from = onboardingServiceFingerprint({
    title: 'Маникюр',
    durationMin: 60,
    priceByn: 45,
    priceType: 'from',
  });
  assert.notEqual(fixed, from);
});

test('findDuplicateOnboardingService ignores excluded id', () => {
  const services = [
    {
      id: 'svc-1',
      title: 'Маникюр',
      durationMin: 60,
      priceByn: 45,
      priceType: 'fixed' as const,
      isActive: true,
      sortOrder: 0,
    },
  ];

  const duplicate = findDuplicateOnboardingService(
    services,
    {
      title: 'Маникюр',
      durationMin: 60,
      priceByn: 45,
      priceType: 'fixed',
    },
    'svc-1',
  );

  assert.equal(duplicate, undefined);
});

test('hasDuplicateOnboardingServices detects duplicates in list', () => {
  const services = [
    {
      id: 'svc-1',
      title: 'Маникюр',
      durationMin: 60,
      priceByn: 45,
      priceType: 'fixed' as const,
      isActive: true,
      sortOrder: 0,
    },
    {
      id: 'svc-2',
      title: 'маникюр',
      durationMin: 60,
      priceByn: 45,
      priceType: 'fixed' as const,
      isActive: true,
      sortOrder: 1,
    },
  ];

  assert.equal(hasDuplicateOnboardingServices(services), true);
});

test('canAddServiceDuringOnboarding allows up to ONBOARDING_MAX_SERVICES', () => {
  assert.equal(canAddServiceDuringOnboarding(99), true);
  assert.equal(canAddServiceDuringOnboarding(100), false);
});

test('exceedsFreeActiveServiceLimit applies only above basic cap', () => {
  assert.equal(exceedsFreeActiveServiceLimit(3), false);
  assert.equal(exceedsFreeActiveServiceLimit(4), true);
});

test('countActiveOnboardingServices counts only active rows', () => {
  assert.equal(
    countActiveOnboardingServices([
      { isActive: true },
      { isActive: false },
      { isActive: true },
    ]),
    2,
  );
});

test('onboardingServicesListDescription explains active vs total', () => {
  const description = onboardingServicesListDescription([
    { isActive: true },
    { isActive: true },
    { isActive: true },
    { isActive: false },
  ]);
  assert.match(description, /4 услуг/);
  assert.match(description, /активных 3/);
});
