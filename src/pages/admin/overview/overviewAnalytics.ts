import { addDays } from '../../../features/booking/lib/calendar';
import {
  aggregateOverviewByDay,
  countActiveVisitsBetween,
  isoDateLocal,
  listIsoDatesInclusive,
  OVERVIEW_MAX_RANGE_DAYS,
  pickNearestUpcomingAppointment,
  sumCompletedRevenueBetween,
  type DemoMasterAppointment,
  type OverviewDayStat,
} from '../../../features/master/model/demoMasterAppointments';
import { previousOverviewReportPeriod } from './overviewFormat';

function overviewAppointmentBounds(appointments: DemoMasterAppointment[]): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  const active = appointments.filter((r) => r.status !== 'cancelled');
  if (!active.length) {
    return { start: isoDateLocal(addDays(new Date(), -(OVERVIEW_MAX_RANGE_DAYS - 1))), end };
  }
  const dates = active.map((r) => r.date).sort();
  return { start: dates[0]!, end: dates[dates.length - 1]! > end ? end : dates[dates.length - 1]! };
}

function overviewChartWindow(
  start: string,
  end: string,
  maxDays: number,
): { chartStart: string; chartEnd: string } {
  const days = listIsoDatesInclusive(start, end);
  if (days.length <= maxDays) return { chartStart: start, chartEnd: end };
  return { chartStart: days[days.length - maxDays]!, chartEnd: end };
}

export type OverviewPeriodPreset = 'today' | 'week' | 'month' | 'all';
export type OverviewAnalyticsTab = 'summary' | 'revenue' | 'clients' | 'reputation';

export function overviewPeriodRange(
  preset: OverviewPeriodPreset,
  appointments: DemoMasterAppointment[],
): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  if (preset === 'today') return { start: end, end };
  if (preset === 'week') return { start: isoDateLocal(addDays(new Date(), -6)), end };
  if (preset === 'month') return { start: isoDateLocal(addDays(new Date(), -29)), end };
  return overviewAppointmentBounds(appointments);
}

function normalizeClient(name: string): string {
  return name.trim().toLowerCase();
}

/** Завершённые и подтверждённые визиты для клиентской аналитики. */
function isClientVisitRow(r: DemoMasterAppointment): boolean {
  return r.status === 'completed' || r.status === 'confirmed';
}

function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export type RevenueAnalytics = {
  totalRevenue: number;
  completedCount: number;
  avgCheck: number;
  paidAmount: number;
  paidCount: number;
  unpaidAmount: number;
  unpaidCount: number;
  dayStats: OverviewDayStat[];
  chartIsTruncated: boolean;
  hasRevenue: boolean;
  revenueTrendPercent: number | null;
  avgCheckTrendPercent: number | null;
  paidSharePercent: number;
  unpaidSharePercent: number;
};

export function computeRevenueAnalytics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): RevenueAnalytics {
  const inRange = appointments.filter((r) => r.date >= start && r.date <= end);
  const completed = inRange.filter((r) => r.status === 'completed');
  const unpaidRows = inRange.filter((r) => r.status === 'pending' || r.status === 'confirmed');

  const totalRevenue = sumCompletedRevenueBetween(appointments, start, end);
  const completedCount = completed.length;
  const avgCheck = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  const unpaidAmount = unpaidRows.reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
  const paidAmount = totalRevenue;

  const prev = previousOverviewReportPeriod(start, end);
  const prevRevenue = prev ? sumCompletedRevenueBetween(appointments, prev.start, prev.end) : 0;
  const revenueTrendPercent = percentDelta(totalRevenue, prevRevenue);

  let avgCheckTrendPercent: number | null = null;
  if (prev) {
    const prevCompleted = appointments.filter(
      (r) => r.status === 'completed' && r.date >= prev.start && r.date <= prev.end,
    );
    const prevAvg =
      prevCompleted.length > 0
        ? Math.round(prevRevenue / prevCompleted.length)
        : 0;
    avgCheckTrendPercent = percentDelta(avgCheck, prevAvg);
  }

  const moneyTotal = paidAmount + unpaidAmount;
  const paidSharePercent =
    moneyTotal > 0 ? Math.round((paidAmount / moneyTotal) * 100) : paidAmount > 0 ? 100 : 0;
  const unpaidSharePercent = moneyTotal > 0 ? 100 - paidSharePercent : 0;

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const dayStats = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);

  return {
    totalRevenue,
    completedCount,
    avgCheck,
    paidAmount,
    paidCount: completedCount,
    unpaidAmount,
    unpaidCount: unpaidRows.length,
    dayStats,
    chartIsTruncated: chartRange.chartStart > start,
    hasRevenue: totalRevenue > 0 || unpaidAmount > 0,
    revenueTrendPercent,
    avgCheckTrendPercent,
    paidSharePercent,
    unpaidSharePercent,
  };
}

