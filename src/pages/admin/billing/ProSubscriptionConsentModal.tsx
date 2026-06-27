import { useState } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { billingOutlineBtn, billingPinkBtn } from './adminBillingTheme';
import type { BillingPackageMonths } from '../../../features/billing/billingCopy';
import { billingPackageLabel } from '../../../features/billing/billingCopy';

type Props = {
  open: boolean;
  onClose: () => void;
  amountLabel: string;
  billingPeriod?: 'month' | 'year';
  packageMonths?: BillingPackageMonths;
  autoRenewLegalAllowed?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

function renewalHint(packageMonths: BillingPackageMonths): string {
  if (packageMonths === 12) return 'раз в 12 месяцев';
  if (packageMonths === 3) return 'раз в 3 месяца';
  return 'каждый месяц';
}

export function ProSubscriptionConsentModal({
  open,
  onClose,
  amountLabel,
  billingPeriod,
  packageMonths: packageMonthsProp,
  autoRenewLegalAllowed = true,
  loading = false,
  onConfirm,
}: Props) {
  const [consent, setConsent] = useState(false);
  const packageMonths = packageMonthsProp ?? (billingPeriod === 'year' ? 12 : 1);
  const periodLabel = billingPackageLabel(packageMonths);
  const renewHint = renewalHint(packageMonths);

  return (
    <AdminBottomSheet
      open={open}
      onClose={() => {
        setConsent(false);
        onClose();
      }}
      title="Подключить Master Pro"
      variant="catalog"
    >
      <div className="space-y-4">
        {autoRenewLegalAllowed ? (
          <>
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              После оплаты {amountLabel} тариф Master Pro активируется на {periodLabel}. Далее оплата будет
              списываться автоматически {renewHint}, пока вы не отмените подписку в разделе «Тарифы».
            </p>
            <p className="text-[13px] text-[#9CA3AF]">
              Автопродление {renewHint}. Отменить можно в любой момент.
            </p>
          </>
        ) : (
          <>
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              После оплаты {amountLabel} тариф Master Pro активируется на {periodLabel}. Автосписание
              подключается после сохранения карты у платёжного провайдера; до этого продление — вручную в
              разделе «Тарифы».
            </p>
            <p className="rounded-[14px] bg-[#FFFBEB] px-3 py-2 text-[13px] text-[#92400E] ring-1 ring-[#FDE68A]">
              Автопродление временно недоступно на сервере. Вы получите Pro на оплаченный период.
            </p>
          </>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-[16px] bg-[#F9FAFB] px-4 py-3 ring-1 ring-[#F3F4F6]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] text-[#111827] focus:ring-[#F47C8C]/30"
          />
          <span className="text-[14px] leading-snug text-[#374151]">
            {autoRenewLegalAllowed
              ? `Я понимаю, что подписка продлевается автоматически ${renewHint}.`
              : `Я понимаю условия оплаты тарифа Master Pro на ${periodLabel}.`}
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className={`min-h-12 flex-1 ${billingOutlineBtn}`}>
            Отмена
          </button>
          <button
            type="button"
            disabled={!consent || loading}
            onClick={() => void Promise.resolve(onConfirm())}
            className={`min-h-12 flex-[1.15] ${billingPinkBtn}`}
          >
            {loading ? 'Переход…' : 'Перейти к оплате'}
          </button>
        </div>
      </div>
    </AdminBottomSheet>
  );
}
