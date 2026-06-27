/** Назначение checkout — источник истины для webhook fulfillment. */
export type BillingCheckoutPurpose =
  | 'initial_purchase'
  | 'manual_topup'
  | 'update_card'
  | 'retry_payment'
  | 'renewal_charge';

export const BILLING_CHECKOUT_PURPOSES: readonly BillingCheckoutPurpose[] = [
  'initial_purchase',
  'manual_topup',
  'update_card',
  'retry_payment',
  'renewal_charge',
] as const;

export function isBillingCheckoutPurpose(v: string): v is BillingCheckoutPurpose {
  return (BILLING_CHECKOUT_PURPOSES as readonly string[]).includes(v);
}

/** Маппинг purpose → billing_payments.payment_kind */
export function purposeToPaymentKind(
  purpose: BillingCheckoutPurpose,
): 'initial_payment' | 'manual_topup' | 'update_card' | 'retry_payment' | 'recurring_payment' {
  switch (purpose) {
    case 'initial_purchase':
      return 'initial_payment';
    case 'manual_topup':
      return 'manual_topup';
    case 'update_card':
      return 'update_card';
    case 'retry_payment':
      return 'retry_payment';
    case 'renewal_charge':
      return 'recurring_payment';
  }
}

/** Продлевает ли успешный webhook paid-период Pro. */
export function purposeExtendsProPeriod(purpose: BillingCheckoutPurpose): boolean {
  return purpose !== 'update_card';
}

/** Должен ли failed webhook переводить подписку в past_due. */
export function purposeMarksPastDueOnFail(purpose: BillingCheckoutPurpose): boolean {
  return purpose === 'retry_payment' || purpose === 'renewal_charge';
}
