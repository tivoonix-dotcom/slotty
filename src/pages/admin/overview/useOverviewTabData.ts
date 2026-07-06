import { useEffect, useMemo, useRef, useState } from 'react';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import {
  fetchOverviewBundle,
  fetchOverviewFreeBundle,
  fetchOverviewReputation,
  type OverviewSummaryApiDto,
} from '../../../features/admin/api/masterOverviewApi';
import {
  readOverviewBundleCache,
  writeOverviewBundleCache,
} from './adminOverviewSessionCache';
import {
  computeClientAnalytics,
  computeRevenueAnalytics,
  emptyClientAnalytics,
  overviewPeriodRange,
  overviewSummaryMetrics,
  type ClientAnalytics,
  type OverviewAnalyticsTab,
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
  proAnalyticsLocked = false,
  overviewReady = true,
}: {
  activeTab: OverviewAnalyticsTab;
  periodPreset: OverviewPeriodPreset;
  appointments: DemoMasterAppointment[];
  useCabinetApi: boolean;
  /** Free-тариф: Pro-only — сводка и доход; клиенты и репутация грузятся отдельно. */
  proAnalyticsLocked?: boolean;
  /** false, пока не известен тариф (ждём subscription из кабинета). */
  overviewReady?: boolean;
}) {
  const initialBundle = useCabinetApi && !proAnalyticsLocked ? readOverviewBundleCache(periodPreset) : null;

  const localRange = useMemo(
    () => overviewPeriodRange(periodPreset, appointments),
    [appointments, periodPreset],
  );

  const localSummary = useMemo(
    () => overviewSummaryMetrics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localRevenue = useMemo(
    () => computeRevenueAnalytics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localClients = useMemo(
    () => computeClientAnalytics(appointments, localRange.start, localRange.end),
    [appointments, localRange.end, localRange.start],
  );
  const localReputation = useMemo(
    () => computeReputationFromReviews(localRange.start, localRange.end),
    [localRange.end, localRange.start],
  );

  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiPeriodRange, setApiPeriodRange] = useState<{ start: string; end: string } | null>(
    () =>
      initialBundle
        ? { start: initialBundle.periodStart, end: initialBundle.periodEnd }
        : null,
  );
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
  const [refreshTick, setRefreshTick] = useState(0);
  const hasApiDataRef = useRef(false);
  hasApiDataRef.current = proAnalyticsLocked
    ? apiClients !== null && apiReputation !== null
    : apiSummary !== null;

  /** Загрузка аналитики: bundle (Pro), free-bundle (Free), точечное обновление репутации. */
  useEffect(() => {
    if (!useCabinetApi) {
      setFetching(false);
      setError(null);
      setApiSummary(null);
      setApiRevenue(null);
      setApiClients(null);
      setApiReputation(null);
      setApiPeriodRange(null);
      hasApiDataRef.current = false;
      return;
    }
    if (!overviewReady) return;

    let cancelled = false;
    if (!hasApiDataRef.current) {
      setFetching(true);
    }
    setError(null);

    void (async () => {
      try {
        if (proAnalyticsLocked) {
          if (reputationTick > 0 && refreshTick === 0) {
            const reputation = await fetchOverviewReputation(periodPreset);
            if (cancelled) return;
            setApiReputation(reputation);
            setApiPeriodRange({ start: reputation.periodStart, end: reputation.periodEnd });
            return;
          }

          setApiSummary(null);
          setApiRevenue(null);
          const freeBundle = await fetchOverviewFreeBundle(periodPreset);
          if (cancelled) return;
          setApiClients(freeBundle.clients);
          setApiReputation(freeBundle.reputation);
          setApiPeriodRange({ start: freeBundle.periodStart, end: freeBundle.periodEnd });
        } else {
          const bundle = await fetchOverviewBundle(periodPreset);
          if (cancelled) return;
          writeOverviewBundleCache(periodPreset, bundle);
          setApiSummary(bundle.summary);
          setApiRevenue(bundle.revenue);
          setApiClients(bundle.clients);
          setApiReputation(bundle.reputation);
          setApiPeriodRange({ start: bundle.periodStart, end: bundle.periodEnd });
        }
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
  }, [periodPreset, proAnalyticsLocked, refreshTick, reputationTick, useCabinetApi, overviewReady]);

  const refreshReputation = () => setReputationTick((n) => n + 1);
  const refreshOverview = () => setRefreshTick((n) => n + 1);

  const reportRange = useCabinetApi && apiPeriodRange ? apiPeriodRange : localRange;

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
  const clients =
    useCabinetApi && apiClients
      ? apiClients
      : useCabinetApi
        ? emptyClientAnalytics()
        : localClients;
  const reputation = useCabinetApi && apiReputation ? apiReputation : localReputation;

  const loading =
    useCabinetApi &&
    fetching &&
    (proAnalyticsLocked ? apiClients === null || apiReputation === null : apiSummary === null);

  return {
    loading,
    tabRefreshing: false,
    error: useCabinetApi ? error : null,
    reportRange,
    summary,
    dayStats,
    revenue,
    clients,
    reputation,
    refreshReputation,
    refreshOverview,
    useCabinetApi,
  };
}
