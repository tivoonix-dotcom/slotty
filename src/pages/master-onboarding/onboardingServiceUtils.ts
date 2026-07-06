import type { MasterOnboardingService } from '../../features/profile/lib/demoMasterStorage';
import { BASIC_ONBOARDING_LIMITS } from '../../features/master-onboarding/model/masterOnboardingPlanTypes';

export const ONBOARDING_BASIC_MAX_SERVICES = BASIC_ONBOARDING_LIMITS.maxServices;
export const ONBOARDING_MAX_SERVICES = 100;

export function canAddServiceDuringOnboarding(currentCount: number): boolean {
  return currentCount < ONBOARDING_MAX_SERVICES;
}

export function exceedsFreeActiveServiceLimit(count: number): boolean {
  return count > ONBOARDING_BASIC_MAX_SERVICES;
}

export function countActiveOnboardingServices(
  services: ReadonlyArray<{ isActive?: boolean }>,
): number {
  return services.filter((service) => service.isActive !== false).length;
}

export function onboardingServicesListDescription(
  services: ReadonlyArray<{ isActive?: boolean }>,
): string {
  const total = services.length;
  const active = countActiveOnboardingServices(services);
  if (exceedsFreeActiveServiceLimit(active)) {
    return `${total} услуг, активных ${active}. На Free — до ${ONBOARDING_BASIC_MAX_SERVICES}; отключите лишние или выберите Pro.`;
  }
  if (total > ONBOARDING_BASIC_MAX_SERVICES) {
    return `${total} услуг, активных ${active} из ${ONBOARDING_BASIC_MAX_SERVICES} на бесплатном тарифе`;
  }
  return `${active} из ${ONBOARDING_BASIC_MAX_SERVICES} на бесплатном тарифе`;
}

export type OnboardingServiceComparable = Pick<
  MasterOnboardingService,
  'title' | 'durationMin' | 'priceByn' | 'priceType' | 'description'
>;

export function onboardingServiceFingerprint(service: OnboardingServiceComparable): string {
  const title = service.title.trim().toLowerCase();
  const description = (service.description ?? '').trim().toLowerCase();
  const priceType = service.priceType ?? 'fixed';
  return `${title}|${service.durationMin}|${service.priceByn}|${priceType}|${description}`;
}

export function findDuplicateOnboardingService(
  services: MasterOnboardingService[],
  candidate: OnboardingServiceComparable,
  excludeId?: string | null,
): MasterOnboardingService | undefined {
  const fingerprint = onboardingServiceFingerprint(candidate);
  return services.find(
    (service) => service.id !== excludeId && onboardingServiceFingerprint(service) === fingerprint,
  );
}

export function hasDuplicateOnboardingServices(services: MasterOnboardingService[]): boolean {
  const seen = new Set<string>();
  for (const service of services) {
    const fingerprint = onboardingServiceFingerprint(service);
    if (seen.has(fingerprint)) return true;
    seen.add(fingerprint);
  }
  return false;
}

export function formatOnboardingServicePrice(service: MasterOnboardingService): string {
  if (service.priceByn <= 0) return 'Бесплатно';
  const prefix = service.priceType === 'from' ? 'от ' : '';
  return `${prefix}${Math.round(service.priceByn)} BYN`;
}
