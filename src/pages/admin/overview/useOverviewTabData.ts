import { useEffect, useMemo, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  fetchOverviewClients,
  fetchOverviewRevenue,
  fetchOverviewReputation,
  fetchOverviewSummary,
  type OverviewSummaryApiDto,
} from '../../../features/admin/api/masterOverviewApi';
import {
  computeClientAnalytics,
  computeRevenueAnalytics,
  overviewPeriodRange,
  overviewSummaryMetrics,
  type ClientAnalytics,
  type OverviewPeriodPreset,
  type RevenueAnalytics,
} from './overviewAnalytics';
import {
  computeReputationFromReviews,
  type ReputationAnalyticsPayload,
} from './overviewReputationDemo';

type SummaryMetrics = {
  totalRevenue: number;
  totalVisits: number;
  nearest: DemoMasterAppointment | null;
  hasAny: boolean;
};

export function useOverviewTabData({
  activeTab: _activeTab,
  periodPreset,
  appointments,
  useCabinetApi,
}: {
  activeTab: import('./overviewAnalytics').OverviewAnalyticsTab;
  periodPreset: OverviewPeriodPreset;
  appointments: DemoMasterAppointment[];
  useCabinetApi: boolean;
}) {
  const reportRange = useMemo(
    () => overviewPeriodRange(periodPreset, appointments),
    [appointments, periodPreset],
  );

  const localSummary = useMemo(
    () => overviewSummaryMetrics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const localRevenue = useMemo(
    () => computeRevenueAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const localClients = useMemo(
    () => computeClientAnalytics(appointments, reportRange.start, reportRange.end),
    [appointments, reportRange.end, reportRange.start],
  );
  const localReputation = useMemo(
    () => computeReputationFromReviews(reportRange.start, reportRange.end),
    [reportRange.end, reportRange.start],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiSummary, setApiSummary] = useState<OverviewSummaryApiDto | null>(null);
  const [apiRevenue, setApiRevenue] = useState<RevenueAnalytics | null>(null);
  const [apiClients, setApiClients] = useState<ClientAnalytics | null>(null);
  const [apiReputation, setApiReputation] = useState<ReputationAnalyticsPayload | null>(null);
  const [reputationTick, setReputationTick] = useState(0);

  useEffect(() => {
    if (!useCabinetApi) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [summary, revenue, clients, reputation] = await Promise.all([
          fetchOverviewSummary(periodPreset),
          fetchOverviewRevenue(periodPreset),
          fetchOverviewClients(periodPreset),
          fetchOverviewReputation(periodPreset),
        ]);
        if (cancelled) return;
        setApiSummary(summary);
        setApiRevenue(revenue);
        setApiClients(clients);
        setApiReputation(reputation);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodPreset, useCabinetApi, reputationTick]);

  const refreshReputation = () => setReputationTick((n) => n + 1);

  const summary: SummaryMetrics = useCabinetApi && apiSummary
    ? {
        totalRevenue: apiSummary.totalRevenue,
        totalVisits: apiSummary.totalVisits,
        nearest: apiSummary.nearest,
        hasAny: apiSummary.hasAny,
      }
    : localSummary;

  const dayStats = useCabinetApi && apiSummary ? apiSummary.dayStats : localRevenue.dayStats;

  const revenue = useCabinetApi && apiRevenue ? apiRevenue : localRevenue;
  const clients = useCabinetApi && apiClients ? apiClients : localClients;
  const reputation = useCabinetApi && apiReputation ? apiReputation : localReputation;

  return {
    loading: useCabinetApi ? loading : false,
    error: useCabinetApi ? error : null,
    reportRange,
    summary,
    dayStats,
    revenue,
    clients,
    reputation,
    refreshReputation,
    useCabinetApi,
  };
}
