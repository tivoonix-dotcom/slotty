/** Snapshot booking-полей для in-app уведомления (синхронно с frontend). */
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
  /** Поля отзыва (уведомление «Новый отзыв»). */
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewBody?: string | null;
  /** false — мастер уже ответил на отзыв (уведомление без действия). */
  needsMasterReply?: boolean | null;
};

export type BookingNotificationSnapshotRow = {
  appointment_id: string;
  voucher_number: string | null;
  client_name: string;
  client_phone: string | null;
  service_title: string;
  service_category: string | null;
  price_snapshot: string;
  service_duration_snapshot: number | null;
  starts_at: string;
  ends_at: string;
  public_address: string | null;
  visit_type: string | null;
  status: string;
  booking_source: string | null;
};

export function visitTypeToNotificationFormat(
  visitType: string | null | undefined,
): BookingNotificationFormat {
  if (visitType === 'at_home') return 'home';
  if (visitType === 'studio') return 'salon';
  if (visitType === 'online') return 'online';
  return 'other';
}

export function buildBookingNotificationMetadata(
  row: BookingNotificationSnapshotRow,
): BookingNotificationMetadata {
  const price = Number(row.price_snapshot);
  return {
    bookingId: row.appointment_id,
    bookingCode: row.voucher_number,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    serviceName: row.service_title,
    serviceCategory: row.service_category,
    servicePrice: Number.isFinite(price) ? price : null,
    serviceDurationMinutes: row.service_duration_snapshot,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    address: row.public_address,
    format: visitTypeToNotificationFormat(row.visit_type),
    bookingStatus: row.status,
    source: row.booking_source,
  };
}

export function parseBookingNotificationMetadata(raw: unknown): BookingNotificationMetadata | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const bookingId = typeof o.bookingId === 'string' ? o.bookingId.trim() : '';
  if (!bookingId) return null;

  const num = (key: string): number | null | undefined => {
    const v = o[key];
    if (v == null) return null;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
    return undefined;
  };

  const str = (key: string): string | null | undefined => {
    const v = o[key];
    if (v == null) return null;
    return typeof v === 'string' ? v : undefined;
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
