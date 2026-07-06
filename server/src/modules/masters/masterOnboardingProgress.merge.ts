import type { MasterOnboardingProgressDto } from './masterOnboardingProgress.types.js';

const TOTAL_STEPS = 8;

type LocalStepDraft = { step?: number; furthestStep?: number };

/** Шаг из серверного progress vs localStorage — берём максимум по furthest. */
export function mergeOnboardingStepFromSources(
  server: Pick<MasterOnboardingProgressDto, 'currentStep' | 'furthestStep'> | null,
  local: LocalStepDraft | null,
): { step: number; furthestStep: number } {
  const localStep = Math.max(1, Math.min(TOTAL_STEPS, local?.step ?? 1));
  const localFurthest = Math.max(localStep, Math.min(TOTAL_STEPS, local?.furthestStep ?? localStep));
  if (!server) {
    return { step: localStep, furthestStep: localFurthest };
  }
  const serverStep = Math.max(1, Math.min(TOTAL_STEPS, server.currentStep));
  const serverFurthest = Math.max(serverStep, Math.min(TOTAL_STEPS, server.furthestStep));
  return {
    step: Math.max(localStep, serverStep),
    furthestStep: Math.max(localFurthest, serverFurthest),
  };
}

export function onboardingStatusBlocksFreePublish(status: string): boolean {
  return status === 'checkout_pending' || status === 'payment_processing';
}

export function shouldPreferServerTariff(
  server: Pick<MasterOnboardingProgressDto, 'selectedTariff' | 'onboardingStatus'> | null,
): boolean {
  if (!server?.selectedTariff) return false;
  return (
    server.onboardingStatus === 'tariff_selected' ||
    server.onboardingStatus === 'checkout_pending' ||
    server.onboardingStatus === 'payment_processing' ||
    server.onboardingStatus === 'payment_failed' ||
    server.onboardingStatus === 'subscription_active'
  );
}

export function resolveRestoredTariff(
  server: Pick<MasterOnboardingProgressDto, 'selectedTariff' | 'onboardingStatus'> | null,
  localTariff: 'basic' | 'pro_purchase',
): 'basic' | 'pro_purchase' {
  if (shouldPreferServerTariff(server) && server?.selectedTariff) {
    return server.selectedTariff === 'pro_purchase' ? 'pro_purchase' : 'basic';
  }
  return localTariff;
}

/** После успешного webhook Pro — показать success, если onboarding уже завершён. */
export function shouldShowOnboardingSuccessAfterPayment(
  progress: Pick<MasterOnboardingProgressDto, 'onboardingStatus' | 'subscriptionActive'> | null,
): boolean {
  if (!progress?.subscriptionActive) return false;
  return (
    progress.onboardingStatus === 'subscription_active' ||
    progress.onboardingStatus === 'ready_to_publish' ||
    progress.onboardingStatus === 'completed'
  );
}

export function stepToOnboardingStatus(step: number): string {
  if (step <= 1) return 'draft';
  if (step <= 3) return 'profile_started';
  if (step <= 5) return 'services_added';
  if (step <= 6) return 'schedule_added';
  if (step === 7) return 'tariff_selected';
  return 'tariff_selected';
}
