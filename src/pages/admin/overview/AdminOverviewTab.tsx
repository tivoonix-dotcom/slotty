import { useEffect, useMemo, useState } from 'react';
import { preloadTabIntroImages } from '../useTabIntroImage';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { postOverviewReviewReply } from '../../../features/admin/api/masterOverviewApi';
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
import { overviewShellCard } from './adminOverviewTheme';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
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
      return (
        <LoadingPanel
          className="border-0 shadow-none"
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
  ]);

  const showTabIntro = !error && activeTab !== 'summary';

  return (
    <div className="w-full min-w-0 pb-6 lg:pb-0">
      <div className={`${overviewShellCard} overflow-hidden`}>
        <OverviewAnalyticsTabBar active={activeTab} onChange={setActiveTab} />

        <div className="space-y-4 px-4 py-4 lg:space-y-5 lg:px-6 lg:py-6">
          <OverviewPeriodFilter value={periodPreset} onChange={setPeriodPreset} />

          {showTabIntro ? <OverviewTabIntro tab={activeTab} /> : null}

          <AdminTabContentTransition
            activeKey={`${activeTab}-${periodPreset}-${useCabinetApi ? 'api' : 'local'}`}
            className="min-w-0"
          >
            {panel}
          </AdminTabContentTransition>
        </div>
      </div>
    </div>
  );
}
