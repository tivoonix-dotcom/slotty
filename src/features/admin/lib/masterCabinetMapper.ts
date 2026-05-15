import { addDays } from '../../booking/lib/calendar';
import type { DemoAppointmentStatus, DemoMasterAppointment } from '../../master/model/demoMasterAppointments';
import { isoDateLocal } from '../../master/model/demoMasterAppointments';
import type {
  MasterCertificate,
  MasterDraft,
  MasterDraftCareerItem,
  MasterOnboardingService,
  MasterPortfolioItem,
  MasterSchedule,
} from '../../profile/lib/demoMasterStorage';
import { parseContactsJson } from '../../master-onboarding/model/masterContacts';
import type { MasterLocation } from '../../profile/model/masterLocation';
import { formatStoredPublicAddress } from '../../profile/model/masterLocation';
import type { MasterCabinetDto, MasterCabinetScheduleRuleDto } from '../api/masterCabinetApi';
import type { PrimaryLocationBody, ScheduleRuleDto } from '../../master-onboarding/api/becomeMasterApi';

const BOOKING_HORIZON_DAYS = 120;

type ScheduleWindow = { id: string; startTime: string; endTime: string };
type DateSlotDay = { date: string; windows: ScheduleWindow[] };
type DateSlotRule = {
  serviceId: string | 'all';
  days: DateSlotDay[];
  gapMinutes: number;
  bookingHorizonDays: number;
};

type ScheduleWithDateSlots = MasterSchedule & { dateSlotRules?: DateSlotRule[] };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseIsoDate(iso: string): Date {
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  return new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
}

