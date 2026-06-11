import type { CatalogDateRange, CatalogFiltersState, CatalogTimeOfDay } from './catalogFiltersState';

export const CATALOG_DATE_STRIP_DAYS = 365;
export const CATALOG_CALENDAR_MAX_DAYS = 365;

const WEEKDAY_SHORT_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
const MONTH_SHORT_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

export type DateStripItem = {
  offset: number;
  iso: string;
  weekdayShort: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
  isTomorrow: boolean;
};

function startOfLocalDay(base = new Date()): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

export function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDateStripItems(count = CATALOG_DATE_STRIP_DAYS, base = new Date()): DateStripItem[] {
  const today = startOfLocalDay(base);
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return {
      offset,
      iso: formatIsoDateLocal(d),
      weekdayShort: WEEKDAY_SHORT_RU[d.getDay()],
      dayNum: d.getDate(),
      monthShort: MONTH_SHORT_RU[d.getMonth()],
      isToday: offset === 0,
      isTomorrow: offset === 1,
    };
  });
}

export function dateFromOffset(offset: number, base = new Date()): Date {
  const d = startOfLocalDay(base);
  d.setDate(d.getDate() + offset);
  return d;
}

export function offsetFromIso(iso: string, base = new Date()): number | null {
  const picked = startOfLocalDay(new Date(`${iso}T12:00:00`));
  const today = startOfLocalDay(base);
  const diff = Math.round((picked.getTime() - today.getTime()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

/** Ближайшая API-граница для выбранного дня. */
export function dateOffsetToDateRange(offset: number | null): CatalogDateRange | 'any' {
  if (offset === null) return 'any';
  if (offset === 0) return 'today';
  if (offset === 1) return 'tomorrow';

  const d = dateFromOffset(offset);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return 'weekend';
  if (offset <= 7) return 'week';
  return 'week';
}

export function dateRangeToDateOffset(range: CatalogDateRange | 'any'): number | null {
  if (range === 'any') return null;
  if (range === 'today') return 0;
  if (range === 'tomorrow') return 1;
  if (range === 'week') return 2;
  if (range === 'weekend') {
    for (let i = 0; i < 14; i += 1) {
      const d = dateFromOffset(i);
      if (d.getDay() === 0 || d.getDay() === 6) return i;
    }
    return 5;
  }
  return null;
}

export function formatTimeHour(hour: number): string {
  const h = Math.min(24, Math.max(0, Math.round(hour)));
  return `${String(h).padStart(2, '0')}:00`;
}

export function formatTimeRangeLabel(startHour: number, endHour: number): string {
  return `${formatTimeHour(startHour)} – ${formatTimeHour(endHour)}`;
}

/** Диапазон часов → пресет API (утро/день/вечер). */
export function timeRangeToTimeOfDay(startHour: number, endHour: number): CatalogTimeOfDay | 'any' {
  const start = Math.min(startHour, endHour);
  const end = Math.max(startHour, endHour);
  if (start <= 0 && end >= 24) return 'any';
  if (start === 8 && end === 12) return 'morning';
  if (start === 12 && end === 17) return 'afternoon';
  if (start === 17 && end === 22) return 'evening';

  const mid = (start + end) / 2;
  if (mid < 12) return 'morning';
  if (mid < 17) return 'afternoon';
  if (mid < 22) return 'evening';
  return 'any';
}

export function timeOfDayToDefaultRange(timeOfDay: CatalogTimeOfDay | 'any'): {
  startHour: number;
  endHour: number;
} {
  switch (timeOfDay) {
    case 'morning':
      return { startHour: 8, endHour: 12 };
    case 'afternoon':
      return { startHour: 12, endHour: 17 };
    case 'evening':
      return { startHour: 17, endHour: 22 };
    default:
      return { startHour: 0, endHour: 24 };
  }
}

export function applyDateDayOffset(
  filters: CatalogFiltersState,
  offset: number | null,
): CatalogFiltersState {
  const chips = new Set(filters.chips);
  if (offset === null) {
    chips.delete('today');
    return {
      ...filters,
      dateDayOffset: null,
      slotDate: null,
      dateRange: 'any',
      chips,
    };
  }

  const iso = formatIsoDateLocal(dateFromOffset(offset));
  if (offset === 0) chips.add('today');
  else chips.delete('today');

  const dateRange =
    offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : 'any';

  return {
    ...filters,
    dateDayOffset: offset,
    slotDate: iso,
    dateRange,
    chips,
  };
}

export function applyTimeRange(
  filters: CatalogFiltersState,
  startHour: number,
  endHour: number,
): CatalogFiltersState {
  const start = Math.max(0, Math.min(23, startHour));
  const end = Math.max(start + 1, Math.min(24, endHour));
  const timeOfDay = timeRangeToTimeOfDay(start, end);
  return { ...filters, timeStartHour: start, timeEndHour: end, timeOfDay };
}

export function formatDateOffsetLabel(offset: number, base = new Date()): string {
  const d = dateFromOffset(offset, base);
  const weekday = WEEKDAY_SHORT_RU[d.getDay()];
  const month = MONTH_SHORT_RU[d.getMonth()];
  if (offset === 0) return 'Сегодня';
  if (offset === 1) return 'Завтра';
  return `${weekday}, ${d.getDate()} ${month}`;
}

export function formatSlotDateLabel(iso: string, base = new Date()): string {
  const offset = offsetFromIso(iso, base);
  if (offset != null) return formatDateOffsetLabel(offset, base);
  const d = startOfLocalDay(new Date(`${iso}T12:00:00`));
  const weekday = WEEKDAY_SHORT_RU[d.getDay()];
  const month = MONTH_SHORT_RU[d.getMonth()];
  return `${weekday}, ${d.getDate()} ${month}`;
}

export function isFullTimeRange(startHour: number, endHour: number): boolean {
  return startHour <= 0 && endHour >= 24;
}
