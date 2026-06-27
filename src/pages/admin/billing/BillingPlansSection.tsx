import type { ReactNode } from 'react';
import type { BillingPackageMonths } from '../../../features/billing/billingCopy';
import { BILLING_COPY, billingPackageLabel } from '../../../features/billing/billingCopy';
import type { PlanId } from '../../../features/billing/model/masterPlans';
import {
  LANDING_MASTER_FREE_FEATURES,
  LANDING_MASTER_PRO_FEATURES,
  LANDING_PRO_DESCRIPTION,
  LandingPricingCard,
  LandingProTariffCard,
  landingPlanCtaClass,
  landingProCtaClass,
} from '../../../features/billing/ui/landingTariffCards';
import { PaymentLogoImage } from '../../../shared/ui/PaymentLogos/PaymentLogoImage';
import { PAYMENT_METHODS } from '../../../shared/ui/PaymentLogos/paymentLogosConfig';
import { BillingPeriodSwitch } from './BillingPeriodSwitch';
import { BillingUsagePanel } from './BillingUsagePanel';
import { billingDesktopCard } from './adminBillingTheme';

const BEPAID_METHOD = PAYMENT_METHODS.find((m) => m.id === 'bepaid')!;

export type BillingPlansSectionProps = {
  plan: PlanId;
  packageMonths: BillingPackageMonths;
  onPackageChange: (months: BillingPackageMonths) => void;
  servicesLen: number;
  maxSvc: number;
  monthlyCount: number;
  maxAppt: number;
  scheduleHorizonDays: number;
  freePriceValue: string;
  freePriceUnit: string;
  proPriceValue: string;
  proPriceUnit: string;
  freeActive: boolean;
  proActive: boolean;
  /** Подсветка «Текущий тариф» только для выбранного пакета при активном Pro */
  proCardIsCurrent?: boolean;
  /** Показывать CTA оплаты на карточке Pro (false когда Pro уже активен) */
  showProCheckoutCta?: boolean;
  proCtaLabel?: string;
  useLiveBilling: boolean;
  showPaymentLogos?: boolean;
  proPaymentPendingBanner?: ReactNode;
  liveBillingNote?: ReactNode;
  demoNote?: ReactNode;
  onSelectFree: () => void;
  onSelectPro: () => void;
};

export function BillingPlansSection({
  plan,
  packageMonths,
  onPackageChange,
  servicesLen,
  maxSvc,
  monthlyCount,
  maxAppt,
  scheduleHorizonDays,
  freePriceValue,
  freePriceUnit,
  proPriceValue,
  proPriceUnit,
  freeActive,
  proActive,
  proCardIsCurrent = false,
  showProCheckoutCta = true,
  proCtaLabel = 'Подключить Pro',
  useLiveBilling,
  showPaymentLogos = false,
  proPaymentPendingBanner,
  liveBillingNote,
  demoNote,
  onSelectFree,
  onSelectPro,
}: BillingPlansSectionProps) {
  const isFree = plan === 'free';
  const showBePaidOnCta = showPaymentLogos && useLiveBilling && showProCheckoutCta && !proActive;

  return (
    <section className={`${billingDesktopCard} w-full min-w-0 p-4 sm:p-5 lg:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
            Выберите тариф
          </h2>
          <p className="mt-1 max-w-xl text-[14px] font-medium leading-snug text-[#6B7280]">
            Сравните Free и Pro — период оплаты в карточке Pro, использование — в Free.
          </p>
        </div>
      </div>

      {liveBillingNote ? <div className="mt-4">{liveBillingNote}</div> : null}

      {proPaymentPendingBanner || demoNote ? (
        <div className="mt-4 space-y-3">
          {proPaymentPendingBanner}
          {demoNote}
        </div>
      ) : null}

      <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
        <LandingPricingCard
          className="order-2 h-full lg:order-1"
          name="Free"
          priceValue={freePriceValue}
          priceUnit={freePriceUnit}
          features={LANDING_MASTER_FREE_FEATURES}
          badge={freeActive ? 'Активен' : undefined}
          highlighted={freeActive}
          footer={
            <div className="flex w-full flex-col">
              {isFree && !proActive ? (
                <div className="border-t border-[#F3F4F6] pt-5">
                  <BillingUsagePanel
                    plan="free"
                    servicesLen={servicesLen}
                    maxSvc={maxSvc}
                    monthlyCount={monthlyCount}
                    maxAppt={maxAppt}
                    scheduleHorizonDays={scheduleHorizonDays}
                    variant="compact"
                  />
                </div>
              ) : null}
              <button
                type="button"
                disabled={freeActive}
                onClick={onSelectFree}
                className={`${landingPlanCtaClass(freeActive, freeActive)} ${isFree && !proActive ? 'mt-5' : ''}`}
              >
                {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
              </button>
            </div>
          }
        />

        <div className="order-1 flex h-full min-w-0 flex-col lg:order-2">
          <LandingProTariffCard
            className="h-full"
            priceValue={proPriceValue}
            priceUnit={proPriceUnit}
            features={LANDING_MASTER_PRO_FEATURES}
            description={LANDING_PRO_DESCRIPTION}
            topBadge={proActive ? 'Активен' : 'Популярный'}
            denseCta
            slotAfterTitle={
              useLiveBilling || !proActive ? (
                <BillingPeriodSwitch
                  packageMonths={packageMonths}
                  onPackage={onPackageChange}
                  variant="proCard"
                />
              ) : undefined
            }
            footer={
              <button
                type="button"
                disabled={proActive && proCardIsCurrent}
                onClick={onSelectPro}
                className={`${landingProCtaClass(proActive && proCardIsCurrent)} gap-2.5`}
              >
                {proActive && proCardIsCurrent ? (
                  BILLING_COPY.currentPlan
                ) : proActive && !proCardIsCurrent ? (
                  `${BILLING_COPY.extendFor} ${billingPackageLabel(packageMonths)}`
                ) : showProCheckoutCta ? (
                  <>
                    <span>{proCtaLabel}</span>
                    {showBePaidOnCta ? (
                      <PaymentLogoImage
                        method={BEPAID_METHOD}
                        logoHeightClass="h-5 w-auto max-w-[5.5rem] object-contain sm:h-6 sm:max-w-[6rem]"
                        className="shrink-0"
                      />
                    ) : null}
                  </>
                ) : (
                  'Подключить Pro'
                )}
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}
