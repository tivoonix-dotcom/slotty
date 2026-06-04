import type { BillingPaymentDto } from '../../../features/billing/api/masterBillingApi';
import { billingPanel } from './adminBillingTheme';
import {
  billingPaymentStatusLabel,
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
} from './billingFormat';

type Props = {
  payments: BillingPaymentDto[];
  loading?: boolean;
  onView: (payment: BillingPaymentDto) => void;
};

function statusPillClass(status: string): string {
  if (status === 'paid') return 'bg-[#ECFDF5] text-[#047857] ring-[#A7F3D0]';
  if (status === 'failed') return 'bg-[#FEF2F2] text-[#DC2626] ring-[#FECACA]';
  if (status === 'refunded') return 'bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]';
  return 'bg-[#FFFBEB] text-[#92400E] ring-[#FDE68A]';
}

export function BillingPaymentHistory({ payments, loading, onView }: Props) {
  return (
    <section className={`${billingPanel} space-y-4`}>
      <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">История платежей</h3>

      {loading ? (
        <p className="py-6 text-center text-[14px] text-[#6B7280]">Загрузка…</p>
      ) : payments.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[#6B7280]">Платежей пока нет</p>
      ) : (
        <ul className="divide-y divide-[#F3F4F6]">
          {payments.map((p) => {
            const date = formatBillingDate(p.paidAt ?? p.createdAt);
            const card = formatMaskedCard(p.cardBrand, p.cardLast4);
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#111827]">{date ?? '—'}</p>
                  <p className="text-[13px] text-[#6B7280]">
                    {formatBillingMoney(p.amount, p.currency)}
                    {card ? ` · ${card}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ${statusPillClass(p.status)}`}
                  >
                    {billingPaymentStatusLabel(p.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onView(p)}
                    className="text-[13px] font-semibold text-[#E29595] underline underline-offset-2 hover:text-[#F47C8C]"
                  >
                    Просмотр
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
