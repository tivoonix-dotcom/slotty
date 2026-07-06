/** Лимиты услуг на этапе онбординга мастера (контекстные проверки). */

export const FREE_MAX_ACTIVE_SERVICES = 3;
export const ONBOARDING_MAX_SERVICES = 100;

/** free_publish — завершение онбординга на Free; pro_checkout — публикация перед оплатой Pro. */
export type OnboardingCompleteContext = 'free_publish' | 'pro_checkout';

export type OnboardingServiceLike = { isActive?: boolean };

export type OnboardingServiceCountValidation =
  | { ok: true }
  | { ok: false; message: string; code: 'LIMIT_SERVICES_REACHED' | 'SERVICES_EMPTY' };

export function countActiveOnboardingServices(services: OnboardingServiceLike[]): number {
  return services.filter((service) => service.isActive !== false).length;
}

export function validateOnboardingServiceCount(
  count: number,
  context: OnboardingCompleteContext,
): OnboardingServiceCountValidation {
  if (count < 1) {
    return { ok: false, message: 'Добавьте хотя бы одну услугу', code: 'SERVICES_EMPTY' };
  }
  if (count > ONBOARDING_MAX_SERVICES) {
    return {
      ok: false,
      message: `Можно сохранить не более ${ONBOARDING_MAX_SERVICES} услуг`,
      code: 'LIMIT_SERVICES_REACHED',
    };
  }
  if (context === 'free_publish' && count > FREE_MAX_ACTIVE_SERVICES) {
    return {
      ok: false,
      message: `На бесплатном тарифе доступно до ${FREE_MAX_ACTIVE_SERVICES} активных услуг. Отключите лишние или выберите Pro.`,
      code: 'LIMIT_SERVICES_REACHED',
    };
  }
  return { ok: true };
}

export function validateOnboardingServices(
  services: OnboardingServiceLike[],
  context: OnboardingCompleteContext,
): OnboardingServiceCountValidation {
  const total = services.length;
  const activeCount = countActiveOnboardingServices(services);

  if (activeCount < 1) {
    return {
      ok: false,
      message: 'Добавьте хотя бы одну активную услугу или включите услуги в списке',
      code: 'SERVICES_EMPTY',
    };
  }

  if (total > ONBOARDING_MAX_SERVICES) {
    return {
      ok: false,
      message: `Можно сохранить не более ${ONBOARDING_MAX_SERVICES} услуг`,
      code: 'LIMIT_SERVICES_REACHED',
    };
  }

  if (context === 'free_publish' && activeCount > FREE_MAX_ACTIVE_SERVICES) {
    return {
      ok: false,
      message: `На бесплатном тарифе доступно до ${FREE_MAX_ACTIVE_SERVICES} активных услуг. Отключите лишние или выберите Pro.`,
      code: 'LIMIT_SERVICES_REACHED',
    };
  }

  return { ok: true };
}

/** При pro_checkout сверх Free-лимита услуги сохраняются неактивными до оплаты. */
export function shouldServiceBeActiveOnOnboardingComplete(
  index: number,
  context: OnboardingCompleteContext,
  explicitIsActive?: boolean,
): boolean {
  if (context === 'pro_checkout') {
    return index < FREE_MAX_ACTIVE_SERVICES;
  }
  return explicitIsActive !== false;
}

export function resolveOnboardingCompleteContext(proCheckoutIntent: boolean): OnboardingCompleteContext {
  return proCheckoutIntent ? 'pro_checkout' : 'free_publish';
}
