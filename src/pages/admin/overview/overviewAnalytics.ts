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
import {
  buildClientAnalyticsSnapshot,
  emptyClientAnalytics,
  type ClientAnalyticsRosterItem,
  type ClientDayStat,
} from './clientAnalyticsCore';
import {
  buildClientAnalyticsKey,
  resolveClientAnalyticsDisplayName,
  resolveClientEmail,
  resolveClientPhone,
} from './clientAnalyticsIdentity';

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

/** Вкладки, для которых нужна подписка Pro (доход и KPI-сводка). */
export function isOverviewProTab(tab: OverviewAnalyticsTab): boolean {
  return tab === 'summary' || tab === 'revenue';
}

export const OVERVIEW_PERIOD_LABELS: Record<OverviewPeriodPreset, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  all: 'Всё время',
};

export function overviewPeriodLabel(preset: OverviewPeriodPreset): string {
  return OVERVIEW_PERIOD_LABELS[preset];
}

export function overviewPeriodRange(
  preset: OverviewPeriodPreset,
  appointments: DemoMasterAppointment[],
): { start: string; end: string } {
  const end = isoDateLocal(new Date());
  if (preset === 'today') return { start: end, end };
  if (preset === 'week') return { start: isoDateLocal(addDays(new Date(), -6)), end };
  if (preset === 'month') {
    const now = new Date();
    return { start: isoDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)), end };
  }
  return overviewAppointmentBounds(appointments);
}

function toClientAnalyticsVisitRow(row: DemoMasterAppointment) {
  const phoneFromContact =
    row.contact?.trim() && /^\+?\d/.test(row.contact.trim()) ? row.contact.trim() : null;
  const identityInput = {
    appointmentId: row.id,
    clientId: row.clientId,
    nameSnapshot: row.clientName,
    phoneSnapshot: phoneFromContact,
    emailSnapshot: row.clientEmail,
  };

  const clientKey = buildClientAnalyticsKey(identityInput);

  return {
    appointmentId: row.id,
    clientKey,
    clientId: row.clientId?.trim() || null,
    displayName: resolveClientAnalyticsDisplayName(identityInput),
    phone: resolveClientPhone(identityInput),
    email: resolveClientEmail(identityInput),
    serviceTitle: row.serviceTitle,
    visitDate: row.date,
    dbStatus: row.status === 'completed' ? 'completed' : row.status,
    unstableClientKey: clientKey.startsWith('appt:'),
  };
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

/** Ключ «все услуги» в фильтре графика дохода. */
export const REVENUE_SOURCE_ALL_KEY = '__all__';

export type RevenueServiceSource = {
  key: string;
  label: string;
  revenue: number;
};

function revenueServiceSourceKey(serviceTitle: string | undefined): string {
  return (serviceTitle?.trim() || 'Без услуги').toLowerCase();
}

/** Доход по услугам за период (только завершённые записи). */
export function computeRevenueServiceSources(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): RevenueServiceSource[] {
  const byKey = new Map<string, RevenueServiceSource>();

  for (const row of appointments) {
    if (row.status !== 'completed' || row.date < start || row.date > end) continue;
    const label = row.serviceTitle?.trim() || 'Без услуги';
    const key = revenueServiceSourceKey(row.serviceTitle);
    const amount = Number.isFinite(row.priceByn) ? row.priceByn : 0;
    const prev = byKey.get(key);
    if (prev) {
      prev.revenue += amount;
    } else {
      byKey.set(key, { key, label, revenue: amount });
    }
  }

  return [...byKey.values()].sort((a, b) => b.revenue - a.revenue);
}

export function filterAppointmentsByRevenueSource(
  appointments: DemoMasterAppointment[],
  sourceKey: string,
): DemoMasterAppointment[] {
  if (sourceKey === REVENUE_SOURCE_ALL_KEY) return appointments;
  return appointments.filter((r) => revenueServiceSourceKey(r.serviceTitle) === sourceKey);
}

/** Те же даты, что у базового графика, но доход только по выбранной услуге. */
export function revenueChartDayStatsForSource(
  appointments: DemoMasterAppointment[],
  baseDayStats: OverviewDayStat[],
  sourceKey: string,
): OverviewDayStat[] {
  if (sourceKey === REVENUE_SOURCE_ALL_KEY || !baseDayStats.length) {
    return baseDayStats;
  }
  const chartStart = baseDayStats[0]!.date;
  const chartEnd = baseDayStats[baseDayStats.length - 1]!.date;
  const filtered = filterAppointmentsByRevenueSource(appointments, sourceKey);
  return aggregateOverviewByDay(filtered, chartStart, chartEnd);
}

export type { ClientDayStat } from './clientAnalyticsCore';
export type OverviewClientRosterItem = ClientAnalyticsRosterItem;

export type ClientCounts = {
  newClients: number;
  newOnlyClients: number;
  repeatClients: number;
  returningClients: number;
  totalClients: number;
  returningRate: number;
};

export type ClientAnalytics = ClientCounts & {
  roster: OverviewClientRosterItem[];
  visitsPerDay: OverviewDayStat[];
  clientsPerDay: ClientDayStat[];
  chartIsTruncated: boolean;
  hasData: boolean;
  newClientsDelta: number;
  repeatClientsDelta: number;
  totalClientsDelta: number;
};

export { emptyClientAnalytics };

function clientSnapshotFromAppointments(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
) {
  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const rows = appointments.map(toClientAnalyticsVisitRow);
  return buildClientAnalyticsSnapshot(rows, start, end, chartRange.chartStart, chartRange.chartEnd);
}

export function computeClientAnalytics(
  appointments: DemoMasterAppointment[],
  start: string,
  end: string,
): ClientAnalytics {
  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const snapshot = clientSnapshotFromAppointments(appointments, start, end);
  const prev = previousOverviewReportPeriod(start, end);
  const prevSnapshot = prev
    ? clientSnapshotFromAppointments(appointments, prev.start, prev.end)
    : {
        newClients: 0,
        newOnlyClients: 0,
        repeatClients: 0,
        returningClients: 0,
        totalClients: 0,
        returningRate: 0,
      };

  const visitsPerDay = aggregateOverviewByDay(appointments, chartRange.chartStart, chartRange.chartEnd);

  return {
    newClients: snapshot.newClients,
    newOnlyClients: snapshot.newOnlyClients,
    repeatClients: snapshot.repeatClients,
    returningClients: snapshot.returningClients,
    totalClients: snapshot.totalClients,
    returningRate: snapshot.returningRate,
    roster: snapshot.roster,
    newClientsDelta: snapshot.newClients - prevSnapshot.newClients,
    repeatClientsDelta: snapshot.repeatClients - prevSnapshot.repeatClients,
    totalClientsDelta: snapshot.totalClients - prevSnapshot.totalClients,
    visitsPerDay,
    clientsPerDay: snapshot.clientsPerDay,
    chartIsTruncated: chartRange.chartStart > start,
    hasData:
      snapshot.totalClients > 0 ||
      snapshot.clientsPerDay.some((d) => d.newClients > 0 || d.repeatClients > 0),
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
