import type { ReactNode } from 'react';
import { HiCreditCard, HiDocumentText } from 'react-icons/hi2';
import type { BillingSubscriptionResponse } from '../../../features/billing/api/masterBillingApi';
import { BILLING_COPY } from '../../../features/billing/billingCopy';
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
  billingErrorBanner,
} from './adminBillingTheme';
import {
  billingPackagePeriodLabel,
  formatBillingDate,
  formatBillingMoney,
  formatCardExpiry,
  formatDaysRemaining,
  formatMaskedCard,
  hasBillingCard,
  subscriptionUiStatusLabel,
} from './billingFormat';

type Props = {
  billing: BillingSubscriptionResponse;
  busy?: boolean;
  cardActionError?: string | null;
  onConnectPro: () => void;
  onManualTopup: () => void;
  onCancelAutoRenew: () => void;
  onResumeAutoRenew: () => void;
  onUpdateCard: () => void;
  onDeleteCard: () => void;
  onRetryPayment: () => void;
  onShowHistory: () => void;
  onRetryCardAction?: () => void;
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 text-[13px]">
      <span className="font-medium text-[#6B7280]">{label}</span>
      <span className="font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function SubscriptionDetailsBlock({ billing }: { billing: BillingSubscriptionResponse }) {
  const periodStart = formatBillingDate(billing.currentPeriodStart);
  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const nextCharge = formatBillingDate(billing.nextChargeAt ?? billing.nextPaymentHint);
  const daysLeft = formatDaysRemaining(billing.currentPeriodEnd);
  const priceLine = formatBillingMoney(billing.priceAmount, billing.currency);
  const periodLabel = billingPackagePeriodLabel(
    billing.billingPeriod,
    billing.billingPackageMonths,
  );
  const planLabel = billing.planCode === 'pro' || billing.isProEntitled ? 'Pro' : 'Бесплатный';

  return (
    <div className="mb-4 divide-y divide-[#F3F4F6] rounded-[14px] bg-[#F9FAFB] px-4 py-1">
      <DetailRow label="Статус" value={subscriptionUiStatusLabel(billing.uiState, billing.status)} />
      <DetailRow label="Тариф" value={planLabel} />
      <DetailRow label="Период оплаты" value={periodLabel} />
      <DetailRow label="Цена" value={`${priceLine} / ${periodLabel.toLowerCase()}`} />
      {periodStart ? <DetailRow label="Начало периода" value={periodStart} /> : null}
      {periodEnd ? <DetailRow label="Окончание периода" value={periodEnd} /> : null}
      {daysLeft ? <DetailRow label="Доступ" value={daysLeft} /> : null}
      {billing.uiState === 'pro_active' && billing.autoRenewEnabled && nextCharge ? (
        <DetailRow label="Следующее списание" value={nextCharge} />
      ) : null}
      {billing.uiState === 'pro_canceled_at_period_end' && periodEnd ? (
        <DetailRow label="Автопродление" value={`Отключено — Pro до ${periodEnd}`} />
      ) : null}
      {!hasBillingCard(billing) && billing.autoRenewEnabled ? (
        <DetailRow label="Автопродление" value={BILLING_COPY.cardNotLinkedAutoRenew} />
      ) : null}
    </div>
  );
}

function PaymentMethodBlock({
  billing,
  busy,
  onUpdateCard,
  onDeleteCard,
}: {
  billing: BillingSubscriptionResponse;
  busy: boolean;
  onUpdateCard: () => void;
  onDeleteCard: () => void;
}) {
  const card = formatMaskedCard(billing.cardBrand, billing.cardLast4);
  const expiry = formatCardExpiry(billing.cardExpMonth, billing.cardExpYear);
  const hasCard = hasBillingCard(billing);

  return (
    <SaasRow
      title="Способ оплаты"
      hint={hasCard ? expiry ?? undefined : BILLING_COPY.cardNotLinkedAutoRenew}
      action={
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={onUpdateCard} className={billingSaasPillBtn}>
            {hasCard ? BILLING_COPY.changeCard : BILLING_COPY.addCard}
          </button>
          {hasCard ? (
            <button type="button" disabled={busy} onClick={onDeleteCard} className={billingSaasPillBtnDanger}>
              {BILLING_COPY.deleteCard}
            </button>
          ) : null}
        </div>
      }
    >
      {hasCard ? (
        <div className={billingSaasMethodCard}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]">
            <HiCreditCard className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#111827]">{card}</p>
            {expiry ? <p className="text-[12px] font-medium text-[#6B7280]">Срок действия {expiry}</p> : null}
          </div>
        </div>
      ) : (
        <div className={`${billingSaasMethodCard} text-[13px] font-medium leading-relaxed text-[#6B7280]`}>
          Карта не привязана. Добавьте карту для автопродления и быстрой оплаты.
        </div>
      )}
    </SaasRow>
  );
}

