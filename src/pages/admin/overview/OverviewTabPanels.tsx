import { Link } from 'react-router-dom';
import {
  HiBell,
  HiCalendar,
  HiChatBubbleLeftEllipsis,
  HiClock,
  HiSparkles,
  HiStar,
} from 'react-icons/hi2';
import type { OverviewDayStat } from '../../../features/master/model/demoMasterAppointments';
import { isoDateLocal } from '../../../features/master/model/demoMasterAppointments';
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
  OverviewScheduleFillCard,
  OverviewSectionCard,
  OverviewWelcomeBanner,
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

export function OverviewSummaryPanel({
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
    <div className="min-w-0 space-y-4 overflow-x-hidden lg:space-y-6">
      {!hasAny ? (
        <div className="lg:hidden">
          <OverviewHeroEmpty />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6">
        <OverviewWelcomeBanner displayName={displayName} />
        <OverviewIncomeSummaryCard
          totalRevenue={formatBynRu(totalRevenue)}
          totalVisits={totalVisits}
          serviceCount={serviceCount}
          avgCheck={avgCheck > 0 ? formatBynRu(avgCheck) : '0 BYN'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
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
    </div>
  );
}

export { OverviewRevenuePanel } from './OverviewRevenuePanel';

export { OverviewClientsPanel } from './OverviewClientsPanel';

export { OverviewReputationPanel } from './OverviewReputationPanel';
