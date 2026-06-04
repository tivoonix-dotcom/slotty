import { HiCheckCircle } from 'react-icons/hi2';
import type { BillingPaymentDto } from '../../../features/billing/api/masterBillingApi';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { billingOutlineBtn, billingPinkBtn } from './adminBillingTheme';
import {
  billingPaymentStatusLabel,
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
} from './billingFormat';

type Props = {
  open: boolean;
  payment: BillingPaymentDto | null;
  onClose: () => void;
};

export function BillingPaymentDetailSheet({ open, payment, onClose }: Props) {
  if (!payment) return null;

  const paid = payment.status === 'paid';
  const date = formatBillingDate(payment.paidAt ?? payment.createdAt);
  const card = formatMaskedCard(payment.cardBrand, payment.cardLast4);
  const invoice = payment.invoiceNumber ?? `INV-${payment.id.slice(0, 8).toUpperCase()}`;

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Платёж" variant="catalog">
      <div className="mx-auto max-w-md space-y-5">
        <div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.08)] ring-1 ring-[#F3F4F6]">
          <div className="flex flex-col items-center text-center">
            {paid ? (
              <HiCheckCircle className="h-12 w-12 text-[#22C55E]" aria-hidden />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF]">!</div>
            )}
            <p className="mt-3 text-[13px] font-medium text-[#6B7280]">
              {paid ? 'Счёт оплачен' : billingPaymentStatusLabel(payment.status)}
            </p>
            <p className="mt-1 text-[32px] font-black tracking-[-0.04em] text-[#111827]">
              {formatBillingMoney(payment.amount, payment.currency)}
            </p>
          </div>

          <dl className="mt-6 space-y-3 border-t border-[#F3F4F6] pt-5 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Номер счета</dt>
              <dd className="font-semibold text-[#111827]">{invoice}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Дата платежа</dt>
              <dd className="font-semibold text-[#111827]">{date ?? '—'}</dd>
            </div>
            {card ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B7280]">Способ оплаты</dt>
                <dd className="font-semibold text-[#111827]">{card}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex gap-2">
            {payment.receiptUrl ? (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 text-center ${billingOutlineBtn}`}
              >
                Загрузить счёт
              </a>
            ) : (
              <button type="button" disabled className={`flex-1 ${billingOutlineBtn} opacity-50`}>
                Загрузить счёт
              </button>
            )}
            <button type="button" onClick={onClose} className={`flex-1 ${billingPinkBtn}`}>
              Закрыть
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF]">
          Оплата через <span className="font-semibold text-[#374151]">bePaid</span>
        </p>
      </div>
    </AdminBottomSheet>
  );
}
