import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import { addDays } from '../../booking/lib/calendar';
import type { DemoAppointmentStatus, DemoMasterAppointment } from '../../master/model/demoMasterAppointments';
import { dbStatusToUi } from '../../appointments/appointmentStatus';
import { resolveNotificationClientName } from '../../notifications/resolveNotificationClientName';
import { clientNameInputForResolve } from '../../../pages/admin/appointments/appointmentsFormat';
import { formatServiceName } from '../../../shared/lib/displayFormat';
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
import { resolvePortfolioCoverId } from './masterPortfolioCover';
import type { PrimaryLocationBody, ScheduleRuleDto } from '../../master-onboarding/api/becomeMasterApi';
import { decodePaymentNote } from './paymentNoteCodec';

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
    street: (loc.street || '').trim() || LOCATION_EMPTY_SENTINEL,
    building: (loc.building || '').trim() || LOCATION_EMPTY_SENTINEL,
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
    showExactAddressAfterBooking: loc.showExactAddressAfterBooking !== false,
  };
}

export function draftToPrimaryLocationBody(loc: MasterLocation): PrimaryLocationBody {
  const city = (loc.city && loc.city.trim()) || 'Минск';
  const street = (loc.street || '').trim() || LOCATION_EMPTY_SENTINEL;
  const building = (loc.building || '').trim() || LOCATION_EMPTY_SENTINEL;
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
    showExactAddressAfterBooking: isHome ? loc.showExactAddressAfterBooking !== false : false,
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
    imageUrl: s.coverImageUrl ?? undefined,
    coverFocalX: s.coverFocalX,
    coverFocalY: s.coverFocalY,
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
    profileSlug: profile.slug?.trim() ? profile.slug.trim() : undefined,
    services: mappedServices,
    schedule: scheduleRulesToDraftSchedule(scheduleRules),
    location: primaryLocation ? cabinetLocationToDraft(primaryLocation) : { visitType: 'studio', street: '', building: '' },
    createdAt: profile.createdAt,
    certificates: certs.length ? certs : undefined,
    portfolio: port.length ? port : undefined,
    portfolioCoverId: resolvePortfolioCoverId(port, profile.portfolioCoverItemId),
    careerItems: careerItems.length ? careerItems : undefined,
    bookingRules: bookingRules?.bookingRules ?? undefined,
    cancellationPolicy: bookingRules?.cancellationPolicy ?? undefined,
    ...normalizeBookingRulesFields(bookingRules),
  };
}

function normalizeBookingRulesFields(
  bookingRules: MasterCabinetDto['bookingRules'],
): Pick<MasterDraft, 'paymentNote' | 'paymentMethods'> {
  if (!bookingRules) return {};
  const decoded = decodePaymentNote(bookingRules.paymentNote);
  const methods =
    bookingRules.paymentMethods?.length ? bookingRules.paymentMethods : decoded.paymentMethods;
  const note = decoded.paymentNote.trim() || undefined;
  return {
    paymentNote: note,
    paymentMethods: methods.length ? methods : undefined,
  };
}

function mapDbAppointmentStatus(s: string): DemoAppointmentStatus {
  return dbStatusToUi(s) as DemoAppointmentStatus;
}

function formatHmLocal(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function mapMasterAppointmentRowToDemo(row: {
  id: string;
  service_id: string;
  slot_id?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  service_duration_snapshot?: number | null;
  client_name: string;
  client_phone?: string | null;
  client_email_snapshot?: string | null;
  client_email?: string | null;
  client_telegram_username_snapshot?: string | null;
  client_telegram_username?: string | null;
  client_telegram_id_snapshot?: string | null;
  client_telegram_id?: string | null;
  booking_source?: string | null;
  voucher_number?: string | null;
  cancel_reason?: string | null;
  client_avatar_url?: string | null;
  client_note: string | null;
  client_reference_photo_url?: string | null;
  pending_expires_at?: string | null;
}): DemoMasterAppointment {
  const d = new Date(row.starts_at);
  const date = isoDateLocal(d);
  const time = formatHmLocal(d);
  const price = Number(row.price_snapshot);
  const phone = row.client_phone?.trim();
  const email = (row.client_email_snapshot ?? row.client_email)?.trim();
  const telegram = (row.client_telegram_username_snapshot ?? row.client_telegram_username)?.trim();
  const note = row.client_note?.trim();
  const photoUrl = row.client_reference_photo_url?.trim() || null;
  const dbStatus = row.status;
  return {
    id: row.id,
    serviceId: row.service_id,
    slotId: row.slot_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    clientName:
      resolveNotificationClientName({
        full_name: clientNameInputForResolve(row.client_name),
        phone,
        telegram_username: telegram?.replace(/^@+/, '') || null,
      }) ??
      clientNameInputForResolve(row.client_name) ??
      'Клиент',
    clientAvatarUrl: row.client_avatar_url?.trim() || null,
    serviceTitle: formatServiceName(row.service_title_snapshot || 'Услуга'),
    date,
    time,
    priceByn: Number.isFinite(price) ? price : 0,
    contact: phone || undefined,
    clientNote: note || undefined,
    clientReferencePhotoUrl: photoUrl,
    status: mapDbAppointmentStatus(dbStatus),
    dbStatus,
    voucherNumber: row.voucher_number ?? null,
    durationMinutes: row.service_duration_snapshot ?? undefined,
    bookingSource: row.booking_source ?? null,
    clientEmail: email || null,
    clientTelegramUsername: telegram?.replace(/^@+/, '') || null,
    clientTelegramId:
      (row.client_telegram_id_snapshot ?? row.client_telegram_id)?.trim() || null,
    cancelReason: row.cancel_reason?.trim() || null,
    pendingExpiresAt: row.pending_expires_at?.trim() || null,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}
