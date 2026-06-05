import { isCompletedClientVisit } from './appointmentStatus.js';
import { preferAnalyticsDisplayName } from './clientAnalyticsIdentity.js';

/** Завершённый визит для клиентской аналитики. */
export type ClientAnalyticsVisitRow = {
  appointmentId: string;
  clientKey: string;
  clientId?: string | null;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  serviceTitle: string;
  visitDate: string;
  dbStatus: string;
  unstableClientKey?: boolean;
};

export type ClientAnalyticsProfile = {
  clientKey: string;
  clientId?: string | null;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  totalCompletedVisitsAllTime: number;
  completedVisitsInPeriod: number;
  firstCompletedVisitAt: string;
  lastCompletedVisitAt: string;
  completedVisitDatesInPeriod: string[];
  isRepeatClient: boolean;
  isNewClientByEndOfPeriod: boolean;
  hadFirstVisitInPeriod: boolean;
  hadRepeatVisitInPeriod: boolean;
  unstableClientKey: boolean;
  favoriteServiceName?: string | null;
};

export type ClientDayStat = {
  date: string;
  newClients: number;
  repeatClients: number;
};

export type ClientAnalyticsRosterItem = {
  clientKey: string;
  clientId?: string | null;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  visitsCount: number;
  completedVisitsCount: number;
  totalCompletedVisitsAllTime: number;
  upcomingVisitsCount: number;
  lastVisitAt?: string | null;
  firstVisitAt?: string | null;
  isReturning: boolean;
  favoriteServiceName?: string | null;
  /** @deprecated */
  key: string;
  /** @deprecated */
  name: string;
  /** @deprecated */
  visits: number;
  /** @deprecated */
  isRepeat: boolean;
  /** @deprecated */
  lastVisitDate: string;
};

export type ClientAnalyticsCounts = {
  /** Уникальные clientKey с завершённым визитом в периоде. */
  totalClients: number;
  /** Первый завершённый визит клиента попал в выбранный период. */
  newClients: number;
  /** Клиенты с ровно одним завершённым визитом за всё время и визитом в периоде. */
  newOnlyClients: number;
  /** Клиенты с 2+ завершёнными визитами за всё время и визитом в периоде. */
  repeatClients: number;
  returningClients: number;
  returningRate: number;
};

export type ClientAnalyticsSnapshot = ClientAnalyticsCounts & {
  profiles: ClientAnalyticsProfile[];
  roster: ClientAnalyticsRosterItem[];
  clientsPerDay: ClientDayStat[];
};

export type ClientAnalyticsDebugDayClassification = {
  date: string;
  isFirstVisitDay: boolean;
  isRepeatVisitDay: boolean;
};

export type ClientAnalyticsDebugEntry = {
  clientKey: string;
  displayName: string;
  totalCompletedVisitsAllTime: number;
  completedVisitsInPeriod: number;
  firstCompletedVisitAt: string;
  lastCompletedVisitAt: string;
  unstableClientKey: boolean;
  dailyClassification: ClientAnalyticsDebugDayClassification[];
};

export type ClientAnalyticsDebugSnapshot = {
  periodStart: string;
  periodEnd: string;
  counts: ClientAnalyticsCounts;
  clients: ClientAnalyticsDebugEntry[];
};

