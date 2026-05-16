import { useMemo, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  ADMIN_CABINET_SHELL_MAX,
  OVERVIEW_TAB_BAR_HEIGHT,
} from './adminOverviewTheme';
import { OverviewAnalyticsTabBar } from './OverviewAnalyticsTabBar';
import { OverviewPeriodFilter } from './OverviewPeriodFilter';
import {
  computeClientAnalytics,
  computeReputationAnalytics,
  computeRevenueAnalytics,
  overviewPeriodRange,
  overviewSummaryMetrics,
  type OverviewAnalyticsTab,
  type OverviewPeriodPreset,
} from './overviewAnalytics';
import {
  OverviewClientsPanel,
  OverviewReputationPanel,
  OverviewRevenuePanel,
  OverviewSummaryPanel,
} from './OverviewTabPanels';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
};

const isLoading = false;

const PERIOD_LABEL: Record<OverviewPeriodPreset, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  all: 'Всё время',
};

export function AdminOverviewTab({
  draft,
  appointments,
  appointmentsPath,
  onOpenAppointment,
}: Props) {
  const [activeTab, setActiveTab] = useState<OverviewAnalyticsTab>('summary');
  const [periodPreset, setPeriodPreset] = useState<OverviewPeriodPreset>('month');

  const reportRange = useMemo(
    () => overviewPeriodRange(periodPreset, appointments),
    [appointments, periodPreset],
  );

  const summary = useMemo(
    () => overviewSummaryMetrics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const revenue = useMemo(
    () => computeRevenueAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const clients = useMemo(
    () => computeClientAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );

  const reputation = useMemo(() => computeReputationAnalytics(), []);

  const serviceCount = draft.services?.length ?? 0;

  const panel = useMemo(() => {
    if (isLoading) return null;

    switch (activeTab) {
      case 'revenue':
        return <OverviewRevenuePanel data={revenue} />;

      case 'clients':
        return <OverviewClientsPanel data={clients} />;

      case 'reputation':
        return <OverviewReputationPanel data={reputation} />;

      default:
        return (
          <OverviewSummaryPanel
            metrics={summary}
            serviceCount={serviceCount}
            appointmentsPath={appointmentsPath}
            dayStats={revenue.dayStats}
            onOpenNearest={() => {
              if (summary.nearest) onOpenAppointment(summary.nearest);
            }}
          />
        );
    }
  }, [
    activeTab,
    appointmentsPath,
    clients,
    onOpenAppointment,
    reputation,
    revenue,
    serviceCount,
    summary,
  ]);

  return (
    <>
      <section
        className={`mx-auto w-full ${ADMIN_CABINET_SHELL_MAX} space-y-4`}
        style={{ paddingBottom: `calc(${OVERVIEW_TAB_BAR_HEIGHT} + 1.25rem)` }}
      >
        <div className="flex items-start justify-between gap-3 px-0.5 pt-1">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F47C8C]">
              Кабинет мастера
            </p>
            <h1 className="mt-1 text-[30px] font-bold tracking-[-0.06em] text-[#111827]">
              Сводка
            </h1>
          </div>

          <div className="rounded-full border border-[#FDE8ED] bg-white px-4 py-2 text-right shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
            <p className="text-[11px] font-medium text-[#9CA3AF]">Период</p>
            <p className="text-[13px] font-bold text-[#111827]">{PERIOD_LABEL[periodPreset]}</p>
          </div>
        </div>

        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />

        <div
          key={`${activeTab}-${periodPreset}`}
          className="animate-[overviewPanelIn_0.22s_ease-out]"
        >
          {panel}
        </div>
      </section>

      <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}