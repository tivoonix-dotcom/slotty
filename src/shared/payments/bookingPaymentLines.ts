import { resolveBelarusBanks } from './belarusBanks';
import {
  PAYMENT_METHOD_LABELS,
  type MasterPublicPaymentDto,
  type PaymentMethodCode,
} from './paymentMethodCodes';

export function buildBookingPaymentLines(payment: MasterPublicPaymentDto | null | undefined): string[] {
  if (!payment) return [];
  const lines: string[] = [];
  if (payment.methods.length) {
    const labels = payment.methods.map((code) => PAYMENT_METHOD_LABELS[code as PaymentMethodCode] ?? code);
    lines.push(`Оплата: ${labels.join(', ')}`);
  }
  const banks = resolveBelarusBanks(payment.preferredBankIds);
  if (banks.length) {
    const preview = banks
      .slice(0, 3)
      .map((b) => b.name)
      .join(', ');
    const rest = banks.length > 3 ? ` + ещё ${banks.length - 3}` : '';
    lines.push(`Удобные банки: ${preview}${rest}`);
  }
  if (payment.comment?.trim()) {
    lines.push(`Комментарий мастера: ${payment.comment.trim()}`);
  }
  return lines;
}

export function mergeBookingRuleLines(
  clientPreview: string[] | undefined,
  payment: MasterPublicPaymentDto | null | undefined,
  maxLines = 6,
): string[] {
  const paymentLines = buildBookingPaymentLines(payment);
  const base = (clientPreview ?? []).filter((line) => !/^Оплата:/i.test(line));
  return [...base, ...paymentLines].slice(0, maxLines);
}
