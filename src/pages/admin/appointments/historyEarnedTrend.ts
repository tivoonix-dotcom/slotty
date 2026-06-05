import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';

export type HistoryEarnedTrend = 'up' | 'down' | 'flat';

function monthKeyFromIsoDate(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

function earnedInMonth(rows: DemoMasterAppointment[], monthKey: number): number {
  return rows
    .filter((row) => row.status === 'completed' && monthKeyFromIsoDate(row.date) === monthKey)
    .reduce((sum, row) => sum + (Number.isFinite(row.priceByn) ? row.priceByn : 0), 0);
}

/** Сравнивает заработок за текущий и прошлый календарный месяц. */
export function computeHistoryEarnedTrend(
  rows: DemoMasterAppointment[],
): HistoryEarnedTrend | null {
  const now = new Date();
  const currentKey = now.getFullYear() * 12 + now.getMonth();
  const previousKey = currentKey - 1;

  const currentEarned = earnedInMonth(rows, currentKey);
  const previousEarned = earnedInMonth(rows, previousKey);

  if (currentEarned === 0 && previousEarned === 0) return null;
  if (currentEarned > previousEarned) return 'up';
  if (currentEarned < previousEarned) return 'down';
  return 'flat';
}

export function historyEarnedTrendPercent(
  rows: DemoMasterAppointment[],
): number | null {
  const now = new Date();
  const currentKey = now.getFullYear() * 12 + now.getMonth();
  const previousKey = currentKey - 1;

  const currentEarned = earnedInMonth(rows, currentKey);
  const previousEarned = earnedInMonth(rows, previousKey);

  if (previousEarned <= 0) {
    return currentEarned > 0 ? 100 : null;
  }

  return Math.round(((currentEarned - previousEarned) / previousEarned) * 100);
}
