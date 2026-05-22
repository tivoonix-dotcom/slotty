import { Link } from 'react-router-dom';
import {
  HiBanknotes,
  HiBell,
  HiCalendar,
  HiChatBubbleLeftEllipsis,
  HiClock,
  HiSparkles,
  HiStar,
  HiUsers,
  HiWallet,
} from 'react-icons/hi2';
import {
  appointmentStatusLabel,
  isoDateLocal,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  overviewCard,
  overviewCardPad,
  overviewIconCircle,
  overviewPinkBtn,
} from './adminOverviewTheme';
import { formatAppointmentWhenRu, formatBynRu } from './overviewFormat';
import {
  OverviewHeroEmpty,
  OverviewIncomeSummaryCard,
  OverviewLatestActivity,
  OverviewLineChart,
  OverviewCompactMetricCard,
  OverviewScheduleFillCard,
  OverviewSectionCard,
  OverviewWelcomeBanner,
  OverviewWideMetricCard,
} from './OverviewSharedUi';

function jsToScheduleWeekday(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

function scheduleFillPercentToday(draft: MasterDraft, dayStats: OverviewDayStat[]): number {
  const workDays = new Set(draft.schedule?.workDays ?? []);
  const weekday = jsToScheduleWeekday(new Date());
  if (!workDays.has(weekday)) return 0;
  const today = isoDateLocal(new Date());
  const stat = dayStats.find((s) => s.date === today);
  const visits = stat?.activeVisits ?? 0;
  if (visits <= 0) return 0;
  return Math.min(100, Math.round((visits / 8) * 100));
}

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
  draft: MasterDraft;
  onOpenNearest: () => void;
};

/** Mobile: прежняя сводка (широкая карточка дохода + 3 KPI + ближайшая запись + график). */
function OverviewSummaryPanelMobile({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  onOpenNearest,
}: Omit<SummaryProps, 'draft'>) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const hasAny = metrics.hasAny || totalRevenue > 0 || totalVisits > 0;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden lg:hidden">
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
                  <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[12px] font-bold text-[#6B7280]">
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
                className="flex min-h-12 items-center justify-center rounded-[18px] bg-[#F3F4F6] text-[14px] font-bold text-[#111827] transition hover:bg-[#EAECEF] active:scale-[0.98]"
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

/** Desktop: dashboard-сетка (приветствие, доход, расписание, активность). */
function OverviewSummaryPanelDesktop({
  metrics,
  serviceCount,
  appointmentsPath,
  dayStats,
  draft,
  onOpenNearest,
}: SummaryProps) {
  const { totalRevenue, totalVisits, nearest } = metrics;
  const hasAny = metrics.hasAny || totalRevenue > 0 || totalVisits > 0;
  const avgCheck = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;
  const fillPercent = scheduleFillPercentToday(draft, dayStats);
  const displayName = draft.name?.trim() || 'Мастер';

  const activityItems = [
    {
      icon: <HiCalendar className="h-[18px] w-[18px]" aria-hidden />,
      text: totalVisits > 0 ? `${totalVisits} записей за период` : 'Записей пока нет',
    },
    {
      icon: <HiChatBubbleLeftEllipsis className="h-[18px] w-[18px]" aria-hidden />,
      text: 'Новых сообщений нет',
    },
    {
      icon: <HiStar className="h-[18px] w-[18px]" aria-hidden />,
      text: 'Новых отзывов нет',
    },
    {
      icon: <HiSparkles className="h-[18px] w-[18px]" aria-hidden />,
      text: 'Обновлений пока нет',
    },
  ];

  return (
    <div className="hidden min-w-0 space-y-6 overflow-x-hidden lg:block">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <OverviewWelcomeBanner displayName={displayName} />
        <OverviewIncomeSummaryCard
          totalRevenue={formatBynRu(totalRevenue)}
          totalVisits={totalVisits}
          serviceCount={serviceCount}
          avgCheck={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className={`${overviewCard} ${overviewCardPad}`}>
          {nearest ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className={overviewIconCircle}>
                  <HiClock className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#ff5f7a]">Ближайшая запись</p>
                  <p className="mt-1 text-[17px] font-bold text-[#111827]">
                    {formatAppointmentWhenRu(nearest.date, nearest.time)}
                  </p>
                  <p className="mt-1 text-[14px] text-[#6B7280]">{nearest.clientName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenNearest}
                  className={`flex min-h-11 items-center justify-center text-[14px] font-semibold ${overviewPinkBtn}`}
                >
                  Открыть
                </button>
                <Link
                  to={appointmentsPath}
                  className="flex min-h-11 items-center justify-center rounded-[14px] bg-[#f6f7fb] text-[14px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6]"
                >
                  Все записи
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={overviewIconCircle}>
                <HiBell className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#111827]">Ближайших записей нет</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">Новые записи появятся здесь.</p>
              </div>
            </div>
          )}
        </section>

        <OverviewScheduleFillCard percent={fillPercent} />

        <div className={`${overviewCard} ${overviewCardPad} flex flex-col justify-center`}>
          <p className="text-[13px] font-semibold text-[#6B7280]">Активных услуг</p>
          <p className="mt-1 text-[22px] font-bold text-[#111827]">{serviceCount}</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">в каталоге</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <OverviewSectionCard
          title="Динамика записей"
          action={
            <span className="rounded-[10px] bg-[#f6f7fb] px-2.5 py-1 text-[12px] font-semibold text-[#6B7280]">
              Неделя
            </span>
          }
        >
          <OverviewLineChart stats={dayStats} mode="visits" emptyHint="Записей за период нет" />
        </OverviewSectionCard>

        <OverviewLatestActivity items={activityItems} />
      </div>

      {!hasAny ? (
        <div className="sr-only" aria-hidden>
          <OverviewHeroEmpty />
        </div>
      ) : null}
    </div>
  );
}

export function OverviewSummaryPanel(props: SummaryProps) {
  return (
    <>
      <OverviewSummaryPanelMobile {...props} />
      <OverviewSummaryPanelDesktop {...props} />
    </>
  );
}

export { OverviewRevenuePanel } from './OverviewRevenuePanel';

export { OverviewClientsPanel } from './OverviewClientsPanel';

export { OverviewReputationPanel } from './OverviewReputationPanel';
