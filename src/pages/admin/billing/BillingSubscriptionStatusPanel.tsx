import type { BillingSubscriptionResponse } from '../../../features/billing/api/masterBillingApi';
import {
  billingOutlineBtn,
  billingPinkBtn,
  billingPanel,
  billingSoftNote,
} from './adminBillingTheme';
import {
  formatBillingDate,
  formatBillingMoney,
  formatMaskedCard,
} from './billingFormat';

type Props = {
  billing: BillingSubscriptionResponse;
  busy?: boolean;
  onConnectPro: () => void;
  onCancelAutoRenew: () => void;
  onResumeAutoRenew: () => void;
  onUpdateCard: () => void;
  onRetryPayment: () => void;
  onShowHistory: () => void;
};

export function BillingSubscriptionStatusPanel({
  billing,
  busy = false,
  onConnectPro,
  onCancelAutoRenew,
  onResumeAutoRenew,
  onUpdateCard,
  onRetryPayment,
  onShowHistory,
}: Props) {
  const nextCharge = formatBillingDate(billing.nextChargeAt ?? billing.nextPaymentHint);
  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const card = formatMaskedCard(billing.cardBrand, billing.cardLast4);
  const priceLine = formatBillingMoney(
    billing.priceAmount,
    billing.currency,
  );
  const periodUnit = billing.billingPeriod === 'year' ? 'год' : 'месяц';

  const { uiState } = billing;

  if (uiState === 'free' || uiState === 'expired') {
    return (
      <section className={`${billingPanel} space-y-3`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Ваш тариф</p>
          <h3 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Free</h3>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            {uiState === 'expired'
              ? 'Подписка Pro закончилась. Подключите Pro, чтобы снова пользоваться расширенными возможностями.'
              : 'Бесплатный старт — перейдите на Pro, когда понадобятся расширенные возможности.'}
          </p>
        </div>
        {uiState === 'expired' ? (
          <button type="button" disabled={busy} onClick={onConnectPro} className={billingPinkBtn}>
            Подключить Pro
          </button>
        ) : null}
      </section>
    );
  }

  if (uiState === 'past_due') {
    return (
      <section className={`${billingPanel} space-y-4 border-[#FECACA] bg-[#FFFBFB]`}>
        <div>
          <h3 className="text-[18px] font-bold text-[#9B2C2C]">Не удалось продлить подписку</h3>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Платёж не прошёл. Проверьте карту или добавьте новый способ оплаты.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={onRetryPayment} className={`${billingPinkBtn} !w-auto px-5`}>
            Повторить оплату
          </button>
          <button type="button" disabled={busy} onClick={onUpdateCard} className={`${billingOutlineBtn} !w-auto px-5`}>
            Изменить карту
          </button>
        </div>
      </section>
    );
  }

  if (uiState === 'pro_canceled_at_period_end') {
    return (
      <section className={`${billingPanel} space-y-4`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Подписка</p>
          <h3 className="mt-1 text-[20px] font-bold text-[#111827]">
            Master Pro активен{periodEnd ? ` до ${periodEnd}` : ''}
          </h3>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Автопродление отключено. Следующего списания не будет.
          </p>
          <p className={billingSoftNote + ' mt-3'}>{priceLine} / {periodUnit}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={onResumeAutoRenew} className={`${billingPinkBtn} !w-auto px-5`}>
            Возобновить автопродление
          </button>
          <button type="button" disabled={busy} onClick={onShowHistory} className={`${billingOutlineBtn} !w-auto px-5`}>
            История платежей
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`${billingPanel} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">Подписка</p>
          <h3 className="mt-1 text-[20px] font-bold text-[#111827]">Master Pro активен</h3>
          {nextCharge ? (
            <p className="mt-1 text-[14px] text-[#6B7280]">Следующее списание: {nextCharge}</p>
          ) : null}
          <p className="mt-0.5 text-[14px] font-medium text-[#374151]">
            {priceLine} / {periodUnit}
          </p>
          {card ? <p className="mt-1 text-[13px] text-[#6B7280]">Карта: {card}</p> : null}
        </div>
        <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[12px] font-semibold text-[#047857] ring-1 ring-[#A7F3D0]">
          Активен
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={onUpdateCard} className={`${billingOutlineBtn} !w-auto px-4 text-[13px]`}>
          Изменить карту
        </button>
        <button type="button" disabled={busy} onClick={onCancelAutoRenew} className={`${billingOutlineBtn} !w-auto px-4 text-[13px] text-[#DC2626] ring-[#FECACA]`}>
          Отменить автопродление
        </button>
        <button type="button" disabled={busy} onClick={onShowHistory} className={`${billingOutlineBtn} !w-auto px-4 text-[13px]`}>
          История платежей
        </button>
      </div>
    </section>
  );
}
