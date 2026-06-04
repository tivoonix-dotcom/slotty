import { useState } from 'react';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { billingOutlineBtn, billingPinkBtn } from './adminBillingTheme';

type Props = {
  open: boolean;
  onClose: () => void;
  amountLabel: string;
  billingPeriod: 'month' | 'year';
  autoRenewLegalAllowed?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ProSubscriptionConsentModal({
  open,
  onClose,
  amountLabel,
  billingPeriod,
  autoRenewLegalAllowed = true,
  loading = false,
  onConfirm,
}: Props) {
  const [consent, setConsent] = useState(false);
  const periodWord = billingPeriod === 'year' ? 'год' : 'месяц';

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
              После оплаты {amountLabel} тариф Master Pro активируется сразу. Далее {amountLabel} будут
              списываться автоматически каждый {periodWord}, пока вы не отмените подписку в разделе «Тарифы».
            </p>
            <p className="text-[13px] text-[#9CA3AF]">
              Автопродление каждый {periodWord}. Отменить можно в любой момент.
            </p>
          </>
        ) : (
          <>
            <p className="text-[14px] leading-relaxed text-[#6B7280]">
              После оплаты {amountLabel} тариф Master Pro активируется на выбранный период. Автосписание
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
              ? `Я понимаю, что подписка продлевается автоматически каждый ${periodWord}.`
              : `Я понимаю условия оплаты тарифа Master Pro на ${periodWord}.`}
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
