import { addDays } from '../../booking/lib/calendar';

/** Демо-записи клиентов для кабинета мастера. TODO (Supabase): таблица appointments. */
export const MASTER_APPOINTMENTS_DEMO_KEY = 'slotty_master_appointments_demo';

export const OVERVIEW_MAX_RANGE_DAYS = 90;

export type DemoAppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type DemoMasterAppointment = {
  id: string;
  clientName: string;
  serviceTitle: string;
  /** ISO YYYY-MM-DD */
  date: string;
  time: string;
  priceByn: number;
  contact?: string;
  status: DemoAppointmentStatus;
  /** Короткий адрес для сводки / деталей. */
  addressShort?: string;
  dateLabel?: string;
  timeLabel?: string;
  /** Алиас из спецификации; при загрузке маппится в priceByn. */
  price?: number;
};

function normalizeTime(t: string): string {
  const s = (t || '09:00').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m) return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
  return s;
}

function timeToSortKey(time: string): string {
  const n = normalizeTime(time);
  return n.length === 5 ? `${n}:00` : n;
}

export function normalizeDemoAppointment(raw: DemoMasterAppointment): DemoMasterAppointment {
  const any = raw as DemoMasterAppointment & { price?: number };
  const price =
    typeof any.price === 'number' && Number.isFinite(any.price) ? any.price : raw.priceByn;
  return {
    ...raw,
    time: normalizeTime(raw.time),
    priceByn: Number.isFinite(price) ? price : 0,
    addressShort: raw.addressShort,
    dateLabel: raw.dateLabel,
    timeLabel: raw.timeLabel,
  };
}

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadDemoAppointments(): DemoMasterAppointment[] {
  try {
    const raw = localStorage.getItem(MASTER_APPOINTMENTS_DEMO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === 'object' && typeof (x as DemoMasterAppointment).id === 'string')
      .map((x) => normalizeDemoAppointment(x as DemoMasterAppointment));
  } catch {
    return [];
  }
}

export function saveDemoAppointments(rows: DemoMasterAppointment[]): void {
  try {
    localStorage.setItem(MASTER_APPOINTMENTS_DEMO_KEY, JSON.stringify(rows));
  } catch (e) {
    console.warn('[SLOTTY] saveDemoAppointments failed', e);
  }
}

function buildSeed(): DemoMasterAppointment[] {
  const today = new Date();
  const isoToday = isoDateLocal(today);
  const isoTomorrow = isoDateLocal(addDays(today, 1));
  const isoYesterday = isoDateLocal(addDays(today, -1));
  const iso3d = isoDateLocal(addDays(today, -3));
  const iso5d = isoDateLocal(addDays(today, -5));
  const base: DemoMasterAppointment[] = [
    {
      id: 'demo-appt-1',
      clientName: 'Алина К.',
      serviceTitle: 'Маникюр с покрытием',
      date: isoToday,
      time: '10:00',
      priceByn: 45,
      contact: '+375 29 000-00-01',
      status: 'pending',
      addressShort: 'пр. Независимости, 95',
    },
    {
      id: 'demo-appt-2',
      clientName: 'Мария В.',
      serviceTitle: 'Педикюр',
      date: isoToday,
      time: '14:30',
      priceByn: 55,
      contact: '@maria_client',
      status: 'pending',
      addressShort: 'ул. Кальварийская, 17',
    },
    {
      id: 'demo-appt-3',
      clientName: 'Екатерина С.',
      serviceTitle: 'Коррекция гель-лака',
      date: isoToday,
      time: '16:00',
      priceByn: 40,
      contact: '+375 33 111-22-33',
      status: 'confirmed',
    },
    {
      id: 'demo-appt-4',
      clientName: 'Дарья Л.',
      serviceTitle: 'Маникюр с покрытием',
      date: isoTomorrow,
      time: '11:15',
      priceByn: 45,
      contact: '@darya_slotty',
      status: 'confirmed',
      addressShort: 'м. Площадь Победы',
    },
    {
      id: 'demo-appt-5',
      clientName: 'Ольга Н.',
      serviceTitle: 'Маникюр + дизайн',
      date: isoYesterday,
      time: '12:00',
      priceByn: 60,
      status: 'completed',
    },
    {
      id: 'demo-appt-6',
      clientName: 'Ирина П.',
      serviceTitle: 'Педикюр',
      date: iso3d,
      time: '15:00',
      priceByn: 55,
      status: 'completed',
    },
    {
      id: 'demo-appt-7',
      clientName: 'Светлана М.',
      serviceTitle: 'Маникюр с покрытием',
      date: iso5d,
      time: '10:30',
      priceByn: 45,
      status: 'completed',
    },
    {
      id: 'demo-appt-8',
      clientName: 'Тест Отмена',
      serviceTitle: 'Консультация',
      date: isoTomorrow,
      time: '18:00',
      priceByn: 0,
      status: 'cancelled',
    },
  ];
  const history: DemoMasterAppointment[] = [];
  for (let back = 2; back <= 40; back += 1) {
    const iso = isoDateLocal(addDays(today, -back));
    const mix = (back * 7 + back) % 11;
    history.push({
      id: `demo-appt-gen-${back}`,
      clientName: 'Клиент',
      serviceTitle: mix % 4 === 0 ? 'Педикюр' : mix % 3 === 0 ? 'Дизайн' : 'Маникюр',
      date: iso,
      time: `${9 + (back % 7)}:${(back % 2) * 30 === 0 ? '00' : '30'}`,
      priceByn: 35 + mix * 3,
      status: 'completed',
    });
  }
  return [...base, ...history];
}

