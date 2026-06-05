import type { ReactNode } from 'react';
import { HiCreditCard, HiDocumentText } from 'react-icons/hi2';
import type { BillingSubscriptionResponse } from '../../../features/billing/api/masterBillingApi';
import {
  billingPanel,
  billingPinkBtn,
  billingSaasMethodCard,
  billingSaasPillBtn,
  billingSaasPillBtnDanger,
  billingSaasPillBtnPrimary,
  billingSaasRowDivider,
  billingSaasSectionHint,
  billingSaasSectionTitle,
  billingSaasStatusActive,
  billingSaasStatusMuted,
  billingTrayLabel,
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

function SaasRow({
  title,
  hint,
  action,
  children,
  withDivider = true,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children?: ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div className={withDivider ? `${billingSaasRowDivider} py-4 first:pt-0 last:border-b-0 last:pb-0` : 'pt-1'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={billingSaasSectionTitle}>{title}</p>
          {hint ? <p className={billingSaasSectionHint}>{hint}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

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
  const priceLine = formatBillingMoney(billing.priceAmount, billing.currency);
  const periodUnit = billing.billingPeriod === 'year' ? 'год' : 'месяц';

  const { uiState } = billing;

  if (uiState === 'free') {
    return null;
  }

  if (uiState === 'expired') {
    return (
      <section className={`${billingPanel} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Pro не активен</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Подписка Pro закончилась. Подключите Pro, чтобы снова пользоваться расширенными возможностями.
            </p>
          </div>
          <span className={billingSaasStatusMuted}>Не активен</span>
        </div>
        <button type="button" disabled={busy} onClick={onConnectPro} className={billingPinkBtn}>
          Подключить Pro
        </button>
      </section>
    );
  }

  if (uiState === 'past_due') {
    return (
      <section className={`${billingPanel} space-y-1 border-[#FECACA] bg-[#FFFBFB]`}>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[18px] font-bold text-[#9B2C2C]">Не удалось продлить подписку</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Платёж не прошёл. Проверьте карту или добавьте новый способ оплаты.
            </p>
          </div>
          <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-[12px] font-semibold text-[#DC2626] ring-1 ring-[#FECACA]">
            Ошибка оплаты
          </span>
        </div>

        <SaasRow
          title="Способ оплаты"
          hint={card ?? 'Карта не привязана'}
          action={
            <button type="button" disabled={busy} onClick={onUpdateCard} className={billingSaasPillBtn}>
              Изменить карту
            </button>
          }
        >
          {card ? (
            <div className={billingSaasMethodCard}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]">
                <HiCreditCard className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#111827]">{card}</p>
                <p className="text-[12px] font-medium text-[#6B7280]">Обновите данные и повторите оплату</p>
              </div>
            </div>
          ) : null}
        </SaasRow>

        <SaasRow
          title="Продление"
          hint="Повторите списание, чтобы сохранить доступ к Pro"
          withDivider={false}
          action={
            <button type="button" disabled={busy} onClick={onRetryPayment} className={billingSaasPillBtnPrimary}>
              Повторить оплату
            </button>
          }
        />
      </section>
    );
  }

  if (uiState === 'pro_canceled_at_period_end') {
    return (
      <section className={`${billingPanel} space-y-1`}>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[20px] font-bold text-[#111827]">
              Master Pro активен{periodEnd ? ` до ${periodEnd}` : ''}
            </h3>
            <p className="mt-1 text-[14px] font-medium text-[#374151]">
              {priceLine} / {periodUnit}
            </p>
            <p className="mt-1 text-[13px] text-[#6B7280]">Автопродление отключено — следующего списания не будет.</p>
          </div>
          <span className={billingSaasStatusMuted}>Без автопродления</span>
        </div>

        {card ? (
          <SaasRow
            title="Способ оплаты"
            action={
              <button type="button" disabled={busy} onClick={onUpdateCard} className={billingSaasPillBtn}>
                Изменить карту
              </button>
            }
          >
            <div className={billingSaasMethodCard}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]">
                <HiCreditCard className="h-5 w-5" aria-hidden />
              </span>
              <p className="truncate text-[14px] font-semibold text-[#111827]">{card}</p>
            </div>
          </SaasRow>
        ) : null}

        <SaasRow
          title="Платежи"
          hint="История списаний и чеков"
          action={
            <button type="button" disabled={busy} onClick={onShowHistory} className={billingSaasPillBtn}>
              История платежей
            </button>
          }
        />

        <SaasRow
          title="Автопродление"
          hint="Включите снова, чтобы подписка продлилась автоматически"
          withDivider={false}
          action={
            <button type="button" disabled={busy} onClick={onResumeAutoRenew} className={billingSaasPillBtnPrimary}>
              Возобновить
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section className={`${billingPanel} space-y-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <p className={billingTrayLabel}>Подписка</p>
          <h3 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Master Pro активен</h3>
          <p className="mt-1 text-[14px] font-medium text-[#374151]">
            {priceLine} / {periodUnit}
          </p>
          {nextCharge ? (
            <p className="mt-1 text-[13px] text-[#6B7280]">Следующее списание: {nextCharge}</p>
          ) : null}
        </div>
        <span className={billingSaasStatusActive}>Активен</span>
      </div>

      <SaasRow
        title="Способ оплаты"
        hint={card ? undefined : 'Привяжите карту для автопродления'}
        action={
          <button type="button" disabled={busy} onClick={onUpdateCard} className={billingSaasPillBtn}>
            Изменить карту
          </button>
        }
      >
        {card ? (
          <div className={billingSaasMethodCard}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]">
              <HiCreditCard className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#111827]">{card}</p>
              <span className="mt-1 inline-flex rounded-full bg-[#EEF0FC] px-2 py-0.5 text-[11px] font-semibold text-[#3B4CCA]">
                По умолчанию
              </span>
            </div>
          </div>
        ) : (
          <div className={`${billingSaasMethodCard} text-[13px] font-medium text-[#6B7280]`}>
            Карта не указана
          </div>
        )}
      </SaasRow>

      <SaasRow
        title="Платежи"
        hint="История списаний и чеков"
        action={
          <button type="button" disabled={busy} onClick={onShowHistory} className={billingSaasPillBtn}>
            <HiDocumentText className="mr-1.5 h-4 w-4" aria-hidden />
            История платежей
          </button>
        }
      />

      <SaasRow
        title="Автопродление"
        hint="Отключите, если не хотите продлевать подписку автоматически"
        withDivider={false}
        action={
          <button type="button" disabled={busy} onClick={onCancelAutoRenew} className={billingSaasPillBtnDanger}>
            Отменить автопродление
          </button>
        }
      />
    </section>
  );
}
