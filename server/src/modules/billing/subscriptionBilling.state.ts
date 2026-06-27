/** UI-состояние страницы тарифов (производное от plan + status + дат). */

export type SubscriptionUiState =
  | 'free'
  | 'pro_active'
  | 'pro_canceled_at_period_end'
  | 'past_due'
  | 'expired';

export type SubscriptionRowLite = {
  planCode: string;
  status: string;
  currentPeriodEnd: Date | string | null;
  cancelAtPeriodEnd: boolean;
  proExpiresAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
};

const GRACE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function periodEndMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

export function isPeriodStillActive(row: SubscriptionRowLite, now = Date.now()): boolean {
  const ends: number[] = [];
  const pe = periodEndMs(row.currentPeriodEnd);
  const pro = periodEndMs(row.proExpiresAt);
  if (pe != null) ends.push(pe);
  if (pro != null) ends.push(pro);
  if (ends.length === 0) return row.planCode === 'pro';
  return Math.max(...ends) > now;
}

export function deriveSubscriptionUiState(row: SubscriptionRowLite, now = Date.now()): SubscriptionUiState {
  const plan = row.planCode.toLowerCase();
  const status = row.status.toLowerCase();

  if (status === 'trialing') {
    const trialEnd = periodEndMs(row.trialEndsAt ?? row.currentPeriodEnd);
    if (trialEnd != null && trialEnd > now) return 'pro_active';
    return 'expired';
  }

  if (plan !== 'pro') return 'free';

  const active = isPeriodStillActive(row, now);

  if (!active) return 'expired';

  if (status === 'past_due' || status === 'payment_failed') {
    const pe = periodEndMs(row.currentPeriodEnd);
    if (pe != null && pe + GRACE_DAYS_MS > now) return 'past_due';
    return 'expired';
  }

  if (row.cancelAtPeriodEnd || status === 'canceled_at_period_end' || status === 'cancelled') {
    return 'pro_canceled_at_period_end';
  }

  return 'pro_active';
}

export function isProEntitled(row: SubscriptionRowLite, now = Date.now()): boolean {
  const status = row.status.toLowerCase();
  if (status === 'trialing') {
    const trialEnd = periodEndMs(row.trialEndsAt ?? row.currentPeriodEnd);
    return trialEnd != null && trialEnd > now;
  }
  const ui = deriveSubscriptionUiState(row, now);
  return ui === 'pro_active' || ui === 'pro_canceled_at_period_end' || ui === 'past_due';
}

export type BillingAction =
  | 'connect_pro'
  | 'manual_topup'
  | 'cancel_auto_renew'
  | 'resume_auto_renew'
  | 'update_payment_method'
  | 'delete_payment_method'
  | 'retry_payment'
  | 'view_payment_history'
  | 'download_receipt';

export function availableBillingActions(ui: SubscriptionUiState): BillingAction[] {
  switch (ui) {
    case 'free':
    case 'expired':
      return ['connect_pro'];
    case 'pro_active':
      return [
        'manual_topup',
        'cancel_auto_renew',
        'update_payment_method',
        'delete_payment_method',
        'view_payment_history',
        'download_receipt',
      ];
    case 'pro_canceled_at_period_end':
      return [
        'manual_topup',
        'resume_auto_renew',
        'update_payment_method',
        'delete_payment_method',
        'view_payment_history',
        'download_receipt',
      ];
    case 'past_due':
      return ['retry_payment', 'update_payment_method', 'delete_payment_method', 'connect_pro'];
    default:
      return [];
  }
}