function isCompletedVisitRow(row: ClientAnalyticsVisitRow): boolean {
  return isCompletedClientVisit(row.dbStatus);
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function lastVisitAtInPeriod(profile: ClientAnalyticsProfile): string {
  const dates = profile.completedVisitDatesInPeriod;
  return dates.length > 0 ? dates[dates.length - 1]! : profile.lastCompletedVisitAt;
}

function buildProfiles(
  allCompleted: ClientAnalyticsVisitRow[],
  periodStart: string,
  periodEnd: string,
): Map<string, ClientAnalyticsProfile> {
  const profiles = new Map<string, ClientAnalyticsProfile>();

  for (const row of allCompleted) {
    const key = row.clientKey;
    let profile = profiles.get(key);
    if (!profile) {
      profile = {
        clientKey: key,
        clientId: row.clientId?.trim() || null,
        displayName: row.displayName,
        phone: row.phone ?? null,
        email: row.email ?? null,
        totalCompletedVisitsAllTime: 0,
        completedVisitsInPeriod: 0,
        firstCompletedVisitAt: row.visitDate,
        lastCompletedVisitAt: row.visitDate,
        completedVisitDatesInPeriod: [],
        isRepeatClient: false,
        isNewClientByEndOfPeriod: false,
        hadFirstVisitInPeriod: false,
        hadRepeatVisitInPeriod: false,
        unstableClientKey: row.unstableClientKey ?? key.startsWith('appt:'),
      };
      profiles.set(key, profile);
    }

    profile.totalCompletedVisitsAllTime += 1;
    if (row.visitDate < profile.firstCompletedVisitAt) profile.firstCompletedVisitAt = row.visitDate;
    if (row.visitDate > profile.lastCompletedVisitAt) profile.lastCompletedVisitAt = row.visitDate;

    if (isDateInRange(row.visitDate, periodStart, periodEnd)) {
      profile.completedVisitsInPeriod += 1;
      profile.completedVisitDatesInPeriod.push(row.visitDate);
    }

    profile.displayName = preferAnalyticsDisplayName(profile.displayName, row.displayName);
    if (!profile.phone && row.phone) profile.phone = row.phone;
    if (!profile.email && row.email) profile.email = row.email;
  }

  for (const profile of profiles.values()) {
    profile.isRepeatClient = profile.totalCompletedVisitsAllTime >= 2;
    profile.isNewClientByEndOfPeriod = profile.totalCompletedVisitsAllTime === 1;
    profile.hadFirstVisitInPeriod = isDateInRange(
      profile.firstCompletedVisitAt,
      periodStart,
      periodEnd,
    );
    profile.hadRepeatVisitInPeriod =
      profile.completedVisitsInPeriod > 0 &&
      profile.completedVisitDatesInPeriod.some((d) => d > profile.firstCompletedVisitAt);
    profile.completedVisitDatesInPeriod.sort();
  }

  return profiles;
}

function computeCounts(profiles: Map<string, ClientAnalyticsProfile>): ClientAnalyticsCounts {
  const inPeriod = [...profiles.values()].filter((p) => p.completedVisitsInPeriod > 0);

  let newClients = 0;
  let newOnlyClients = 0;
  let repeatClients = 0;

  for (const profile of inPeriod) {
    if (profile.hadFirstVisitInPeriod) newClients += 1;
    if (profile.isNewClientByEndOfPeriod) newOnlyClients += 1;
    if (profile.isRepeatClient) repeatClients += 1;
  }

  const totalClients = inPeriod.length;
  const returningRate =
    totalClients > 0 ? Math.round((repeatClients / totalClients) * 1000) / 1000 : 0;

  return {
    totalClients,
    newClients,
    newOnlyClients,
    repeatClients,
    returningClients: repeatClients,
    returningRate,
  };
}

export function aggregateClientsPerDayFromProfiles(
  profiles: ClientAnalyticsProfile[],
  chartStart: string,
  chartEnd: string,
): ClientDayStat[] {
  const dates: string[] = [];
  let d = new Date(`${chartStart}T12:00:00`);
  const end = new Date(`${chartEnd}T12:00:00`);
  while (d <= end) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }

  return dates.map((date) => {
    const seenFirst = new Set<string>();
    const seenRepeat = new Set<string>();

    for (const profile of profiles) {
      const visitsOnDay = profile.completedVisitDatesInPeriod.filter((d) => d === date);
      if (visitsOnDay.length === 0) continue;

      const key = profile.clientKey;
      if (profile.firstCompletedVisitAt === date) {
        seenFirst.add(key);
      }
      if (
        profile.firstCompletedVisitAt < date ||
        (profile.firstCompletedVisitAt === date && visitsOnDay.length >= 2)
      ) {
        seenRepeat.add(key);
      }
    }

    return { date, newClients: seenFirst.size, repeatClients: seenRepeat.size };
  });
}

