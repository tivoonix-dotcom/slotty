import { useMemo, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { BECOME_MASTER_PATH, SERVICES_PATH } from '../app/paths';
import type { BillingPeriod } from '../features/billing/model/masterPlans';
import { priceForPlan } from '../features/billing/model/masterPlans';
import {
  LANDING_MASTER_FREE_FEATURES,
  LANDING_MASTER_PRO_FEATURES,
  LandingPricingCard,
  LandingProTariffCard,
  landingPlanCtaClass,
} from '../features/billing/ui/landingTariffCards';
import { PaymentPartnersStrip } from '../shared/ui/PaymentLogos';
import { homeSection } from './home/homeTheme';

type PlanCardConfig = {
  id: string;
  name: string;
  price: (period: BillingPeriod) => { value: string; unit: string };
  includesLabel: string;
  features: readonly string[];
  cta: string;
  to: string;
  highlighted?: boolean;
  badge?: string;
};

const PLANS: PlanCardConfig[] = [
  {
    id: 'client',
    name: 'Клиент',
    price: () => ({ value: '0 BYN', unit: '' }),
    includesLabel: 'Включено:',
    features: [
      'Ваш регион в каталоге SLOTTY',
      'Поиск услуг и мастеров',
      'Онлайн-запись без звонков',
      'Профили и портфолио',
      'Напоминания в Telegram',
    ],
    cta: 'Найти мастера',
    to: SERVICES_PATH,
  },
  {
    id: 'master-pro',
    name: 'Мастер Pro',
    price: (period) => {
      const n = priceForPlan('pro', period);
      return {
        value: `${n} BYN`,
        unit: period === 'year' ? '/ год' : '/ месяц',
      };
    },
    includesLabel: 'Всё из «Мастер», и ещё:',
    features: LANDING_MASTER_PRO_FEATURES,
    cta: 'Открыть Мастер Pro',
    to: BECOME_MASTER_PATH,
    highlighted: true,
    badge: 'Популярный',
  },
  {
    id: 'master',
    name: 'Мастер',
    price: () => ({ value: '0 BYN', unit: '/ месяц' }),
    includesLabel: 'Включено:',
    features: LANDING_MASTER_FREE_FEATURES,
    cta: 'Стать мастером',
    to: BECOME_MASTER_PATH,
  },
];

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-[14px] font-medium text-[#6B7280]">
      <span>Оплата раз в год</span>
      <span className="text-[13px] text-[#9CA3AF]">(экономия ~20%)</span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        onClick={() => onChange(!annual)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          annual ? 'bg-[#111827]' : 'bg-[#E5E7EB]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            annual ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}

export const HomeTariffs: FC = () => {
  const [annual, setAnnual] = useState(false);
  const period: BillingPeriod = annual ? 'year' : 'month';

  const plans = useMemo(() => PLANS, []);

  return (
    <section id="tarify" className={homeSection} style={{ animationDelay: '60ms' }}>
      <div className="mx-auto max-w-[44rem] text-center">
        <h2 className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]">
          Тарифы
        </h2>

        <div className="mt-6 flex justify-center">
          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>
      </div>

      <div className="relative mt-10 w-full sm:mt-12">
        <div
          className="pointer-events-none absolute left-1/2 top-8 -z-10 h-[22rem] w-[min(100%,24rem)] -translate-x-1/2 rounded-full bg-[#FFD4A8]/45 blur-[80px] sm:w-[28rem]"
          aria-hidden
        />

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-4 lg:gap-5">
          {plans.map((plan) => {
            const wrapClass = plan.highlighted ? 'md:-mt-1 md:mb-1' : undefined;
            const { value, unit } = plan.price(period);

            if (plan.id === 'master-pro') {
              return (
                <div key={plan.id} className={wrapClass}>
                  <LandingProTariffCard
                    priceValue={value}
                    priceUnit={unit}
                    topBadge={plan.badge}
                    footer={
                      <Link to={plan.to} className={landingPlanCtaClass(true)}>
                        {plan.cta}
                      </Link>
                    }
                  />
                </div>
              );
            }

            return (
              <div key={plan.id} className={wrapClass}>
                <LandingPricingCard
                  name={plan.name}
                  priceValue={value}
                  priceUnit={unit}
                  includesLabel={plan.includesLabel}
                  features={plan.features}
                  badge={plan.badge}
                  highlighted={plan.highlighted}
                  footer={
                    <Link
                      to={plan.to}
                      className={landingPlanCtaClass(plan.highlighted === true)}
                    >
                      {plan.cta}
                    </Link>
                  }
                />
              </div>
            );
          })}
        </div>

        <PaymentPartnersStrip className="mt-10 sm:mt-12" />
      </div>
    </section>
  );
};
