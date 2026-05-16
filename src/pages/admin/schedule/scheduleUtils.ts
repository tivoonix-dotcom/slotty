import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { PlannedSlot, PlannedSlotRejectReason, RepeatKind } from './scheduleTypes';

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function addMinutesToTime(startHm: string, minutes: number): string {
  const total = timeToMinutes(startHm) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(Math.min(23, h))}:${pad2(m)}`;
}

export function durationMinutesBetween(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

export function formatDurationRu(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function localDateTimeToUtcIso(dateIso: string, timeHm: string): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
}

export function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeekMonday(d: Date): Date {
  const day = startOfLocalDay(d);
  const wd = (day.getDay() + 6) % 7;
  return addDays(day, -wd);
}

/** Пн=0 … Вс=6 */
export function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function isLocalDateIsoBeforeToday(dateIso: string): boolean {
  return startOfLocalDay(parseIsoDate(dateIso)).getTime() < startOfLocalDay(new Date()).getTime();
}

export function formatHmFromDate(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatSlotDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
}

export function formatWeekdayShort(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d).replace('.', '');
}

export function formatPreviewLine(dateIso: string, startTime: string, endTime: string): string {
  const d = parseIsoDate(dateIso);
  const wd = formatWeekdayShort(d);
  const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
  return `${wd}, ${datePart} · ${startTime}–${endTime}`;
}

export function formatGroupHeader(d: Date, todayStart: Date): string {
  const ds = startOfLocalDay(d).getTime();
  const ts = todayStart.getTime();
  const dateStr = formatSlotDate(d);
  return ds === ts ? `Сегодня, ${dateStr}` : dateStr;
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const a = new Intl.DateTimeFormat('ru-RU', opts).format(weekStart);
  const b = new Intl.DateTimeFormat('ru-RU', { ...opts, year: 'numeric' }).format(weekEnd);
  return `${a} – ${b}`;
}

export function startOfMonth(d: Date): Date {
  const x = startOfLocalDay(d);
  x.setDate(1);
  return x;
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function formatMonthYearLabel(monthStart: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthStart);
}

export function isTodayIso(dateIso: string): boolean {
  return startOfLocalDay(parseIsoDate(dateIso)).getTime() === startOfLocalDay(new Date()).getTime();
}

export type MonthDayCell = {
  dateIso: string;
  inCurrentMonth: boolean;
};

/** Сетка 6×7: понедельник — первый столбец. */
export function buildMonthGrid(monthAnchor: Date): MonthDayCell[] {
  const monthStart = startOfMonth(monthAnchor);
  const gridStart = startOfWeekMonday(monthStart);
  const monthIndex = monthStart.getMonth();
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i);
    return {
      dateIso: toIsoDate(d),
      inCurrentMonth: d.getMonth() === monthIndex,
    };
  });
}

export type DayWindowStats = {
  total: number;
  booked: number;
  free: number;
};

export function indexWindowsByDate(windows: { dateIso: string; status: string }[]): Map<string, DayWindowStats> {
  const map = new Map<string, DayWindowStats>();
  for (const w of windows) {
    const cur = map.get(w.dateIso) ?? { total: 0, booked: 0, free: 0 };
    cur.total += 1;
    if (w.status === 'booked') cur.booked += 1;
    else if (w.status === 'free') cur.free += 1;
    map.set(w.dateIso, cur);
  }
  return map;
}

export function windowsCountRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} окон`;
  if (mod10 === 1) return `${n} окно`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} окна`;
  return `${n} окон`;
}

export function serviceTitleById(services: MasterOnboardingService[], id: string | null): string {
  if (!id) return 'Любая услуга';
  return services.find((x) => x.id === id)?.title ?? 'Услуга';
}

export function isStartWithinScheduleHorizon(startMs: number, horizonDays: number | null): boolean {
  if (horizonDays == null || horizonDays <= 0) return true;
  return startMs <= Date.now() + horizonDays * 24 * 60 * 60 * 1000;
}

export function evaluatePlannedSlot(
  p: PlannedSlot,
  now: number,
  horizonDays: number | null,
): { ok: true } | { ok: false; reason: PlannedSlotRejectReason } {
  if (timeToMinutes(p.endTime) <= timeToMinutes(p.startTime)) {
    return { ok: false, reason: 'invalid_time' };
  }
  const startMs = new Date(localDateTimeToUtcIso(p.dateIso, p.startTime)).getTime();
  const endMs = new Date(localDateTimeToUtcIso(p.dateIso, p.endTime)).getTime();
  if (endMs - startMs < 10 * 60 * 1000) return { ok: false, reason: 'short' };
  if (startMs <= now) return { ok: false, reason: 'past' };
  if (!isStartWithinScheduleHorizon(startMs, horizonDays)) return { ok: false, reason: 'horizon' };
  return { ok: true };
}

export function rangesOverlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isHorizonLimitErrorMessage(message: string): boolean {
  return /горизонт|тариф/i.test(message);
}

export function expandRepeatDates(
  anchorIso: string,
  kind: RepeatKind,
  weeklyCount: 4 | 8 | 12,
  biweeklyCount: 4 | 8 | 12,
  weekdayWeeks: 4 | 8 | 12,
): string[] {
  const anchor = startOfLocalDay(parseIsoDate(anchorIso));
  const out: string[] = [];
  const pushUnique = (iso: string) => {
    if (!out.includes(iso)) out.push(iso);
  };

  if (kind === 'none') {
    pushUnique(anchorIso);
    return out;
  }
  if (kind === 'weekly') {
    for (let i = 0; i < weeklyCount; i += 1) pushUnique(toIsoDate(addDays(anchor, i * 7)));
    return out;
  }
  if (kind === 'biweekly') {
    for (let i = 0; i < biweeklyCount; i += 1) pushUnique(toIsoDate(addDays(anchor, i * 14)));
    return out;
  }
  if (kind === 'weekdays') {
    const span = weekdayWeeks * 7;
    for (let d = 0; d < span; d += 1) {
      const day = addDays(anchor, d);
      if (getWeekdayIndex(day) <= 4) pushUnique(toIsoDate(day));
    }
    return out;
  }
  return [anchorIso];
}

export function buildPlannedSlots(
  dateIso: string,
  startTime: string,
  endTime: string,
  serviceId: string | null,
  repeatKind: RepeatKind,
  weeklyCount: 4 | 8 | 12,
  biweeklyCount: 4 | 8 | 12,
  weekdayWeeks: 4 | 8 | 12,
): PlannedSlot[] {
  const dates = expandRepeatDates(dateIso, repeatKind, weeklyCount, biweeklyCount, weekdayWeeks);
  return dates.map((d) => ({ dateIso: d, startTime, endTime, serviceId }));
}
