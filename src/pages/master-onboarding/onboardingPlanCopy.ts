import { ONBOARDING_BASIC_MAX_SERVICES } from './onboardingServiceUtils';

/** Пользовательские тексты тарифов Free/Pro в онбординге мастера. */
export const ONBOARDING_PLAN_COPY = {
  introFreeHeadline: 'Можно начать бесплатно',
  introFreeBody: `На бесплатном тарифе — до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг, профиль мастера и онлайн-запись. Оплата не обязательна, если вы укладываетесь в эти лимиты.`,
  introProHint: `Нужно больше ${ONBOARDING_BASIC_MAX_SERVICES} услуг или расширенные функции — подключите Pro на последнем шаге.`,

  servicesStepLead: `Вы можете начать бесплатно: до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг. Хотите больше — выберите Pro на шаге «Тариф».`,
  servicesWithinFreeLimit: `Бесплатный тариф покрывает до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг.`,
  servicesOverFreeLimit: `Это больше бесплатного лимита. Услугу можно сохранить — для публикации более ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг понадобится Pro или отключите лишние.`,
  servicesActiveCounter: (active: number) =>
    `Активные услуги: ${active} из ${ONBOARDING_BASIC_MAX_SERVICES} на бесплатном тарифе`,
  servicesActiveOverLimit: (active: number) =>
    `Активные услуги: ${active} из ${ONBOARDING_BASIC_MAX_SERVICES} — выберите Pro или отключите лишние`,
  serviceInactiveOnFree: 'Не будет активна на Free',
  freeActiveLimitReached: `На бесплатном тарифе можно опубликовать до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг. Сначала отключите другую услугу или выберите Pro.`,

  tariffStepLead: 'Начните бесплатно или подключите Pro для расширенных возможностей. Оплата нужна только если вы выбираете Pro.',
  tariffFreeName: 'Бесплатный',
  tariffFreePrice: '0 BYN',
  tariffFreeTagline: 'Для старта без оплаты',
  tariffFreeCta: 'Продолжить бесплатно',
  tariffProCta: 'Выбрать Pro',
  tariffPublishFree: 'Опубликовать бесплатно',
  tariffPublishPro: 'Опубликовать и оплатить Pro',

  tariffFreeBlocked: `Чтобы продолжить бесплатно, оставьте до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг на шаге «Услуги».`,
  tariffFreeOverLimit: `На бесплатном тарифе доступно до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг. Отключите лишние на шаге «Услуги» или выберите Pro.`,
  tariffProSelected: (total: number) =>
    `Вы выбрали Pro. После оплаты будут доступны все ${total} добавленных услуг.`,
  tariffProConsentHint: (total: number) =>
    total > ONBOARDING_BASIC_MAX_SERVICES
      ? `После оплаты все ${total} услуг станут активными. До подтверждения платежа Pro-возможности не включаются.`
      : 'После оплаты откроются расширенные возможности Pro. До подтверждения платежа они не включаются.',

  publishFreeBlocked: `На бесплатном тарифе доступно до ${ONBOARDING_BASIC_MAX_SERVICES} активных услуг. Отключите лишние услуги или выберите Pro.`,
  paymentFailedOnboarding:
    'Оплата не прошла. Вы можете повторить оплату Pro или продолжить бесплатно, оставив до 3 активных услуг.',
  paymentFailedRetry: 'Повторить оплату Pro',
  paymentFailedBackTariff: 'Вернуться к тарифам',
  paymentFailedStayFree: 'Продолжить бесплатно',

  profileDraftNotice:
    'После сохранения профиль будет в черновике и не появится в каталоге, пока вы не добавите окна записи и не включите публикацию в кабинете.',
  profilePublishedHint: 'Профиль опубликован — клиенты могут записываться онлайн.',
  profileNotPublishedHint:
    'Профиль пока не опубликован. Добавьте окна записи и включите видимость в кабинете.',

  paywallTitle: 'Больше 3 активных услуг — это Pro',
  paywallBody: (active: number) =>
    `Вы добавили ${active} активных услуг. На бесплатном тарифе можно опубликовать до ${ONBOARDING_BASIC_MAX_SERVICES}. Подключите Pro, чтобы опубликовать все услуги, или отключите лишние и продолжите бесплатно.`,
} as const;
