import { useEffect, useMemo, useState } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { postOverviewReviewReply } from '../../../features/admin/api/masterOverviewApi';
import { OVERVIEW_TAB_BAR_HEIGHT } from './adminOverviewTheme';
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
import { LoadingPanel } from '../../../shared/ui/LoadingVideo';

type Props = {
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  appointmentsPath: string;
  onOpenAppointment: (a: DemoMasterAppointment) => void;
  useCabinetApi: boolean;
};

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

  const panel = useMemo(() => {
    if (loading) {
      return <LoadingPanel label="Загрузка…" className="border-[#F3F4F6]" />;
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
            metrics={summary}
            serviceCount={serviceCount}
            appointmentsPath={appointmentsPath}
            dayStats={dayStats}
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
    dayStats,
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
  ]);

  return (
    <>
      <section
        className="w-full min-w-0 space-y-4 overflow-x-hidden"
        style={{ paddingBottom: `calc(${OVERVIEW_TAB_BAR_HEIGHT} + 1.25rem)` }}
      >
        <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />

        {!error ? <OverviewTabIntro tab={activeTab} /> : null}

        <div
          key={`${activeTab}-${periodPreset}-${useCabinetApi ? 'api' : 'local'}`}
          className="min-w-0 space-y-4 animate-[overviewPanelIn_0.22s_ease-out]"
        >
          {panel}
        </div>
      </section>

      <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />
    </>
  );
}
