export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function formatBillingDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatBillingMoney(amount: number, currency = 'BYN'): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatMaskedCard(brand: string | null, last4: string | null): string | null {
  if (!last4) return null;
  const b = brand?.trim() || 'Карта';
  return `${b} •••• ${last4}`;
}

export function formatCardExpiry(month: number | null, year: number | null): string | null {
  if (!month || !year) return null;
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `до ${mm}/${yy}`;
}

export function daysUntilDate(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.ceil((t - now) / (24 * 60 * 60 * 1000)));
}

export function formatDaysRemaining(iso: string | null | undefined): string | null {
  const days = daysUntilDate(iso);
  if (days == null) return null;
  if (days === 0) return 'Заканчивается сегодня';
  const mod10 = days % 10;
  const mod100 = days % 100;
  let word = 'дней';
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'день';
    else if (mod10 >= 2 && mod10 <= 4) word = 'дня';
  }
  return `Осталось ${days} ${word}`;
}

export function subscriptionUiStatusLabel(
  uiState: string,
  status: string,
): string {
  if (status === 'trialing') return 'Пробный Pro';
  switch (uiState) {
    case 'pro_active':
      return 'Активна';
    case 'pro_canceled_at_period_end':
      return 'Автопродление отключено';
    case 'past_due':
      return 'Нужно оплатить';
    case 'expired':
      return 'Истекла';
    default:
      return status === 'active' ? 'Активна' : 'Бесплатный';
  }
}

export function billingPackagePeriodLabel(
  billingPeriod: 'month' | 'year',
  packageMonths?: 1 | 3 | 12 | null,
): string {
  if (packageMonths === 3) return '3 месяца';
  if (packageMonths === 12) return '12 месяцев';
  if (packageMonths === 1) return '1 месяц';
  if (billingPeriod === 'year') return '12 месяцев';
  return '1 месяц';
}

export function hasBillingCard(billing: {
  cardLast4: string | null;
  autoRenewCapable?: boolean;
}): boolean {
  return Boolean(billing.cardLast4?.trim());
}

export function billingPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Оплачен';
    case 'failed':
      return 'Ошибка';
    case 'refunded':
      return 'Возврат';
    case 'canceled':
      return 'Отменено';
    case 'pending':
    default:
      return 'Ожидает';
  }
}

export function billingPaymentKindLabel(kind: string): string {
  if (kind === 'renewal') return 'Продление Pro';
  if (kind === 'initial') return 'Подключение Pro';
  return 'Master Pro';
}

export function resolveRenewalDateIso(billing: {
  nextChargeAt: string | null;
  nextPaymentHint: string | null;
  currentPeriodEnd: string;
}): string | null {
  return billing.nextChargeAt ?? billing.nextPaymentHint ?? billing.currentPeriodEnd ?? null;
}

export function formatRenewalSchedule(
  billing: {
    nextChargeAt: string | null;
    nextPaymentHint: string | null;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  },
  uiState: string,
): string | null {
  if (uiState === 'pro_canceled_at_period_end') {
    const end = formatBillingDate(billing.currentPeriodEnd);
    return end ? `Доступ сохранится до ${end}` : null;
  }
  if (uiState !== 'pro_active' || billing.cancelAtPeriodEnd) return null;

  const date = formatBillingDate(resolveRenewalDateIso(billing));
  if (!date) return null;

  const explicit = Boolean(billing.nextChargeAt ?? billing.nextPaymentHint);
  return explicit
    ? `Следующее списание ${date}`
    : `Продление подписки ${date}`;
}