export type ClientDayStat = {
  date: string;
  newClients: number;
  repeatClients: number;
};

function aggregateClientsPerDay(
  appointments: DemoMasterAppointment[],
  chartStart: string,
  chartEnd: string,
): ClientDayStat[] {
  const visits = appointments.filter(isClientVisitRow);
  const firstCompletedByClient = new Map<string, string>();

  for (const row of visits) {
    const key = normalizeClient(row.clientName);
    const cur = firstCompletedByClient.get(key);
    if (!cur || row.date < cur) firstCompletedByClient.set(key, row.date);
  }

  return listIsoDatesInclusive(chartStart, chartEnd).map((date) => {
    const dayRows = visits.filter((r) => r.date === date);
    const seen = new Set<string>();
    let newClients = 0;
    let repeatClients = 0;

    for (const row of dayRows) {
      const key = normalizeClient(row.clientName);
      if (seen.has(key)) continue;
      seen.add(key);
      if (firstCompletedByClient.get(key) === date) newClients += 1;
      else repeatClients += 1;
    }

    return { date, newClients, repeatClients };
  });
}

export type ClientAnalytics = {
  newClients: number;
  repeatClients: number;
  totalClients: number;
  visitsPerDay: OverviewDayStat[];
  clientsPerDay: ClientDayStat[];
  chartIsTruncated: boolean;
  hasData: boolean;
};

export function computeClientAnalytics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): ClientAnalytics {
  const completedInRange = appointments.filter(
    (r) => isClientVisitRow(r) && r.date >= start && r.date <= end,
  );
  const hadBefore = new Set(
    appointments
      .filter((r) => isClientVisitRow(r) && r.date < start)
      .map((r) => normalizeClient(r.clientName)),
  );

  const byClient = new Map<string, boolean>();
  for (const row of completedInRange) {
    const key = normalizeClient(row.clientName);
    if (!byClient.has(key)) byClient.set(key, hadBefore.has(key));
  }

  let repeatClients = 0;
  let newClients = 0;
  for (const isRepeat of byClient.values()) {
    if (isRepeat) repeatClients += 1;
    else newClients += 1;
  }

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const visitsPerDay = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);
  const clientsPerDay = aggregateClientsPerDay(
    appointments,
    chartRange.chartStart,
    chartRange.chartEnd,
  );

  return {
    newClients,
    repeatClients,
    totalClients: byClient.size,
    visitsPerDay,
    clientsPerDay,
    chartIsTruncated: chartRange.chartStart > start,
    hasData:
      byClient.size > 0 ||
      clientsPerDay.some((d) => d.newClients > 0 || d.repeatClients > 0),
  };
}

export type {
  MasterOverviewReview,
  RatingDayStat,
  ReputationAnalyticsPayload as ReputationAnalytics,
} from './overviewReputationDemo';
export { computeReputationFromReviews as computeReputationAnalytics } from './overviewReputationDemo';

export function overviewSummaryMetrics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
) {
  return {
    totalRevenue: sumCompletedRevenueBetween(appointments, start, end),
    totalVisits: countActiveVisitsBetween(appointments, start, end),
    nearest: pickNearestUpcomingAppointment(appointments),
    hasAny: appointments.some((r) => r.date >= start && r.date <= end),
  };
}