function buildRoster(
  profiles: ClientAnalyticsProfile[],
  serviceCountsByClient: Map<string, Map<string, number>>,
): ClientAnalyticsRosterItem[] {
  return profiles
    .filter((p) => p.completedVisitsInPeriod > 0)
    .map((p) => {
      const serviceCounts = serviceCountsByClient.get(p.clientKey);
      const favoriteServiceName =
        serviceCounts && serviceCounts.size > 0
          ? [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
          : null;
      const lastVisit = lastVisitAtInPeriod(p);

      return {
        clientKey: p.clientKey,
        clientId: p.clientId,
        displayName: p.displayName,
        phone: p.phone,
        email: p.email,
        visitsCount: p.completedVisitsInPeriod,
        completedVisitsCount: p.completedVisitsInPeriod,
        totalCompletedVisitsAllTime: p.totalCompletedVisitsAllTime,
        upcomingVisitsCount: 0,
        lastVisitAt: lastVisit,
        firstVisitAt: p.firstCompletedVisitAt,
        isReturning: p.isRepeatClient,
        favoriteServiceName,
        key: p.clientKey,
        name: p.displayName,
        visits: p.completedVisitsInPeriod,
        isRepeat: p.isRepeatClient,
        lastVisitDate: lastVisit,
      };
    })
    .sort(
      (a, b) =>
        (b.lastVisitAt ?? '').localeCompare(a.lastVisitAt ?? '') ||
        b.visitsCount - a.visitsCount ||
        a.displayName.localeCompare(b.displayName),
    );
}

function collectServiceCounts(
  periodCompleted: ClientAnalyticsVisitRow[],
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const row of periodCompleted) {
    const service = row.serviceTitle.trim() || 'Услуга';
    const byService = out.get(row.clientKey) ?? new Map<string, number>();
    byService.set(service, (byService.get(service) ?? 0) + 1);
    out.set(row.clientKey, byService);
  }
  return out;
}

export function buildClientAnalyticsSnapshot(
  rows: ClientAnalyticsVisitRow[],
  periodStart: string,
  periodEnd: string,
  chartStart: string,
  chartEnd: string,
): ClientAnalyticsSnapshot {
  const allCompleted = rows.filter(isCompletedVisitRow);
  const periodCompleted = allCompleted.filter((r) =>
    isDateInRange(r.visitDate, periodStart, periodEnd),
  );

  const profiles = buildProfiles(allCompleted, periodStart, periodEnd);
  const counts = computeCounts(profiles);
  const profileList = [...profiles.values()];
  const serviceCounts = collectServiceCounts(periodCompleted);
  const roster = buildRoster(profileList, serviceCounts);
  const clientsPerDay = aggregateClientsPerDayFromProfiles(profileList, chartStart, chartEnd);

  return {
    ...counts,
    profiles: profileList,
    roster,
    clientsPerDay,
  };
}

export function buildClientAnalyticsDebugSnapshot(
  rows: ClientAnalyticsVisitRow[],
  periodStart: string,
  periodEnd: string,
  chartStart: string,
  chartEnd: string,
): ClientAnalyticsDebugSnapshot {
  const snapshot = buildClientAnalyticsSnapshot(rows, periodStart, periodEnd, chartStart, chartEnd);

  const clients: ClientAnalyticsDebugEntry[] = snapshot.profiles
    .filter((p) => p.completedVisitsInPeriod > 0)
    .map((profile) => {
      const dailyClassification: ClientAnalyticsDebugDayClassification[] = [];
      let d = new Date(`${chartStart}T12:00:00`);
      const end = new Date(`${chartEnd}T12:00:00`);
      while (d <= end) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const date = `${y}-${m}-${day}`;
        if (profile.completedVisitDatesInPeriod.includes(date)) {
          dailyClassification.push({
            date,
            isFirstVisitDay: profile.firstCompletedVisitAt === date,
            isRepeatVisitDay: profile.firstCompletedVisitAt !== date,
          });
        }
        d.setDate(d.getDate() + 1);
      }

      return {
        clientKey: profile.clientKey,
        displayName: profile.displayName,
        totalCompletedVisitsAllTime: profile.totalCompletedVisitsAllTime,
        completedVisitsInPeriod: profile.completedVisitsInPeriod,
        firstCompletedVisitAt: profile.firstCompletedVisitAt,
        lastCompletedVisitAt: profile.lastCompletedVisitAt,
        unstableClientKey: profile.unstableClientKey,
        dailyClassification,
      };
    });

  return {
    periodStart,
    periodEnd,
    counts: {
      totalClients: snapshot.totalClients,
      newClients: snapshot.newClients,
      newOnlyClients: snapshot.newOnlyClients,
      repeatClients: snapshot.repeatClients,
      returningClients: snapshot.returningClients,
      returningRate: snapshot.returningRate,
    },
    clients,
  };
}