export function BillingSubscriptionStatusPanel({
  billing,
  busy = false,
  cardActionError = null,
  onConnectPro,
  onManualTopup,
  onCancelAutoRenew,
  onResumeAutoRenew,
  onUpdateCard,
  onDeleteCard,
  onRetryPayment,
  onShowHistory,
  onRetryCardAction,
}: Props) {
  const periodEnd = formatBillingDate(billing.currentPeriodEnd);
  const { uiState } = billing;

  if (uiState === 'free') {
    return null;
  }

  const errorBanner = cardActionError ? (
    <div className="mb-4 space-y-2">
      <p className={billingErrorBanner}>{cardActionError}</p>
      {onRetryCardAction ? (
        <button type="button" disabled={busy} onClick={onRetryCardAction} className={billingSaasPillBtnPrimary}>
          {BILLING_COPY.retryAction}
        </button>
      ) : null}
    </div>
  ) : null;

  if (uiState === 'expired') {
    return (
      <section className={`${billingPanel} space-y-4`}>
        {errorBanner}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Pro не активен</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Подписка Pro закончилась. Подключите Pro, чтобы снова пользоваться расширенными возможностями.
            </p>
          </div>
          <span className={billingSaasStatusMuted}>Истёк</span>
        </div>
        <button type="button" disabled={busy} onClick={onConnectPro} className={billingPinkBtn}>
          {BILLING_COPY.connectPro}
        </button>
      </section>
    );
  }

  if (uiState === 'past_due') {
    return (
      <section className={`${billingPanel} space-y-1 border-[#FECACA] bg-[#FFFBFB]`}>
        {errorBanner}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[18px] font-bold text-[#9B2C2C]">Не удалось продлить подписку</h3>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Платёж не прошёл. Проверьте карту или добавьте новый способ оплаты.
            </p>
          </div>
          <span className="rounded-full bg-[#FEF2F2] px-3 py-1 text-[12px] font-semibold text-[#DC2626] ring-1 ring-[#FECACA]">
            Просрочен
          </span>
        </div>
        <SubscriptionDetailsBlock billing={billing} />
        <PaymentMethodBlock billing={billing} busy={busy} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} />
        <SaasRow
          title="Продление"
          hint="Повторите списание, чтобы сохранить доступ к Pro"
          withDivider={false}
          action={
            <button type="button" disabled={busy} onClick={onRetryPayment} className={billingSaasPillBtnPrimary}>
              {BILLING_COPY.retryPayment}
            </button>
          }
        />
      </section>
    );
  }

  if (uiState === 'pro_canceled_at_period_end') {
    return (
      <section className={`${billingPanel} space-y-1`}>
        {errorBanner}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className={billingTrayLabel}>Подписка</p>
            <h3 className="mt-1 text-[20px] font-bold text-[#111827]">
              Master Pro активен{periodEnd ? ` до ${periodEnd}` : ''}
            </h3>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {BILLING_COPY.autoRenewDisabledUntil} {periodEnd ?? 'окончания периода'}.
            </p>
          </div>
          <span className={billingSaasStatusMuted}>Без автопродления</span>
        </div>
        <SubscriptionDetailsBlock billing={billing} />
        <PaymentMethodBlock billing={billing} busy={busy} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} />
        <SaasRow
          title="Платежи"
          hint="История списаний и чеков"
          action={
            <button type="button" disabled={busy} onClick={onShowHistory} className={billingSaasPillBtn}>
              {BILLING_COPY.paymentHistory}
            </button>
          }
        />
        <SaasRow
          title="Автопродление"
          hint={
            billing.autoRenewCapable
              ? 'Включите снова, чтобы подписка продлилась автоматически'
              : BILLING_COPY.cardNotLinkedAutoRenew
          }
          withDivider={false}
          action={
            <button
              type="button"
              disabled={busy || !billing.autoRenewCapable}
              onClick={onResumeAutoRenew}
              className={billingSaasPillBtnPrimary}
            >
              {BILLING_COPY.resumeAutoRenew}
            </button>
          }
        />
      </section>
    );
  }

  const statusLabel =
    billing.status === 'trialing' ? 'Пробный Pro' : subscriptionUiStatusLabel(uiState, billing.status);

  return (
    <section className={`${billingPanel} space-y-1`}>
      {errorBanner}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <p className={billingTrayLabel}>Подписка</p>
          <h3 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Master Pro активен</h3>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {formatBillingMoney(billing.priceAmount, billing.currency)} /{' '}
            {billingPackagePeriodLabel(billing.billingPeriod).toLowerCase()}
          </p>
        </div>
        <span className={billingSaasStatusActive}>{statusLabel}</span>
      </div>

      <SubscriptionDetailsBlock billing={billing} />

      <PaymentMethodBlock billing={billing} busy={busy} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} />

      <SaasRow
        title="Продление"
        hint="Добавьте оплаченный период к текущей подписке"
        action={
          <button type="button" disabled={busy} onClick={onManualTopup} className={billingSaasPillBtnPrimary}>
            {BILLING_COPY.extendPro}
          </button>
        }
      />

      <SaasRow
        title="Платежи"
        hint="История списаний и чеков"
        action={
          <button type="button" disabled={busy} onClick={onShowHistory} className={billingSaasPillBtn}>
            <HiDocumentText className="mr-1.5 h-4 w-4" aria-hidden />
            {BILLING_COPY.paymentHistory}
          </button>
        }
      />

      <SaasRow
        title="Автопродление"
        hint={
          billing.autoRenewCapable
            ? 'Отключите, если не хотите продлевать подписку автоматически'
            : BILLING_COPY.cardNotLinkedAutoRenew
        }
        withDivider={false}
        action={
          <button
            type="button"
            disabled={busy || !billing.autoRenewCapable}
            onClick={onCancelAutoRenew}
            className={billingSaasPillBtnDanger}
          >
            {BILLING_COPY.cancelAutoRenew}
          </button>
        }
      />
    </section>
  );
}
