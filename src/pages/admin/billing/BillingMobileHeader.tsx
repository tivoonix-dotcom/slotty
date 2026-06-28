import { useState } from 'react';
import { HiCalendarDays, HiChevronDown, HiCreditCard, HiScissors } from 'react-icons/hi2';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import type { BillingPeriod, PlanId } from '../../../features/billing/model/masterPlans';
import { NotificationsKpiStatCard } from '../notifications/NotificationsKpiStatCard';
import { billingDesktopCard } from './adminBillingTheme';

type Props = {
  plan: PlanId;
  period: BillingPeriod;
  servicesLabel: string;
  appointmentsLabel: string;
  scheduleDays: number;
  isPro: boolean;
};

export function BillingMobileHeader({
  plan,
  period,
  servicesLabel,
  appointmentsLabel,
  scheduleDays,
  isPro,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const periodLabel = period === 'year' ? 'Годовая оплата' : 'Ежемесячная оплата';
  const description = isPro
    ? 'Полный доступ к кабинету: безлимит услуг и записей, расширенная сводка.'
    : null;

  return (
    <section className={`${billingDesktopCard} p-4 lg:hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 text-left transition hover:opacity-90 active:scale-[0.995]"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827]">Мой тариф</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#111827]">
            {planBadgeLabel(plan)}
            <span className="font-medium text-[#6B7280]"> · {periodLabel}</span>
          </p>
          {!expanded ? (
            <p className="mt-1.5 text-[14px] font-medium leading-snug text-[#6B7280]">
              Нажмите, чтобы посмотреть лимиты тарифа
            </p>
          ) : null}
        </div>
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#6B7280] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <HiChevronDown className="h-5 w-5" />
        </span>
      </button>

      {expanded ? (
        <>
          <div className="mt-3 flex items-start justify-between gap-3 border-t border-[#F3F4F6] pt-4">
            {description ? (
              <p className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-[#6B7280]">{description}</p>
            ) : (
              <span className="flex-1" />
            )}
            <span className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
              {planBadgeLabel(plan)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <NotificationsKpiStatCard
              label="Услуги"
              value={servicesLabel}
              hint={isPro ? 'Без ограничений' : 'На тарифе Free'}
              accentValue={!isPro}
              icon={<HiScissors className="h-5 w-5" aria-hidden />}
              compact
            />
            <NotificationsKpiStatCard
              label="Записи"
              value={appointmentsLabel}
              hint="В текущем месяце"
              icon={<HiCalendarDays className="h-5 w-5" aria-hidden />}
              accentValue={!isPro}
              compact
            />
            <NotificationsKpiStatCard
              label="График"
              value={`${scheduleDays} дн.`}
              hint="Горизонт расписания"
              icon={<HiCreditCard className="h-5 w-5" aria-hidden />}
              compact
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
