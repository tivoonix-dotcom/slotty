import { dbStatusToUi } from '../appointments/appointmentStatus';
import { isoDateLocal, type DemoMasterAppointment } from '../master/model/demoMasterAppointments';
import type { MeNotificationRow } from '../profile/api/clientNotifications';
import { clientNameInputForResolve } from '../../pages/admin/appointments/appointmentsFormat';
import { resolveNotificationClientName } from './resolveNotificationClientName';

export type MasterNotificationBookingExtras = {
  visitType?: string | null;
  serviceCategory?: string | null;
  cancelReason?: string | null;
};

export type BookingNotificationFormat = 'salon' | 'home' | 'online' | 'other';

export type BookingNotificationMetadata = {
  bookingId: string;
  bookingCode?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  serviceName?: string | null;
  serviceCategory?: string | null;
  servicePrice?: number | null;
  serviceDurationMinutes?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  address?: string | null;
  format?: BookingNotificationFormat | null;
  bookingStatus?: string | null;
  source?: string | null;
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewBody?: string | null;
  needsMasterReply?: boolean | null;
};

function formatHmLocal(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function parseBookingNotificationMetadata(raw: unknown): BookingNotificationMetadata | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const bookingId = typeof o.bookingId === 'string' ? o.bookingId.trim() : '';
  if (!bookingId) return null;

  const str = (key: string): string | null | undefined => {
    const v = o[key];
    if (v == null) return null;
    return typeof v === 'string' ? v : undefined;
  };

  const num = (key: string): number | null | undefined => {
    const v = o[key];
    if (v == null) return null;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
    return undefined;
  };

  const formatRaw = str('format');
  const format =
    formatRaw === 'salon' ||
    formatRaw === 'home' ||
    formatRaw === 'online' ||
    formatRaw === 'other'
      ? formatRaw
      : null;

  return {
    bookingId,
    bookingCode: str('bookingCode') ?? null,
    clientName: str('clientName') ?? null,
    clientPhone: str('clientPhone') ?? null,
    serviceName: str('serviceName') ?? null,
    serviceCategory: str('serviceCategory') ?? null,
    servicePrice: num('servicePrice') ?? null,
    serviceDurationMinutes:
      typeof num('serviceDurationMinutes') === 'number'
        ? Math.round(num('serviceDurationMinutes') as number)
        : null,
    startsAt: str('startsAt') ?? null,
    endsAt: str('endsAt') ?? null,
    address: str('address') ?? null,
    format,
    bookingStatus: str('bookingStatus') ?? null,
    source: str('source') ?? null,
    reviewId: str('reviewId') ?? null,
    reviewRating: num('reviewRating') ?? null,
    reviewBody: str('reviewBody') ?? null,
    needsMasterReply: o.needsMasterReply === false ? false : o.needsMasterReply === true ? true : null,
  };
}

export function resolveReviewNotificationKeys(item: MeNotificationRow): {
  reviewId: string | null;
} {
  const meta = parseBookingNotificationMetadata(item.metadata);
  return {
    reviewId: item.related_entity_id?.trim() || meta?.reviewId?.trim() || null,
  };
}

export function metadataVisitType(format: BookingNotificationFormat | null | undefined): string | null {
  if (format === 'home') return 'at_home';
  if (format === 'salon') return 'studio';
  if (format === 'online') return 'online';
  return format ?? null;
}

export function metadataToDemoAppointment(
  metadata: BookingNotificationMetadata,
): DemoMasterAppointment | null {
  if (!metadata.startsAt) return null;
  const d = new Date(metadata.startsAt);
  if (Number.isNaN(d.getTime())) return null;
  const date = isoDateLocal(d);
  const time = formatHmLocal(d);
  const status = metadata.bookingStatus ?? 'pending';

  return {
    id: metadata.bookingId,
    serviceId: 'metadata',
    slotId: 'metadata',
    startsAt: metadata.startsAt,
    endsAt: metadata.endsAt ?? undefined,
    clientName:
      resolveNotificationClientName({
        full_name: clientNameInputForResolve(metadata.clientName),
        phone: metadata.clientPhone,
      }) ??
      clientNameInputForResolve(metadata.clientName) ??
      'Клиент',
    serviceTitle: metadata.serviceName?.trim() || 'Услуга',
    date,
    time,
    timeLabel: time,
    priceByn: metadata.servicePrice ?? 0,
    contact: metadata.clientPhone ?? undefined,
    status: dbStatusToUi(status),
    dbStatus: status,
    voucherNumber: metadata.bookingCode ?? null,
    durationMinutes: metadata.serviceDurationMinutes ?? undefined,
    bookingSource: metadata.source ?? null,
    addressShort: metadata.address ?? undefined,
  };
}

export function metadataToExtras(
  metadata: BookingNotificationMetadata,
): MasterNotificationBookingExtras {
  return {
    visitType: metadataVisitType(metadata.format),
    serviceCategory: metadata.serviceCategory ?? null,
    cancelReason: null,
  };
}

export function resolveNotificationBookingKeys(item: MeNotificationRow): {
  bookingCode: string | null;
  bookingId: string | null;
} {
  const meta = parseBookingNotificationMetadata(item.metadata);
  return {
    bookingCode: item.booking_code?.trim() || meta?.bookingCode?.trim() || null,
    bookingId: item.related_entity_id?.trim() || meta?.bookingId?.trim() || null,
  };
}

export type NotificationBookingDataSource = 'live' | 'metadata' | null;

export function resolveMetadataFallback(
  item: MeNotificationRow,
): { appointment: DemoMasterAppointment; extras: MasterNotificationBookingExtras } | null {
  const meta = parseBookingNotificationMetadata(item.metadata);
  if (!meta) return null;
  const appointment = metadataToDemoAppointment(meta);
  if (!appointment) return null;
  return { appointment, extras: metadataToExtras(meta) };
}
