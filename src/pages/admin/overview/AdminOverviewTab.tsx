import { useEffect, useMemo, useState } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { postOverviewReviewReply } from '../../../features/admin/api/masterOverviewApi';
import { OVERVIEW_TAB_BAR_HEIGHT, overviewShellCard } from './adminOverviewTheme';
import { OverviewAnalyticsTabBar } from './OverviewAnalyticsTabBar';
import { OverviewPeriodFilter } from './OverviewPeriodFilter';
import { OVERVIEW_TAB_INTRO_IMAGES, OverviewTabIntro } from './OverviewTabIntro';
import type { OverviewAnalyticsTab, OverviewPeriodPreset } from './overviewAnalytics';
import {
  OverviewClientsPanel,
  OverviewReputationPanel,
  OverviewRevenuePanel,
  OverviewSummaryPanel,
} from './OverviewTabPanels';
import { useOverviewTabData } from './useOverviewTabData';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { LoadingPanel } from '../../../shared/ui/LoadingVideo';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
  useCabinetApi: boolean;
};

function OverviewPanelContent({
  loading,
  error,
  activeTab,
  draft,
  summary,
  serviceCount,
  appointmentsPath,
  dayStats,
  revenue,
  clients,
  reputation,
  periodPreset,
  useCabinetApi,
  onOpenNearest,
  refreshReputation,
}: {
  loading: boolean;
  error: string | null;
  activeTab: OverviewAnalyticsTab;
  draft: MasterDraft;
  summary: ReturnType<typeof useOverviewTabData>['summary'];
  serviceCount: number;
  appointmentsPath: string;
  dayStats: ReturnType<typeof useOverviewTabData>['dayStats'];
  revenue: ReturnType<typeof useOverviewTabData>['revenue'];
  clients: ReturnType<typeof useOverviewTabData>['clients'];
  reputation: ReturnType<typeof useOverviewTabData>['reputation'];
  periodPreset: OverviewPeriodPreset;
  useCabinetApi: boolean;
  onOpenNearest: () => void;
  refreshReputation: () => void;
}) {
  if (loading) {
    return (
      <LoadingPanel
        className="border-[#F3F4F6] lg:border-0 lg:shadow-none"
        minHeight="min-h-[min(56vh,28rem)]"
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[#FEE2E2] bg-[#FEF2F2] p-5">
        <p className="text-[14px] font-semibold text-[#B91C1C]">{error}</p>
      </div>
    );
  }

  switch (activeTab) {
    case 'revenue':
      return <OverviewRevenuePanel data={revenue} periodPreset={periodPreset} />;
    case 'clients':
      return <OverviewClientsPanel data={clients} />;
    case 'reputation':
      return (
        <OverviewReputationPanel
          data={reputation}
          useApi={useCabinetApi}
          onReplied={refreshReputation}
          onReply={async (reviewId, text) => {
            await postOverviewReviewReply(reviewId, text);
            refreshReputation();
          }}
        />
      );
    default:
      return (
        <OverviewSummaryPanel
          draft={draft}
          metrics={summary}
          serviceCount={serviceCount}
          appointmentsPath={appointmentsPath}
          dayStats={dayStats}
          onOpenNearest={onOpenNearest}
        />
      );
  }
}

export function AdminOverviewTab({
  draft,
  appointments,
  appointmentsPath,
  onOpenAppointment,
  useCabinetApi,
}: Props) {
  const [activeTab, setActiveTab] = useState<OverviewAnalyticsTab>('summary');
  const [periodPreset, setPeriodPreset] = useState<OverviewPeriodPreset>('month');

  useEffect(() => {
    preloadTabIntroImages(OVERVIEW_TAB_INTRO_IMAGES);
  }, []);

  const {
    loading,
    error,
    summary,
    dayStats,
    revenue,
    clients,
    reputation,
    refreshReputation,
  } = useOverviewTabData({
    activeTab,
    periodPreset,
    appointments,
    useCabinetApi,
  });

  const serviceCount = draft.services?.length ?? 0;

  const panel = useMemo(
    () => (
      <OverviewPanelContent
        loading={loading}
        error={error}
        activeTab={activeTab}
        draft={draft}
        summary={summary}
        serviceCount={serviceCount}
        appointmentsPath={appointmentsPath}
        dayStats={dayStats}
        revenue={revenue}
        clients={clients}
        reputation={reputation}
        periodPreset={periodPreset}
        useCabinetApi={useCabinetApi}
        onOpenNearest={() => {
          if (summary.nearest) onOpenAppointment(summary.nearest);
        }}
        refreshReputation={refreshReputation}
      />
    ),
    [
      activeTab,
      appointmentsPath,
      clients,
      dayStats,
      draft,
      error,
      loading,
      onOpenAppointment,
      periodPreset,
      refreshReputation,
      revenue,
      reputation,
      serviceCount,
      summary,
      useCabinetApi,
    ],
  );

  const transitionKey = `${activeTab}-${periodPreset}-${useCabinetApi ? 'api' : 'local'}`;

  return (
    <>
      {/* Mobile: как раньше — фильтр сверху, интро, контент, таббар снизу */}
      <section
        className="w-full min-w-0 space-y-4 overflow-x-hidden lg:hidden"
        style={{ paddingBottom: `calc(${OVERVIEW_TAB_BAR_HEIGHT} + 1.25rem)` }}
      >
        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />
        {!error ? <OverviewTabIntro tab={activeTab} /> : null}
        <AdminTabContentTransition activeKey={transitionKey} className="min-w-0 space-y-4">
          {panel}
        </AdminTabContentTransition>
      </section>
      <div className="lg:hidden">
        <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Desktop: табы внутри белой карточки */}
      <div className={`${overviewShellCard} w-full min-w-0`}>
        <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
        <div className="space-y-5 px-6 py-6">
          <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />
          {activeTab !== 'summary' && !error ? <OverviewTabIntro tab={activeTab} /> : null}
          <AdminTabContentTransition activeKey={transitionKey} className="min-w-0">
            {panel}
          </AdminTabContentTransition>
        </div>
      </div>
    </>
  );
}
