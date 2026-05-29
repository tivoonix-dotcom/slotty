import { addDays } from '../../../features/booking/lib/calendar';
import {
  isoDateLocal,
  type DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { profileDisplayInitials } from '../../../features/profile/lib/profileDisplayAvatar';
import { formatBynRu } from '../overview/overviewFormat';

export function formatAppointmentPrice(value: number): string {
  return formatBynRu(value);
}

export function clientInitials(name: string): string {
  return profileDisplayInitials(name);
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

export function isUpcomingConfirmed(
  row: DemoMasterAppointment,
  todayIso = isoDateLocal(new Date()),
): boolean {
  if (row.status !== 'confirmed') return false;
  const now = new Date();
  const slot = new Date(`${row.date}T${timeSortKey(row.time)}:00`);
  if (row.date > todayIso) return true;
  if (row.date < todayIso) return false;
  return slot.getTime() >= now.getTime() - 60_000;
}

export function pickNearestUpcoming(
  rows: DemoMasterAppointment[],
  todayIso = isoDateLocal(new Date()),
): DemoMasterAppointment | null {
  const upcoming = rows.filter((r) => isUpcomingConfirmed(r, todayIso));
  if (!upcoming.length) return null;
  return [...upcoming].sort(compareAppointmentsByDateAsc)[0] ?? null;
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

export function historyStatusLabel(status: DemoMasterAppointment['status']): string {
  if (status === 'completed') return 'Завершено';
  if (status === 'cancelled') return 'Отменено';
  return 'Отменено';
}