/** Пн=0 … Вс=6 (как в кабинете мастера). */
function getWeekdayIndexMon0(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** В БД weekday как в JS Date.getDay(): Вс=0 … Сб=6. */
function uiWeekdayToDb(ui: number): number {
  return (ui + 1) % 7;
}

function dbWeekdayToUi(db: number): number {
  return (db + 6) % 7;
}

function padTime(t: string): string {
  const s = (t || '09:00').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return '09:00';
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

function timeToMinutes(t: string): number {
  const p = padTime(t);
  const [h, min] = p.split(':').map((x) => Number(x));
  return h * 60 + min;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${pad2(h)}:${pad2(min)}`;
}

function newWindowId(date: string, idx: number): string {
  return `w-${date}-${idx}`;
}

function scheduleRulesToDraftSchedule(rules: MasterCabinetScheduleRuleDto[]): MasterSchedule {
  const active = rules.filter((r) => r.isActive !== false);
  if (!active.length) {
    return {
      workDays: [0, 1, 2, 3, 4],
      startTime: '09:00',
      endTime: '18:00',
      gapMinutes: 0,
    };
  }

  const uiDays = [...new Set(active.map((r) => dbWeekdayToUi(r.weekday)))].sort((a, b) => a - b);
  const starts = active.map((r) => timeToMinutes(padTime(r.startTime)));
  const ends = active.map((r) => timeToMinutes(padTime(r.endTime)));
  const startTime = minutesToTime(Math.min(...starts));
  const endTime = minutesToTime(Math.max(...ends));

  const today = startOfDay(new Date());
  const days: DateSlotDay[] = [];

  for (let i = 0; i < BOOKING_HORIZON_DAYS; i += 1) {
    const d = addDays(today, i);
    const uiWd = getWeekdayIndexMon0(d);
    const dbWd = uiWeekdayToDb(uiWd);
    const forDay = active.filter((r) => r.weekday === dbWd);
    if (!forDay.length) continue;
    const dateStr = toIsoDate(d);
    const windows: ScheduleWindow[] = forDay.map((r, idx) => ({
      id: newWindowId(dateStr, idx),
      startTime: padTime(r.startTime),
      endTime: padTime(r.endTime),
    }));
    days.push({ date: dateStr, windows });
  }

  const dateSlotRules: DateSlotRule[] = [
    {
      serviceId: 'all',
      gapMinutes: 0,
      bookingHorizonDays: BOOKING_HORIZON_DAYS,
      days,
    },
  ];

  return {
    workDays: uiDays.length ? uiDays : [0, 1, 2, 3, 4],
    startTime,
    endTime,
    gapMinutes: 0,
    dateSlotRules,
  } as ScheduleWithDateSlots;
}

function getScheduleRules(schedule: MasterSchedule): DateSlotRule[] {
  const nextSchedule = schedule as ScheduleWithDateSlots;
  return Array.isArray(nextSchedule.dateSlotRules) ? nextSchedule.dateSlotRules : [];
}

/** Черновик расписания → правила для API (weekday в формате JS getDay). */
export function draftScheduleToApiRules(schedule: MasterSchedule): ScheduleRuleDto[] {
  const rules = getScheduleRules(schedule);
  const allRule = rules.find((r) => r.serviceId === 'all') ?? rules[0];
  const map = new Map<string, ScheduleRuleDto>();

  if (allRule) {
    for (const day of allRule.days) {
      const uiWd = getWeekdayIndexMon0(parseIsoDate(day.date));
      const dbWd = uiWeekdayToDb(uiWd);
      for (const w of day.windows) {
        const key = `${dbWd}|${padTime(w.startTime)}|${padTime(w.endTime)}`;
        if (!map.has(key)) {
          map.set(key, { weekday: dbWd, startTime: padTime(w.startTime), endTime: padTime(w.endTime) });
        }
      }
    }
  }

  const out = [...map.values()];
  if (out.length) return out;

  return schedule.workDays.map((uiWd) => ({
    weekday: uiWeekdayToDb(uiWd),
    startTime: padTime(schedule.startTime),
    endTime: padTime(schedule.endTime),
  }));
}

function cabinetLocationToDraft(loc: NonNullable<MasterCabinetDto['primaryLocation']>): MasterLocation {
  return {
    visitType: loc.visitType === 'at_home' ? 'at_home' : 'studio',
    city: loc.city?.trim() || undefined,
    street: (loc.street || '').trim() || '—',
    building: (loc.building || '').trim() || '—',
    buildingDetail: loc.buildingDetail?.trim() || undefined,
    salonName: loc.salonName?.trim() || undefined,
    district: loc.district?.trim() || undefined,
    entrance: loc.entrance?.trim() || undefined,
    floor: loc.floor?.trim() || undefined,
    room: loc.room?.trim() || undefined,
    intercom: loc.intercom?.trim() || undefined,
    landmark: loc.landmark?.trim() || undefined,
    directions: loc.directions?.trim() || undefined,
    clientNote: loc.clientNote?.trim() || undefined,
    lat: loc.lat != null ? Number(loc.lat) : undefined,
    lng: loc.lng != null ? Number(loc.lng) : undefined,
    showExactAddressAfterBooking: loc.showExactAddressAfterBooking === true,
  };
}

export function draftToPrimaryLocationBody(loc: MasterLocation): PrimaryLocationBody {
  const city = (loc.city && loc.city.trim()) || 'Минск';
  const street = (loc.street || '').trim() || '—';
  const building = (loc.building || '').trim() || '—';
  const publicAddress = formatStoredPublicAddress(loc).slice(0, 600) || street;

  const isHome = loc.visitType === 'at_home';

  return {
    visitType: isHome ? 'at_home' : 'studio',
    city,
    street,
    building,
    buildingDetail: loc.buildingDetail?.trim() || null,
    salonName: !isHome ? loc.salonName?.trim() || null : null,
    district: isHome ? loc.district?.trim() || null : null,
    entrance: loc.entrance?.trim() || null,
    floor: loc.floor?.trim() || null,
    room: loc.room?.trim() || null,
    intercom: loc.intercom?.trim() || null,
    landmark: loc.landmark?.trim() || null,
    directions: loc.directions?.trim() || null,
    clientNote: loc.clientNote?.trim() || null,
    publicAddress,
    lat: loc.lat != null && Number.isFinite(loc.lat) ? loc.lat : null,
    lng: loc.lng != null && Number.isFinite(loc.lng) ? loc.lng : null,
    showExactAddressAfterBooking: isHome ? loc.showExactAddressAfterBooking === true : undefined,
  };
}

export function cabinetDtoToMasterDraft(cabinet: MasterCabinetDto): MasterDraft {
  const { profile, primaryCategory, primaryLocation, scheduleRules, services, bookingRules, certificates, portfolio, career } =
    cabinet;

  const mappedServices: MasterOnboardingService[] = services.map((s) => ({
    id: s.id,
    title: s.title,
    durationMin: s.durationMinutes,
    priceByn: s.price,
    description: s.description || undefined,
    priceType: s.priceType === 'from' ? 'from' : 'fixed',
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  }));

  const certs: MasterCertificate[] = certificates.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer ?? '',
    year: c.year != null ? String(c.year) : undefined,
    imageUrl: c.imageUrl ?? undefined,
    description: c.description ?? undefined,
  }));

  const port: MasterPortfolioItem[] = portfolio.map((p) => ({
    id: p.id,
    title: p.title ?? undefined,
    imageUrl: p.imageUrl,
    description: p.description ?? undefined,
  }));

  const careerItems: MasterDraftCareerItem[] = career.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    place: c.place,
    startYear: c.startYear != null ? String(c.startYear) : undefined,
    endYear: c.endYear != null ? String(c.endYear) : undefined,
    description: c.description ?? undefined,
  }));

  return {
    masterId: profile.masterId,
    category: primaryCategory?.name || primaryCategory?.code || 'Не указана',
    primaryCategoryId: profile.primaryCategoryId ?? undefined,
    primaryCategoryCode: primaryCategory?.code,
    name: profile.displayName,
    description: profile.bio || '',
    contact: profile.contact || '',
    contacts: parseContactsJson(profile.contacts) ?? undefined,
    phone: profile.phone || undefined,
    photoUrl: profile.photoUrl || undefined,
    services: mappedServices,
    schedule: scheduleRulesToDraftSchedule(scheduleRules),
    location: primaryLocation ? cabinetLocationToDraft(primaryLocation) : { visitType: 'studio', street: '', building: '' },
    createdAt: new Date().toISOString(),
    certificates: certs.length ? certs : undefined,
    portfolio: port.length ? port : undefined,
    careerItems: careerItems.length ? careerItems : undefined,
    bookingRules: bookingRules?.bookingRules ?? undefined,
    cancellationPolicy: bookingRules?.cancellationPolicy ?? undefined,
    paymentNote: bookingRules?.paymentNote ?? undefined,
    paymentMethods: bookingRules?.paymentMethods?.length ? bookingRules.paymentMethods : undefined,
  };
}

function mapDbAppointmentStatus(s: string): DemoAppointmentStatus {
  if (s === 'pending' || s === 'confirmed') return s;
  if (s === 'completed' || s === 'no_show') return 'completed';
  return 'cancelled';
}

export function mapMasterAppointmentRowToDemo(row: {
  id: string;
  starts_at: string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  client_name: string;
  client_note: string | null;
}): DemoMasterAppointment {
  const d = new Date(row.starts_at);
  const date = isoDateLocal(d);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const price = Number(row.price_snapshot);
  return {
    id: row.id,
    clientName: row.client_name || 'Клиент',
    serviceTitle: row.service_title_snapshot || 'Услуга',
    date,
    time,
    priceByn: Number.isFinite(price) ? price : 0,
    contact: row.client_note?.trim() || undefined,
    status: mapDbAppointmentStatus(row.status),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}
