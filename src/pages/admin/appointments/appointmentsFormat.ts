import { addDays } from '../../../features/booking/lib/calendar';
import {
  isoDateLocal,
  type DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { dbStatusToUi, isUpcomingTabStatus } from '../../../features/appointments/appointmentStatus';
import { profileDisplayInitials } from '../../../features/profile/lib/profileDisplayAvatar';
import { formatBynRu } from '../overview/overviewFormat';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import { formatPendingDeadline } from './formatPendingDeadline';
import type { RequestsFeatureFilter, RequestsPeriodFilter } from './appointmentsTypes';

export function formatAppointmentPrice(value: number): string {
  return formatBynRu(value);
}

export function bookingSourceLabel(source?: string | null): string {
  if (!source) return 'Сайт';
  if (source === 'telegram') return 'Telegram';
  if (source === 'google') return 'Google';
  if (source === 'email') return 'Email';
  return source;
}

export const CLIENT_NAME_PLACEHOLDERS = new Set([
  'Клиент без имени',
  'Клиент SLOTTY',
  'Клиент',
  '',
]);

function looksLikePhoneLabel(value: string): boolean {
  return /^\+?\d[\d\s().-]{5,}$/.test(value.replace(/\s/g, ''));
}

/** Имя из API/метаданных: телефон и плейсхолдеры не считаем ФИО. */
export function clientNameInputForResolve(name: string | null | undefined): string | null {
  const trimmed = name?.trim() || '';
  if (!trimmed || CLIENT_NAME_PLACEHOLDERS.has(trimmed) || looksLikePhoneLabel(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Инициалы для аватара. `null` — показать иконку человека вместо цифр телефона. */
export function clientInitials(name: string, _phone?: string | null): string | null {
  const trimmed = name.trim();
  if (
    trimmed &&
    !CLIENT_NAME_PLACEHOLDERS.has(trimmed) &&
    !looksLikePhoneLabel(trimmed)
  ) {
    const initials = profileDisplayInitials(trimmed);
    return initials || null;
  }
  return null;
}

/** «На дому» / «В студии» из короткого адреса. */
export function formatVisitPlace(addressShort?: string): string {
  const raw = addressShort?.trim();
  if (!raw) return 'В студии';
  const lower = raw.toLowerCase();
  if (lower.includes('дом') || lower.includes('выезд') || lower.includes('на дому')) {
    return 'На дому';
  }
  return 'В студии';
}

/** Оценка длительности по названию услуги (нет поля в модели). */
export function formatDurationMinutes(minutes?: number | null, serviceTitle?: string): string {
  if (minutes != null && minutes > 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h} ч ${m} мин`;
    if (h) return `${h} ч`;
    return `${m} мин`;
  }
  return estimateDurationLabel(serviceTitle ?? '');
}

export function estimateDurationLabel(serviceTitle: string): string {
  const t = serviceTitle.toLowerCase();
  if (t.includes('педикюр')) return '1 ч 15 мин';
  if (t.includes('дизайн') || t.includes('+')) return '2 ч';
  if (t.includes('консульта')) return '30 мин';
  return '1 ч 30 мин';
}

function timeSortKey(time: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return time;
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

export function compareAppointmentsByDateAsc(a: DemoMasterAppointment, b: DemoMasterAppointment): number {
  const left = `${a.date}T${timeSortKey(a.time)}`;
  const right = `${b.date}T${timeSortKey(b.time)}`;
  return left.localeCompare(right, 'ru');
}

export function compareAppointmentsByDateDesc(a: DemoMasterAppointment, b: DemoMasterAppointment): number {
  return compareAppointmentsByDateAsc(b, a);
}

export function uniqueServiceTitles(rows: DemoMasterAppointment[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const t = row.serviceTitle?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
}

export function formatDayGroupLabel(iso: string, todayIso = isoDateLocal(new Date())): string {
  const tomorrow = isoDateLocal(addDays(new Date(`${todayIso}T12:00:00`), 1));
  if (iso === todayIso) return 'Сегодня';
  if (iso === tomorrow) return 'Завтра';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
  const dayMonth = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${dayMonth}, ${weekday}`;
}

export function formatMonthGroupLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const label = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

export function appointmentsCountRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} записей`;
  if (mod10 === 1) return `${n} запись`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} записи`;
  return `${n} записей`;
}

export function indexAppointmentsByDate(
  rows: DemoMasterAppointment[],
): Map<string, DemoMasterAppointment[]> {
  const map = new Map<string, DemoMasterAppointment[]>();
  for (const row of rows) {
    const list = map.get(row.date) ?? [];
    list.push(row);
    map.set(row.date, list);
  }
  for (const list of map.values()) {
    list.sort(compareAppointmentsByDateAsc);
  }
  return map;
}

export function groupAppointmentsByDay(
  rows: DemoMasterAppointment[],
  todayIso = isoDateLocal(new Date()),
): Array<{ dayIso: string; label: string; items: DemoMasterAppointment[] }> {
  const sorted = [...rows].sort(compareAppointmentsByDateAsc);
  const map = new Map<string, DemoMasterAppointment[]>();
  for (const row of sorted) {
    const list = map.get(row.date) ?? [];
    list.push(row);
    map.set(row.date, list);
  }
  return [...map.entries()].map(([dayIso, items]) => ({
    dayIso,
    label: formatDayGroupLabel(dayIso, todayIso),
    items,
  }));
}

export function compareAppointmentsByPriceDesc(
  a: DemoMasterAppointment,
  b: DemoMasterAppointment,
): number {
  return (b.priceByn ?? 0) - (a.priceByn ?? 0);
}

export function compareAppointmentsByPriceAsc(
  a: DemoMasterAppointment,
  b: DemoMasterAppointment,
): number {
  return (a.priceByn ?? 0) - (b.priceByn ?? 0);
}

export function groupAppointmentsByMonth(
  rows: DemoMasterAppointment[],
  sortFn: (a: DemoMasterAppointment, b: DemoMasterAppointment) => number = compareAppointmentsByDateDesc,
): Array<{ monthKey: string; label: string; items: DemoMasterAppointment[] }> {
  const sorted = [...rows].sort(sortFn);
  const map = new Map<string, DemoMasterAppointment[]>();
  for (const row of sorted) {
    const key = monthKeyFromIso(row.date);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, items]) => ({
      monthKey,
      label: formatMonthGroupLabel(`${monthKey}-01`),
      items,
    }));
}

