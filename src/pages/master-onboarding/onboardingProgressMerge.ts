import type { OnboardingProgressDto } from '../../features/master-onboarding/api/onboardingProgressApi';

const TOTAL_STEPS = 8;

export function mergeOnboardingStepFromSources(
  server: Pick<OnboardingProgressDto, 'currentStep' | 'furthestStep'> | null,
  local: { step?: number; furthestStep?: number } | null,
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

export function shouldPreferServerTariff(
  server: Pick<OnboardingProgressDto, 'selectedTariff' | 'onboardingStatus'> | null,
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
  server: Pick<OnboardingProgressDto, 'selectedTariff' | 'onboardingStatus'> | null,
  localTariff: 'basic' | 'pro_purchase',
): 'basic' | 'pro_purchase' {
  if (shouldPreferServerTariff(server) && server?.selectedTariff) {
    return server.selectedTariff === 'pro_purchase' ? 'pro_purchase' : 'basic';
  }
  return localTariff;
}

export function onboardingPaymentStatusHint(
  progress: Pick<OnboardingProgressDto, 'onboardingStatus' | 'checkoutStatus' | 'subscriptionActive'> | null,
): string | null {
  if (!progress) return null;
  if (progress.subscriptionActive) {
    return 'Pro активен. Профиль пока не опубликован в каталоге — включите публикацию в кабинете после добавления окон записи.';
  }
  if (progress.onboardingStatus === 'payment_failed' || progress.checkoutStatus === 'failed') {
    return 'Оплата не прошла. Можно повторить оплату Pro или продолжить бесплатно с до 3 активных услуг.';
  }
  if (progress.onboardingStatus === 'checkout_pending' || progress.checkoutStatus === 'pending') {
    return 'Ожидается оплата Pro. Если вы уже оплатили — обновите страницу через минуту.';
  }
  return null;
}
