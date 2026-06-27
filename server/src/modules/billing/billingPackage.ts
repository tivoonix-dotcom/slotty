/** Допустимые пакеты Pro: 1 / 3 / 12 месяцев. */
export type BillingPackageMonths = 1 | 3 | 12;

export const BILLING_PACKAGE_MONTHS: readonly BillingPackageMonths[] = [1, 3, 12] as const;

export function parseBillingPackageMonths(raw: unknown): BillingPackageMonths {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (n === 1 || n === 3 || n === 12) return n;
  throw new Error('INVALID_BILLING_PACKAGE');
}

export function packageMonthsToBillingPeriod(months: BillingPackageMonths): 'month' | 'year' {
  return months === 12 ? 'year' : 'month';
}

/** Дни для расчёта периода (существующая конвенция: 30/365). */
export function packageMonthsToDays(months: BillingPackageMonths): number {
  if (months === 12) return 365;
  if (months === 3) return 90;
  return 30;
}

export type ProPlanPrices = {
  priceMonth: number;
  priceYear: number;
};

export function resolvePackageAmount(
  months: BillingPackageMonths,
  prices: ProPlanPrices,
): { amount: number; amountMinor: number; description: string } {
  let amount: number;
  let label: string;
  if (months === 12) {
    amount = prices.priceYear;
    label = '12 месяцев';
  } else if (months === 3) {
    amount = prices.priceMonth * 3;
    label = '3 месяца';
  } else {
    amount = prices.priceMonth;
    label = '1 месяц';
  }
  const amountMinor = Math.round(amount * 100);
  return {
    amount,
    amountMinor,
    description: `SLOTTY Pro (${label})`,
  };
}

/** Логический ключ для поиска переиспользуемого pending checkout (TTL). */
export function checkoutReuseKey(input: {
  masterId: string;
  purpose: string;
  packageMonths: BillingPackageMonths;
}): string {
  return `checkout:${input.masterId}:${input.purpose}:${input.packageMonths}`;
}

/** Уникальный ключ строки payments — новая попытка после завершённого checkout. */
export function uniqueCheckoutIdempotencyKey(input: {
  masterId: string;
  purpose: string;
  packageMonths: BillingPackageMonths;
  attemptId: string;
}): string {
  return `${checkoutReuseKey(input)}:${input.attemptId}`;
}

/** @deprecated Используйте checkoutReuseKey + uniqueCheckoutIdempotencyKey */
export function stableCheckoutIdempotencyKey(input: {
  masterId: string;
  purpose: string;
  packageMonths: BillingPackageMonths;
}): string {
  return checkoutReuseKey(input);
}

export function billingPackageMonthsLabel(months: BillingPackageMonths): string {
  if (months === 12) return '12 месяцев';
  if (months === 3) return '3 месяца';
  return '1 месяц';
}

/** Определить длительность пакета подписки для renewal и UI. */
export function inferSubscriptionPackageMonths(input: {
  billingPeriod: 'month' | 'year' | null;
  priceAmount: number | null;
  priceMonth: number;
  priceYear: number;
}): BillingPackageMonths {
  if (input.billingPeriod === 'year') return 12;
  if (input.priceAmount != null) {
    const month3 = input.priceMonth * 3;
    if (Math.abs(input.priceAmount - month3) < 0.02) return 3;
    if (Math.abs(input.priceAmount - input.priceYear) < 0.02) return 12;
  }
  return 1;
}

export type PeriodBoundsInput = {
  purpose: import('./billingCheckoutPurpose.js').BillingCheckoutPurpose;
  packageMonths: BillingPackageMonths;
  now: Date;
  currentPeriodEnd: Date;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  isProPeriodActive: boolean;
};

export type PeriodBounds = {
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Расчёт границ периода после успешной оплаты.
 * - active Pro / canceled_at_end: продление от current_period_end
 * - trial: paid период начинается после trial end
 * - free/expired: от now
 */
export function computePeriodBounds(input: PeriodBoundsInput): PeriodBounds {
  const days = packageMonthsToDays(input.packageMonths);
  const ms = days * 24 * 60 * 60 * 1000;

  if (input.subscriptionStatus === 'trialing' && input.trialEndsAt) {
    const trialEndMs = input.trialEndsAt.getTime();
    const periodStart = new Date(Math.max(input.now.getTime(), trialEndMs));
    return { periodStart, periodEnd: new Date(periodStart.getTime() + ms) };
  }

  let periodStart: Date;
  if (
    input.isProPeriodActive &&
    input.currentPeriodEnd.getTime() > input.now.getTime()
  ) {
    periodStart = input.currentPeriodEnd;
  } else {
    periodStart = input.now;
  }

  return { periodStart, periodEnd: new Date(periodStart.getTime() + ms) };
}