export function formatCardDateTime(iso: string, time: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return `${iso} · ${time}`;
  const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'short' });
  return `${day}, ${weekday} · ${time}`;
}

export function isUpcomingTabAppointment(
  row: DemoMasterAppointment,
  now = new Date(),
): boolean {
  const db = row.dbStatus ?? row.status;
  if (!isUpcomingTabStatus(db)) return false;
  if (row.endsAt) return new Date(row.endsAt).getTime() >= now.getTime();
  const slot = new Date(`${row.date}T${timeSortKey(row.time)}:00`);
  return slot.getTime() >= now.getTime() - 60_000;
}

/** @deprecated используйте isUpcomingTabAppointment */
export function isUpcomingConfirmed(row: DemoMasterAppointment): boolean {
  return isUpcomingTabAppointment(row, new Date());
}

export function pickNearestUpcoming(
  rows: DemoMasterAppointment[],
): DemoMasterAppointment | null {
  const pending = rows.filter((r) => r.status === 'pending');
  const upcoming = rows.filter((r) => isUpcomingTabAppointment(r));
  const candidates = [...pending, ...upcoming];
  if (!candidates.length) return null;
  return [...candidates].sort(compareAppointmentsByDateAsc)[0] ?? null;
}

export function filterHistoryBySearch(
  rows: DemoMasterAppointment[],
  query: string,
): DemoMasterAppointment[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) => {
    const haystack = [
      resolveClientDisplayName(row),
      row.serviceTitle,
      row.contact ?? '',
      row.clientNote ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterHistoryByPeriod(
  rows: DemoMasterAppointment[],
  period: 'all' | 'month' | 'quarter',
): DemoMasterAppointment[] {
  if (period === 'all') return rows;
  const today = new Date();
  const days = period === 'month' ? 30 : 90;
  const startIso = isoDateLocal(addDays(today, -(days - 1)));
  return rows.filter((r) => r.date >= startIso);
}

export function isRequestExpiringSoon(
  row: DemoMasterAppointment,
  now = Date.now(),
): boolean {
  const deadline = formatPendingDeadline(row.pendingExpiresAt, now);
  return deadline?.tone === 'warning' || deadline?.tone === 'critical';
}

export function filterRequestsByPeriod(
  rows: DemoMasterAppointment[],
  period: RequestsPeriodFilter,
  today = new Date(),
): DemoMasterAppointment[] {
  if (period === 'all') return rows;

  const todayIso = isoDateLocal(today);
  if (period === 'today') {
    return rows.filter((r) => r.date === todayIso);
  }

  const endIso =
    period === 'week'
      ? isoDateLocal(addDays(today, 6))
      : isoDateLocal(addDays(today, 29));

  return rows.filter((r) => r.date >= todayIso && r.date <= endIso);
}

export function filterRequestsByFeature(
  rows: DemoMasterAppointment[],
  feature: RequestsFeatureFilter,
  now = Date.now(),
): DemoMasterAppointment[] {
  if (feature === 'all') return rows;
  if (feature === 'expiring') {
    return rows.filter((row) => isRequestExpiringSoon(row, now));
  }
  return rows.filter((row) => Boolean(row.clientReferencePhotoUrl?.trim()));
}

export function historyStatusLabel(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return 'Завершено';
  if (status === 'no_show') return 'Неявка';
  if (status === 'cancelled') return 'Отменено';
  return 'Отменено';
}

export function isHistoryAppointment(row: DemoMasterAppointment): boolean {
  const db = row.dbStatus ?? row.status;
  if (db === 'completed' || db === 'no_show') return true;
  if (db === 'cancelled_by_client' || db === 'cancelled_by_master') return true;
  if (dbStatusToUi(db) === 'cancelled') return true;
  if (isUpcomingTabStatus(db) && row.endsAt && new Date(row.endsAt) < new Date()) return true;
  return false;
}
