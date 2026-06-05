import { query } from '../../config/db.js';
import { resolveClientDisplayIdentity } from '../../lib/clientDisplayIdentity.js';
import { formatServiceName } from '../../lib/displayFormat.js';
import {
  buildBookingNotificationMetadata,
  type BookingNotificationMetadata,
  type BookingNotificationSnapshotRow,
} from '../notifications/bookingNotificationMetadata.js';

export async function fetchBookingNotificationSnapshot(
  appointmentId: string,
): Promise<BookingNotificationSnapshotRow | null> {
  const r = await query<{
    appointment_id: string;
    voucher_number: string | null;
    client_name_snapshot: string | null;
    client_phone_snapshot: string | null;
    full_name: string;
    phone: string | null;
    telegram_username: string | null;
    avatar_url: string | null;
    master_display_name: string | null;
    master_photo_url: string | null;
    service_title_snapshot: string;
    service_category: string | null;
    price_snapshot: string;
    service_duration_snapshot: number | null;
    starts_at: Date | string;
    ends_at: Date | string;
    public_address: string | null;
    visit_type: string | null;
    status: string;
    booking_source: string | null;
  }>(
    `select a.id as appointment_id,
            bv.voucher_number,
            a.client_name_snapshot,
            a.client_phone_snapshot,
            coalesce(pc.full_name, '') as full_name,
            pc.phone,
            pc.telegram_username,
            pc.avatar_url,
            mp.display_name as master_display_name,
            mp.photo_url as master_photo_url,
            a.service_title_snapshot,
            sc.name as service_category,
            a.price_snapshot::text,
            a.service_duration_snapshot,
            a.starts_at,
            a.ends_at,
            ml.public_address,
            ml.visit_type::text as visit_type,
            a.status::text as status,
            a.booking_source
       from public.appointments a
       left join public.profiles pc on pc.id = a.client_id
       left join public.master_profiles mp on mp.master_id = a.client_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id
       left join public.master_locations ml on ml.master_id = a.master_id and ml.is_primary = true
       left join public.master_services ms on ms.id = a.service_id
       left join public.service_categories sc on sc.id = ms.category_id
      where a.id = $1`,
    [appointmentId],
  );

  const row = r.rows[0];
  if (!row) return null;

  const clientIdentity = resolveClientDisplayIdentity({
    masterDisplayName: row.master_display_name,
    masterPhotoUrl: row.master_photo_url,
    profileFullName: row.full_name,
    profileAvatarUrl: row.avatar_url,
    nameSnapshot: row.client_name_snapshot,
    phone: row.phone,
    phoneSnapshot: row.client_phone_snapshot,
    telegramUsername: row.telegram_username,
  });
  const clientName = clientIdentity.displayName;

  return {
    appointment_id: row.appointment_id,
    voucher_number: row.voucher_number,
    client_name: clientName,
    client_phone: row.client_phone_snapshot?.trim() || row.phone?.trim() || null,
    service_title: formatServiceName(row.service_title_snapshot),
    service_category: row.service_category?.trim() || null,
    price_snapshot: row.price_snapshot,
    service_duration_snapshot: row.service_duration_snapshot,
    starts_at:
      row.starts_at instanceof Date ? row.starts_at.toISOString() : String(row.starts_at),
    ends_at: row.ends_at instanceof Date ? row.ends_at.toISOString() : String(row.ends_at),
    public_address: row.public_address?.trim() || null,
    visit_type: row.visit_type,
    status: row.status,
    booking_source: row.booking_source?.trim() || null,
  };
}

export async function buildBookingNotificationMetadataForAppointment(
  appointmentId: string,
): Promise<BookingNotificationMetadata | null> {
  const row = await fetchBookingNotificationSnapshot(appointmentId);
  if (!row) return null;
  return buildBookingNotificationMetadata(row);
}
