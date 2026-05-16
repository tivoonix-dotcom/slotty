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

  const serviceCount = draft.services?.length ?? 0;

  const panel = useMemo(() => {
    if (isLoading) return null;

    switch (activeTab) {
      case 'revenue':
        return <OverviewRevenuePanel data={revenue} periodPreset={periodPreset} />;

      case 'clients':
        return <OverviewClientsPanel data={clients} />;

      case 'reputation':
        return (
          <OverviewReputationPanel
            periodStart={reportRange.start}
            periodEnd={reportRange.end}
          />
        );

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
    reportRange.end,
    reportRange.start,
    periodPreset,
    revenue,
    serviceCount,
    summary,
  ]);

  return (
    <>
      <section
        className={`mx-auto w-full min-w-0 max-w-full overflow-x-hidden ${ADMIN_CABINET_SHELL_MAX} space-y-4`}
        style={{ paddingBottom: `calc(${OVERVIEW_TAB_BAR_HEIGHT} + 1.25rem)` }}
      >
        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />

        <div
          key={`${activeTab}-${periodPreset}`}
          className="min-w-0 animate-[overviewPanelIn_0.22s_ease-out]"
        >
          {panel}
        </div>
      </section>

      <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}
