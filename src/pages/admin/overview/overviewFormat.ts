import { addDays } from '../../../features/booking/lib/calendar';
import { isoDateLocal, type DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';

/** «1 250 BYN» */
export function formatBynRu(value: number): string {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return `${n.toLocaleString('ru-RU')} BYN`;
}

/** ДД.ММ.ГГГГ */
export function formatDdMmYyyy(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** «26 мая» для карточки отзыва */
export function formatReviewDayMonthRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** ДД.ММ для оси графика */
export function formatDdMm(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/**
 * «Сегодня, 14:30» / «Завтра, 12:00» / «14.05.2026, 14:30»
 */
export function formatAppointmentWhenRu(iso: string, time: string): string {
  const today = isoDateLocal(new Date());
  const tomorrow = isoDateLocal(addDays(new Date(), 1));
  if (iso === today) return `Сегодня, ${time}`;
  if (iso === tomorrow) return `Завтра, ${time}`;
  return `${formatDdMmYyyy(iso)}, ${time}`;
}

/** Последние 30 дней включительно (сегодня — конец). */
export function defaultOverviewLast30Days(): { start: string; end: string } {
  const end = new Date();
  const start = addDays(end, -29);
  return { start: isoDateLocal(start), end: isoDateLocal(end) };
}

/** Границы дат по всем записям; если записей нет — как последние 30 дней. */
export function overviewAppointmentBounds(rows: DemoMasterAppointment[]): { start: string; end: string } {
  if (!rows.length) return defaultOverviewLast30Days();
  const min = rows.reduce((m, r) => (r.date < m ? r.date : m), rows[0]!.date);
  const maxDate = rows.reduce((m, r) => (r.date > m ? r.date : m), rows[0]!.date);
  const today = isoDateLocal(new Date());
  const end = maxDate >= today ? maxDate : today;
  const start = min <= end ? min : today;
  return { start, end };
}

/** Число календарных дней от start до end включительно. */
export function countOverviewDaysInclusive(startIso: string, endIso: string): number {
  if (!startIso || !endIso || startIso > endIso) return 0;
  let n = 0;
  let d = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  while (d <= end) {
    n += 1;
    d = addDays(d, 1);
  }
  return n;
}

/**
 * Окно для графика: не больше `maxDays` последних дней отчёта,
 * если период длиннее (как listIsoDatesInclusive с лимитом, но с конца периода).
 */
export function overviewChartWindow(
  reportStart: string,
  reportEnd: string,
  maxDays: number,
): { chartStart: string; chartEnd: string } {
  const n = countOverviewDaysInclusive(reportStart, reportEnd);
  if (n <= maxDays) return { chartStart: reportStart, chartEnd: reportEnd };
  return {
    chartStart: isoDateLocal(addDays(new Date(`${reportEnd}T12:00:00`), -(maxDays - 1))),
    chartEnd: reportEnd,
  };
}

/** Предыдущий отрезок той же длины (по календарным дням), сразу перед `startIso`. */
export function previousOverviewReportPeriod(
  startIso: string,
  endIso: string,
): { start: string; end: string } | null {
  const days = countOverviewDaysInclusive(startIso, endIso);
  if (!days) return null;
  const start = new Date(`${startIso}T12:00:00`);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: isoDateLocal(prevStart), end: isoDateLocal(prevEnd) };
}
