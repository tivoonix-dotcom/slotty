import { useEffect, useMemo, useRef, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  fetchOverviewBundle,
  type OverviewSummaryApiDto,
} from '../../../features/admin/api/masterOverviewApi';
import {
  readOverviewBundleCache,
  writeOverviewBundleCache,
} from './adminOverviewSessionCache';
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

  const initialBundle = useCabinetApi ? readOverviewBundleCache(periodPreset) : null;

  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiSummary, setApiSummary] = useState<OverviewSummaryApiDto | null>(
    () => initialBundle?.summary ?? null,
  );
  const [apiRevenue, setApiRevenue] = useState<RevenueAnalytics | null>(
    () => initialBundle?.revenue ?? null,
  );
  const [apiClients, setApiClients] = useState<ClientAnalytics | null>(
    () => initialBundle?.clients ?? null,
  );
  const [apiReputation, setApiReputation] = useState<ReputationAnalyticsPayload | null>(
    () => initialBundle?.reputation ?? null,
  );
  const [reputationTick, setReputationTick] = useState(0);
  const hasApiDataRef = useRef(false);
  hasApiDataRef.current = apiSummary !== null;

  useEffect(() => {
    if (!useCabinetApi) {
      setFetching(false);
      setError(null);
      setApiSummary(null);
      setApiRevenue(null);
      setApiClients(null);
      setApiReputation(null);
      hasApiDataRef.current = false;
      return;
    }

    let cancelled = false;
    if (!hasApiDataRef.current) {
      setFetching(true);
    }
    setError(null);

    void (async () => {
      try {
        const bundle = await fetchOverviewBundle(periodPreset);
        if (cancelled) return;
        writeOverviewBundleCache(periodPreset, bundle);
        setApiSummary(bundle.summary);
        setApiRevenue(bundle.revenue);
        setApiClients(bundle.clients);
        setApiReputation(bundle.reputation);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodPreset, useCabinetApi, reputationTick]);

  const refreshReputation = () => setReputationTick((n) => n + 1);

  const summary: SummaryMetrics =
    useCabinetApi && apiSummary
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

  const loading = useCabinetApi && fetching && apiSummary === null;

  return {
    loading,
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