/** Первая загрузка: если в LS пусто — записать демо-набор. */
export function ensureDemoAppointmentsSeeded(): DemoMasterAppointment[] {
  const cur = loadDemoAppointments();
  if (cur.length > 0) return cur.map(normalizeDemoAppointment);
  const seed = buildSeed();
  saveDemoAppointments(seed);
  return seed;
}

export function appointmentStatusLabel(s: DemoAppointmentStatus): string {
  switch (s) {
    case 'pending':
      return 'Новая';
    case 'confirmed':
      return 'Подтверждена';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    default:
      return s;
  }
}

export function countAppointmentsOnDate(rows: DemoMasterAppointment[], iso: string): number {
  return rows.filter((r) => r.date === iso && r.status !== 'cancelled').length;
}

export function sumCompletedRevenueLastDays(rows: DemoMasterAppointment[], days: number): number {
  const end = new Date();
  const start = addDays(end, -(days - 1));
  const startIso = isoDateLocal(start);
  const endIso = isoDateLocal(end);
  return rows
    .filter((r) => r.status === 'completed' && r.date >= startIso && r.date <= endIso)
    .reduce((acc, r) => acc + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
}

/** Список дат YYYY-MM-DD от start до end включительно (не длиннее `OVERVIEW_MAX_RANGE_DAYS`). */
export function listIsoDatesInclusive(startIso: string, endIso: string): string[] {
  if (!startIso || !endIso || startIso > endIso) return [];
  const out: string[] = [];
  let d = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  let n = 0;
  while (d <= end && n < OVERVIEW_MAX_RANGE_DAYS) {
    out.push(isoDateLocal(d));
    d = addDays(d, 1);
    n += 1;
  }
  return out;
}

/** Предыдущий отрезок той же длины (по числу дней в `listIsoDatesInclusive`), сразу перед `startIso`. */
export function previousOverviewPeriod(startIso: string, endIso: string): { start: string; end: string } | null {
  const days = listIsoDatesInclusive(startIso, endIso).length;
  if (!days) return null;
  const start = new Date(`${startIso}T12:00:00`);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: isoDateLocal(prevStart), end: isoDateLocal(prevEnd) };
}

export function clampOverviewRangeEnd(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const maxEnd = addDays(start, OVERVIEW_MAX_RANGE_DAYS - 1);
  if (end.getTime() <= maxEnd.getTime()) return endIso;
  return isoDateLocal(maxEnd);
}

export type OverviewDayStat = {
  date: string;
  completedRevenue: number;
  activeVisits: number;
};

export function aggregateOverviewByDay(
  rows: DemoMasterAppointment[],
  startIso: string,
  endIso: string,
): OverviewDayStat[] {
  return listIsoDatesInclusive(startIso, endIso).map((date) => {
    const day = rows.filter((r) => r.date === date);
    const completedRevenue = day
      .filter((r) => r.status === 'completed')
      .reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
    const activeVisits = day.filter((r) => r.status !== 'cancelled').length;
    return { date, completedRevenue, activeVisits };
  });
}

export function sumCompletedRevenueBetween(
  rows: DemoMasterAppointment[],
  startIso: string,
  endIso: string,
): number {
  return rows
    .filter((r) => r.status === 'completed' && r.date >= startIso && r.date <= endIso)
    .reduce((s, r) => s + (Number.isFinite(r.priceByn) ? r.priceByn : 0), 0);
}

export function countActiveVisitsBetween(rows: DemoMasterAppointment[], startIso: string, endIso: string): number {
  return rows.filter((r) => r.status !== 'cancelled' && r.date >= startIso && r.date <= endIso).length;
}

/**
 * Ближайшая запись среди pending/confirmed с датой >= today (локальный календарь).
 * TODO (Supabase): фильтр по часовому поясу мастера.
 */
export function pickNearestUpcomingAppointment(
  rows: DemoMasterAppointment[],
  todayIso: string = isoDateLocal(new Date()),
): DemoMasterAppointment | null {
  const candidates = rows.filter(
    (r) => (r.status === 'pending' || r.status === 'confirmed') && r.date >= todayIso,
  );
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    const da = `${a.date}T${timeToSortKey(a.time)}`;
    const db = `${b.date}T${timeToSortKey(b.time)}`;
    return da.localeCompare(db);
  });
  return sorted[0] ?? null;
}
