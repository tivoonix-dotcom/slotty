import type { ReactNode } from 'react';
import type { BillingPeriod, PlanId } from '../../../features/billing/model/masterPlans';
import {
  LANDING_MASTER_FREE_FEATURES,
  LANDING_MASTER_PRO_FEATURES,
  LANDING_PRO_DESCRIPTION,
  LandingPricingCard,
  LandingProTariffCard,
  landingPlanCtaClass,
  landingProCtaClass,
} from '../../../features/billing/ui/landingTariffCards';
import { PaymentPartnersStrip } from '../../../shared/ui/PaymentLogos';
import { BillingPeriodSwitch } from './BillingPeriodSwitch';
import { BillingUsagePanel } from './BillingUsagePanel';
import { billingDesktopCard } from './adminBillingTheme';

export type BillingPlansSectionProps = {
  plan: PlanId;
  billingPeriod: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
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
  billingPeriod,
  onPeriodChange,
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
  useLiveBilling,
  showPaymentLogos = false,
  proPaymentPendingBanner,
  liveBillingNote,
  demoNote,
  onSelectFree,
  onSelectPro,
}: BillingPlansSectionProps) {
  const isFree = plan === 'free';

  return (
    <section className={`${billingDesktopCard} w-full min-w-0 p-4 sm:p-5 lg:p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[20px]">
            Выберите тариф
          </h2>
          <p className="mt-1 max-w-xl text-[14px] font-medium leading-snug text-[#6B7280]">
            Сначала выберите период и тариф Pro, затем сравните с Free.
          </p>
        </div>
      </div>

      {liveBillingNote ? <div className="mt-4">{liveBillingNote}</div> : null}

      <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 lg:items-start">
        <LandingPricingCard
          className="order-2 lg:order-1"
          name="Free"
          priceValue={freePriceValue}
          priceUnit={freePriceUnit}
          features={LANDING_MASTER_FREE_FEATURES}
          badge={freeActive ? 'Активен' : undefined}
          highlighted={freeActive}
          footer={
            <button
              type="button"
              disabled={freeActive}
              onClick={onSelectFree}
              className={landingPlanCtaClass(freeActive, freeActive)}
            >
              {freeActive ? 'Текущий тариф' : 'Перейти на Free'}
            </button>
          }
        />

        <div className="order-1 flex min-w-0 flex-col gap-3 lg:order-2">
          {proPaymentPendingBanner || demoNote ? (
            <div className="space-y-3">
              {proPaymentPendingBanner}
              {demoNote}
            </div>
          ) : null}

          {!proActive ? (
            <div className="w-full min-w-0 rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5">
              <BillingPeriodSwitch period={billingPeriod} onPeriod={onPeriodChange} />
            </div>
          ) : null}

          <LandingProTariffCard
            priceValue={proPriceValue}
            priceUnit={proPriceUnit}
            features={LANDING_MASTER_PRO_FEATURES}
            description={LANDING_PRO_DESCRIPTION}
            topBadge={proActive ? 'Активен' : 'Популярный'}
            denseCta
            footer={
              <button
                type="button"
                disabled={proActive}
                onClick={onSelectPro}
                className={landingProCtaClass(proActive)}
              >
                {proActive ? 'Текущий тариф' : 'Оплатить картой'}
              </button>
            }
          />

          {showPaymentLogos && useLiveBilling && !proActive ? (
            <PaymentPartnersStrip />
          ) : null}

          {isFree && !proActive ? (
            <div className="w-full min-w-0 rounded-[20px] bg-white p-4 ring-1 ring-[#EEEEEE] sm:p-5">
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
        </div>
      </div>
    </section>
  );
}
