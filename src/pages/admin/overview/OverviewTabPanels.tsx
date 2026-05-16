import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiClock,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { appointmentStatusLabel } from '../../../features/master/model/demoMasterAppointments';
import {
  overviewCard,
  overviewCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import { formatAppointmentWhenRu, formatBynRu } from './overviewFormat';
import {
  OverviewHeroEmpty,
  OverviewLineChart,
  OverviewCompactMetricCard,
  OverviewSectionCard,
  OverviewWideMetricCard,
} from './OverviewSharedUi';

type SummaryProps = {
  metrics: {
    totalRevenue: number;
    totalVisits: number;
    nearest: import('../../../features/master/model/demoMasterAppointments').DemoMasterAppointment | null;
    hasAny: boolean;
  };
  serviceCount: number;
  appointmentsPath: string;
  dayStats: OverviewDayStat[];
  onOpenNearest: () => void;
};

export function OverviewSummaryPanel({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  onOpenNearest,
}: SummaryProps) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const hasAny = metrics.hasAny || totalRevenue > 0 || totalVisits > 0;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      {!hasAny ? <OverviewHeroEmpty /> : null}

      <OverviewWideMetricCard
        icon={<HiWallet className="h-7 w-7" aria-hidden />}
        label="Доход за период"
        value={formatBynRu(totalRevenue)}
        sub={hasAny ? 'Общая сумма активных и завершённых записей' : 'Пока данных за период нет'}
      />

      <div className="grid min-w-0 grid-cols-3 gap-2">
        <OverviewCompactMetricCard
          icon={<HiCalendar className="h-[18px] w-[18px]" aria-hidden />}
          label="Записей"
          value={String(totalVisits)}
          sub="за период"
        />

        <OverviewCompactMetricCard
          icon={<HiUsers className="h-[18px] w-[18px]" aria-hidden />}
          label="Услуг"
          value={String(serviceCount)}
          sub="в каталоге"
        />

        <OverviewCompactMetricCard
          icon={<HiBanknotes className="h-[18px] w-[18px]" aria-hidden />}
          label="Ср. чек"
          value={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
        />
      </div>

      <section className={`${overviewCard} ${overviewCardPad}`}>
        {nearest ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
                <HiClock className="h-6 w-6" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#F47C8C]">Ближайшая запись</p>
                <p className="mt-1 text-[21px] font-bold tracking-[-0.05em] text-[#111827]">
                  {formatAppointmentWhenRu(nearest.date, nearest.time)}
                </p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">{nearest.clientName}</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">{nearest.serviceTitle}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C]">
                    {formatBynRu(nearest.priceByn)}
                  </span>

                  <span className="rounded-full bg-[#F7F7F8] px-3 py-1 text-[12px] font-bold text-[#6B7280]">
                    {appointmentStatusLabel(nearest.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenNearest}
                className={`flex min-h-12 items-center justify-center text-[14px] font-bold ${overviewPinkBtn}`}
              >
                Открыть
              </button>

              <Link
                to={appointmentsPath}
                className="flex min-h-12 items-center justify-center rounded-[18px] bg-[#F7F7F8] text-[14px] font-bold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.98]"
              >
                Все записи
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`${overviewIconCircle} h-12 w-12 rounded-[18px]`}>
              <HiBell className="h-6 w-6" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold tracking-[-0.04em] text-[#111827]">
                Ближайших записей нет
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">
                Новые записи появятся здесь.
              </p>
            </div>
          </div>
        )}
      </section>

      <OverviewSectionCard
        title="Динамика записей"
        subtitle="Как менялось количество записей за выбранный период"
        icon={<HiCalendar className="h-5 w-5" aria-hidden />}
      >
        <OverviewLineChart stats={dayStats} mode="visits" emptyHint="Записей за период нет" />
      </OverviewSectionCard>
    </div>
  );
}

export { OverviewRevenuePanel } from './OverviewRevenuePanel';

export { OverviewClientsPanel } from './OverviewClientsPanel';

export { OverviewReputationPanel } from './OverviewReputationPanel';

