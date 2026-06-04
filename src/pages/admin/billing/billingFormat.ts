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

export function formatBillingMoney(amount: number, currency = 'BYN'): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatMaskedCard(brand: string | null, last4: string | null): string | null {
  if (!last4) return null;
  const b = brand?.trim() || 'Карта';
  return `${b} •••• ${last4}`;
}

export function billingPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Оплачено';
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
