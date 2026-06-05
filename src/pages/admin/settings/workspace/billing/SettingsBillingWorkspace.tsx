import { useState } from 'react';
import {
  HiArrowRight,
  HiCreditCard,
  HiLockClosed,
  HiReceiptPercent,
} from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { ADMIN_PATH, MASTER_SETTINGS_SUPPORT_PATH } from '../../../../../app/paths';
import { LoadingVideo } from '../../../../../shared/ui/LoadingVideo';
import { PaymentLogoImage } from '../../../../../shared/ui/PaymentLogos/PaymentLogoImage';
import { PAYMENT_METHODS, paymentLogoCompactHeightClass } from '../../../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { AdminToast } from '../../../shared/AdminToast';
import { BillingPaymentDetailSheet } from '../../../billing/BillingPaymentDetailSheet';
import {
  billingPaymentKindLabel,
  billingPaymentStatusLabel,
  formatBillingDateShort,
  formatBillingMoney,
  formatRenewalSchedule,
} from '../../../billing/billingFormat';
import type { BillingSubscriptionResponse } from '../../../../../features/billing/api/masterBillingApi';
import {
  SettingsCabinetFeatureCard,
  SettingsCabinetSectionTitle,
  SettingsCabinetStatusPill,
  settingsCabinetOutlineBtn,
  settingsCabinetPrimaryBtn,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { SettingsErrorState } from '../settingsUi';
import { BillingTrialStatusCard } from '../../../../../features/billing/BillingTrialStatusCard';
import { useSettingsBilling } from './useSettingsBilling';
import { SubscriptionDetailsButton, SubscriptionReceiptModal } from './SubscriptionReceiptModal';

const ADMIN_BILLING_PATH = `${ADMIN_PATH}/billing`;
const MASTERCARD = PAYMENT_METHODS.find((m) => m.id === 'mastercard')!;
const BEPAID = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

function cardBrandMethod(brand: string | null) {
  const b = brand?.toLowerCase() ?? '';
  if (b.includes('visa')) return PAYMENT_METHODS.find((m) => m.id === 'visa');
  if (b.includes('master')) return MASTERCARD;
  if (b.includes('belkart') || b.includes('belcart')) return PAYMENT_METHODS.find((m) => m.id === 'belkart');
  return null;
}

function planSubtitle(
  uiState: string,
  billing: BillingSubscriptionResponse,
): string {
  const renewal = formatRenewalSchedule(billing, uiState);

  switch (uiState) {
    case 'pro_active':
      return renewal ?? 'Подписка Master Pro активна';
    case 'pro_canceled_at_period_end':
      return renewal ?? 'Автопродление выключено';
    case 'past_due':
      return 'Платёж не прошёл — обновите карту или повторите оплату';
    case 'expired':
      return 'Подписка Pro закончилась';
    default:
      return 'Бесплатный тариф с базовыми лимитами';
  }
}

export function SettingsBillingWorkspace() {
  const b = useSettingsBilling();
  const detail = b.billingDetail;
  const [subscriptionReceiptOpen, setSubscriptionReceiptOpen] = useState(false);

  if (!b.useCabinetApi) {
    return (
      <div className="rounded-[16px] bg-white p-6 text-[14px] text-[#6B7280]">
        Подключите backend (VITE_API_URL), чтобы видеть подписку и платежи.
      </div>
    );
  }

  if (b.apiLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-[16px] bg-white py-10">
        <LoadingVideo size="md" label="Загрузка…" />
      </div>
    );
  }

  if (b.loadError && !detail) {
    return <SettingsErrorState message={b.loadError} onRetry={b.reload} />;
  }

  const planName = b.planDisplay.title;
  const statusTone = b.planDisplay.tone;
  const statusLabel = b.planDisplay.badge;
  const canUpdateCard = detail?.availableActions.includes('update_payment_method') ?? false;
  const hasCard = Boolean(detail?.cardLast4);

  return (
    <div className={`${settingsCabinetStack} pb-8`}>
      <BillingTrialStatusCard entitlements={b.entitlements} uiState={b.uiState} />
      {b.uiState === 'past_due' ? (
        <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5">
          <p className="text-[14px] font-semibold text-[#991B1B]">Не удалось продлить подписку</p>
          <p className="mt-1 text-[13px] text-[#B91C1C]/90">
            Обновите карту или повторите платёж, чтобы сохранить доступ к Master Pro.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={b.billingBusy}
              onClick={b.onRetryPayment}
              className={`${settingsCabinetPrimaryBtn} text-[13px]`}
            >
              Повторить оплату
            </button>
            {canUpdateCard ? (
              <button
                type="button"
                disabled={b.billingBusy}
                onClick={b.onUpdateCard}
                className={`${settingsCabinetOutlineBtn} text-[13px]`}
              >
                Изменить карту
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Краткая сводка — без дублирования тарифных карточек из /admin/billing */}
      <section>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-[#111827]">Подписка</h3>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Статус и следующий платёж
            </p>
          </div>
          <Link
            to={ADMIN_BILLING_PATH}
            className={`${settingsCabinetOutlineBtn} inline-flex shrink-0 items-center gap-2 no-underline`}
          >
            Тарифы и лимиты
            <HiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <SettingsCabinetFeatureCard
          icon={<HiReceiptPercent className="h-5 w-5" aria-hidden />}
          title={planName}
          subtitle={detail ? (b.planDisplay.subtitle || planSubtitle(b.uiState, detail)) : '—'}
          badge={<SettingsCabinetStatusPill tone={statusTone}>{statusLabel}</SettingsCabinetStatusPill>}
        >
          {detail ? (
            <SubscriptionDetailsButton onClick={() => setSubscriptionReceiptOpen(true)} />
          ) : null}
        </SettingsCabinetFeatureCard>
      </section>

      {detail ? (
        <SubscriptionReceiptModal
          open={subscriptionReceiptOpen}
          onClose={() => setSubscriptionReceiptOpen(false)}
          billing={detail}
          uiState={b.uiState}
          isProEntitled={b.isProEntitled}
          planName={planName}
          statusLabel={statusLabel}
          statusTone={statusTone}
        />
      ) : null}

      {/* Способ оплаты */}
      <section>
        <SettingsCabinetSectionTitle
          title="Способ оплаты"
          description="Карта для автоматического продления Master Pro"
        />
        <div className="overflow-hidden rounded-[16px] bg-white p-4 sm:p-5">
          {hasCard && detail ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FAFAFA] ring-1 ring-[#F3F4F6]">
                  <PaymentLogoImage
                    method={cardBrandMethod(detail.cardBrand) ?? MASTERCARD}
                    logoHeightClass="h-6 w-auto max-w-[2.5rem]"
                  />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-[#111827]">
                    •••• •••• •••• {detail.cardLast4}
                  </p>
                  <p className="text-[13px] text-[#9CA3AF]">
                    {detail.cardExpMonth && detail.cardExpYear
                      ? `Действует до ${String(detail.cardExpMonth).padStart(2, '0')}/${String(detail.cardExpYear).slice(-2)}`
                      : 'Банковская карта'}
                  </p>
                </div>
              </div>
              {canUpdateCard ? (
                <button
                  type="button"
                  disabled={b.billingBusy}
                  onClick={b.onUpdateCard}
                  className={`${settingsCabinetOutlineBtn} w-full shrink-0 sm:w-auto`}
                >
                  Изменить карту
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FAFAFA] text-[#9CA3AF]">
                  <HiCreditCard className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#111827]">Карта не привязана</p>
                  <p className="text-[13px] text-[#9CA3AF]">
                    {b.isProEntitled
                      ? 'Привяжите карту для автопродления'
                      : 'Понадобится при подключении Master Pro'}
                  </p>
                </div>
              </div>
              {canUpdateCard ? (
                <button
                  type="button"
                  disabled={b.billingBusy}
                  onClick={b.onUpdateCard}
                  className={`${settingsCabinetPrimaryBtn} w-full shrink-0 sm:w-auto`}
                >
                  Привязать карту
                </button>
              ) : (
                <Link
                  to={ADMIN_BILLING_PATH}
                  className={`${settingsCabinetOutlineBtn} inline-flex w-full items-center justify-center no-underline sm:w-auto`}
                >
                  Подключить Pro
                </Link>
              )}
            </div>
          )}

          <div className="mt-5 rounded-[12px] bg-[#FAFAFA] px-4 py-4">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#9CA3AF] ring-1 ring-[#EBEBEB]">
                <HiLockClosed className="h-4 w-4" aria-hidden />
              </span>
              <p className="max-w-[22rem] text-[12px] leading-relaxed text-[#9CA3AF]">
                SLOTTY не хранит полные данные карты. Платежи обрабатываются через сертифицированного
                провайдера.
              </p>
              <PaymentLogoImage
                method={BEPAID}
                logoHeightClass={paymentLogoCompactHeightClass('bepaid')}
                className="opacity-90"
              />
            </div>
          </div>

          {b.uiState === 'pro_canceled_at_period_end' ? (
            <button
              type="button"
              disabled={b.billingBusy}
              onClick={b.onResumeAutoRenew}
              className={`${settingsCabinetPrimaryBtn} mt-4 w-full text-[13px]`}
            >
              Возобновить автопродление
            </button>
          ) : null}

          {b.uiState === 'pro_active' && detail?.cancelAtPeriodEnd === false ? (
            <button
              type="button"
              disabled={b.billingBusy}
              onClick={b.onCancelAutoRenew}
              className="mt-4 w-full text-[13px] font-medium text-[#9CA3AF] transition hover:text-[#DC2626]"
            >
              Отменить автопродление
            </button>
          ) : null}
        </div>
      </section>

      {/* Последние платежи */}
      <section>
        <SettingsCabinetSectionTitle
          title="Последние платежи"
          description="История списаний по подписке Master Pro"
        />
        {b.paymentsLoading ? (
          <div className="rounded-[16px] bg-white px-5 py-10 text-center text-[14px] text-[#9CA3AF]">
            Загрузка…
          </div>
        ) : b.payments.length === 0 ? (
          <div className="rounded-[16px] bg-white px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-[#374151]">Платежей пока нет</p>
            <p className="mt-1 text-[13px] text-[#9CA3AF]">
              Здесь появятся списания после подключения Master Pro
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[16px] bg-white divide-y divide-[#F3F4F6]">
            {b.recentPayments.map((p) => {
              const brand = cardBrandMethod(p.cardBrand);
              const paid = p.status === 'paid';
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => b.setSelectedPayment(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      b.setSelectedPayment(p);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff5f7a]/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5]">
                    {brand ? (
                      <PaymentLogoImage method={brand} logoHeightClass="h-5 w-auto max-w-[1.75rem]" />
                    ) : (
                      <HiReceiptPercent className="h-5 w-5 text-[#6B7280]" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#111827]">
                      {formatBillingMoney(p.amount, p.currency)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#6B7280]">
                      {formatBillingDateShort(p.paidAt ?? p.createdAt)} · {billingPaymentKindLabel(p.paymentKind)}
                      {p.cardLast4 ? ` · •••• ${p.cardLast4}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <SettingsCabinetStatusPill tone={paid ? 'success' : 'neutral'}>
                      {billingPaymentStatusLabel(p.status)}
                    </SettingsCabinetStatusPill>
                    <span className={`${settingsCabinetOutlineBtn} pointer-events-none px-3 py-1.5 text-[12px]`}>
                      Чек
                    </span>
                  </div>
                </div>
              );
            })}
            {b.canExpandHistory ? (
              <div className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => b.setHistoryExpanded(!b.historyExpanded)}
                  className="w-full text-[13px] font-semibold text-[#ff5f7a] hover:underline"
                >
                  {b.historyExpanded ? 'Свернуть' : `Показать все (${b.payments.length})`}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <BillingPaymentDetailSheet
        open={Boolean(b.selectedPayment)}
        payment={b.selectedPayment}
        onClose={() => b.setSelectedPayment(null)}
      />

      <AdminToast toast={b.toast} onDismiss={b.clearToast} />
    </div>
  );
}

export function SettingsBillingHelpButton() {
  return (
    <Link
      to={MASTER_SETTINGS_SUPPORT_PATH}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] bg-[#F5F5F5] px-4 text-[13px] font-semibold text-[#374151] no-underline transition hover:bg-[#EBEBEB]"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] text-[11px] font-bold text-[#6B7280]">
        ?
      </span>
      Нужна помощь?
    </Link>
  );
}
