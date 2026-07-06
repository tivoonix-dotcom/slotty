/** Централизованные тексты billing UI (до полноценного i18n). */

export type BillingPackageMonths = 1 | 3 | 12;

export const BILLING_COPY = {
  period1Month: '1 месяц',
  period3Months: '3 месяца',
  period12Months: '12 месяцев',
  connectPro: 'Подключить Pro',
  extendPro: 'Продлить Pro',
  changeCard: 'Изменить карту',
  addCard: 'Добавить карту',
  deleteCard: 'Удалить карту',
  deleteCardConfirm:
    'Карта будет отвязана. Автопродление отключится. Оплаченный период сохранится.',
  retryPayment: 'Повторить оплату',
  paymentHistory: 'История платежей',
  cancelAutoRenew: 'Отменить автопродление',
  resumeAutoRenew: 'Возобновить',
  trialEarlyPurchaseHint:
    'Pro уже активен на пробном периоде. Оплаченный период начнётся после окончания trial.',
  proAlreadyActive:
    'Тариф Pro уже активен. Используйте «Продлить Pro», чтобы добавить оплаченный период.',
  paymentProcessing: 'Платёж обрабатывается…',
  paymentConfirmed: 'Оплата подтверждена',
  paymentPendingWebhook:
    'Ожидаем подтверждение от платёжной системы. Это может занять до минуты.',
  backToBilling: 'Вернуться к тарифам',
  backToPayment: 'Вернуться к оплате',
  backToOnboardingTariff: 'Вернуться к выбору тарифа',
  paymentSuccessOnboardingLead: 'Оплата прошла успешно. Pro активирован.',
  paymentSuccessOnboardingServices: 'Теперь доступны все добавленные услуги.',
  paymentSuccessOnboardingCabinet: 'Перейти в кабинет',
  cardDeleted: 'Карта удалена',
  autoRenewOffAfterDelete: 'Автопродление отключено',
  cardNotLinkedAutoRenew: 'Карта не привязана. Автопродление невозможно.',
  autoRenewDisabledUntil: 'Автопродление отключено — Pro будет доступен до',
  updateCardFailed:
    'Не удалось открыть страницу привязки карты. Попробуйте позже или обратитесь в поддержку.',
  retryPaymentFailed:
    'Не удалось повторить оплату подписки. Проверьте карту или попробуйте позже.',
  checkoutFailed: 'Не удалось открыть оплату. Повторите попытку.',
  topupFailed: 'Не удалось создать платёж для продления. Повторите попытку.',
  subscriptionLoadFailed: 'Не удалось загрузить подписку. Нажмите «Повторить».',
  plansLoadFailed: 'Не удалось загрузить список тарифов. Нажмите «Повторить».',
  billingActionFailed: 'Не удалось выполнить действие. Повторите попытку.',
  paymentStillProcessing:
    'Оплата обрабатывается. Обычно это занимает до нескольких минут. Нажмите «Проверить снова».',
  paymentCheckFailed: 'Не удалось проверить статус оплаты. Попробуйте ещё раз.',
  retryAction: 'Повторить',
  checkAgain: 'Проверить снова',
  currentPlan: 'Текущий тариф',
  extendFor: 'Продлить на',
} as const;

const INTERNAL_SERVER_ERROR = 'Internal server error';

/** Не показывать мастеру сырой Internal server error. */
export function formatBillingUserError(error: unknown, fallback: string = BILLING_COPY.billingActionFailed): string {
  if (error instanceof Error && error.message && error.message !== INTERNAL_SERVER_ERROR) {
    return error.message;
  }
  return fallback;
}

export function billingPackageLabel(months: BillingPackageMonths): string {
  if (months === 12) return BILLING_COPY.period12Months;
  if (months === 3) return BILLING_COPY.period3Months;
  return BILLING_COPY.period1Month;
}

export function paymentReturnPath(from: string | null): string {
  if (from === 'settings') return '/master/settings/billing';
  if (from === 'onboarding') return '/become-master?step=8';
  return '/admin/billing';
}

export function onboardingPaymentRetryPath(): string {
  return '/become-master?step=8&intent=pro_retry';
}

export function onboardingPaymentTariffPath(): string {
  return '/become-master?step=8';
}

export function onboardingPaymentFreePath(): string {
  return '/become-master?step=5&intent=free';
}
