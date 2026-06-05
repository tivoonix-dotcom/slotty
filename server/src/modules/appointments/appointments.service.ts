import type { PoolClient } from 'pg';
import { withTransaction, query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertMasterMonthlyAppointmentsAllowNew } from '../billing/billing.service.js';
import {
  applyPromotionToPrice,
  resolveActivePromotionForSlot,
} from '../service-extras/promotionSlots.service.js';
import { assertMasterAcceptsBookings } from '../profiles/profileAccount.service.js';
import { scheduleJobsAfterBookingCancelled } from '../notifications/notificationJobs.schedule.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';
import {
  assertBookingReferencePhotoOwnership,
} from './appointments.storage.js';
import { categorySupportsReferencePhoto } from './referencePhotoCategories.js';
import { sanitizeMasterLocationForViewer } from '../../lib/sanitizeMasterLocation.js';
import { normalizeBookingCode } from '../../lib/buildBookingLink.js';
import { resolveClientDisplayIdentity } from '../../lib/clientDisplayIdentity.js';
import {
  formatMasterName,
  formatServiceName,
} from '../../lib/displayFormat.js';
import {
  enrichClientAppointmentDetail,
  loadClientBookingMasterCard,
} from './appointments.clientDetailEnrich.js';
import { assertClientHasContact, loadClientContactSnapshot } from './bookingContact.js';
import { insertBookingEvent, listBookingEventsForAppointment } from './bookingEvents.service.js';
import { buildMasterAppointmentTimeline } from './bookingMasterTimeline.js';
import {
  masterCancelAppointmentLifecycle,
  masterClientArrivedLifecycle,
  masterConfirmAppointmentLifecycle,
  masterCloseOverdueAppointmentLifecycle,
  masterNoShowLifecycle,
  masterStartVisitLifecycle,
} from './appointments.lifecycle.js';
import {
  appointmentStatusLabel,
  DISPUTED_REVENUE_STATUS_SQL,
  EARNED_REVENUE_STATUS_SQL,
  EXPECTED_REVENUE_STATUS_SQL,
  HISTORY_TAB_SQL,
  statusHint,
  UPCOMING_TAB_SQL,
} from '../../lib/appointmentStatus.js';
import { buildMasterAppointmentActions } from '../../lib/masterAppointmentLifecycle.js';

type SlotRow = {
  id: string;
  master_id: string;
  service_id: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
};

export async function createAppointmentTx(input: {
  clientId: string;
  slotId: string;
  serviceId: string;
  clientNote?: string | null;
  clientReferencePhotoUrl?: string | null;
}) {
  return withTransaction(async (client: PoolClient) => {
    const slotRes = await client.query<SlotRow>(
      `select s.id, s.master_id, s.service_id, s.starts_at, s.ends_at, s.status::text
         from public.master_availability_slots s
        where s.id = $1
        for update`,
      [input.slotId],
    );
    const slot = slotRes.rows[0];
    if (!slot) {
      throw ApiError.notFound('Slot not found');
    }

    await assertMasterAcceptsBookings(slot.master_id);

    if (slot.status !== 'available') {
      throw ApiError.conflict('Slot is not available', 'SLOT_UNAVAILABLE');
    }

    const nowRow = await client.query<{ n: Date }>(`select now() as n`);
    const now = nowRow.rows[0]!.n;
    const slotStart = new Date(slot.starts_at as Date);
    if (slotStart <= now) {
      throw ApiError.conflict('Slot already started', 'SLOT_IN_PAST');
    }

    const { assertBookingNoticeAllowed } = await import('../masters/masterBookingRulesStructured.service.js');
    const { assertPlatformBookingLeadTime, computePendingExpiresAt } = await import(
      '../../lib/bookingConfirmationDeadlines.js'
    );
    try {
      assertPlatformBookingLeadTime(slotStart, now.getTime());
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'BOOKING_TOO_SOON') {
        throw ApiError.conflict(
          e instanceof Error ? e.message : 'Это время уже слишком близко. Выберите более позднее окно.',
          'BOOKING_TOO_SOON',
        );
      }
      throw e;
    }
    await assertBookingNoticeAllowed(slot.master_id, slotStart);
    const pendingExpiresAt = computePendingExpiresAt(now, slotStart);

    const svcRes = await client.query<{
      id: string;
      master_id: string;
      is_active: boolean;
      admin_hidden_at: Date | string | null;
      duration_minutes: number;
      price_amount: string;
      price_type: string;
      title: string;
      category_code: string | null;
    }>(
      `select ms.id, ms.master_id, ms.is_active, ms.admin_hidden_at, ms.duration_minutes, ms.price_amount::text, ms.price_type::text, ms.title,
              sc.code as category_code
         from public.master_services ms
         left join public.service_categories sc on sc.id = ms.category_id
        where ms.id = $1`,
      [input.serviceId],
    );
    const service = svcRes.rows[0];
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    if (!service.is_active || service.admin_hidden_at) {
      throw ApiError.conflict('Service inactive', 'SERVICE_INACTIVE');
    }
    if (service.master_id !== slot.master_id) {
      throw ApiError.conflict('Service does not belong to slot master', 'SERVICE_MASTER_MISMATCH');
    }
    if (slot.service_id != null && slot.service_id !== input.serviceId) {
      throw ApiError.conflict('Service does not match slot binding', 'SERVICE_SLOT_MISMATCH');
    }

    const slotEnd = new Date(slot.ends_at as Date);
    const apptEnd = new Date(slotStart.getTime() + service.duration_minutes * 60 * 1000);
    if (apptEnd > slotEnd) {
      throw ApiError.conflict('Service duration does not fit slot', 'SERVICE_DOES_NOT_FIT');
    }

    if (input.clientId === slot.master_id) {
      throw ApiError.conflict('Cannot book your own slot', 'SELF_BOOKING');
    }

    const referencePhotoUrl = input.clientReferencePhotoUrl?.trim() || null;
    if (referencePhotoUrl) {
      if (!categorySupportsReferencePhoto(service.category_code)) {
        throw ApiError.badRequest(
          'Reference photo is not supported for this service category',
          'REFERENCE_PHOTO_NOT_ALLOWED',
        );
      }
      assertBookingReferencePhotoOwnership(input.clientId, referencePhotoUrl);
    }

    const overlapMaster = await client.query(
      `select 1 from public.appointments a
        where a.master_id = $1
          and a.status in ('pending', 'confirmed', 'client_arrived', 'in_progress')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')`,
      [slot.master_id, slotStart.toISOString(), apptEnd.toISOString()],
    );
    if (overlapMaster.rowCount) {
      throw ApiError.conflict('Master has overlapping appointment', 'MASTER_OVERLAP');
    }

    const overlapClient = await client.query(
      `select 1 from public.appointments a
        where a.client_id = $1
          and a.status in ('pending', 'confirmed', 'client_arrived', 'in_progress')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')`,
      [input.clientId, slotStart.toISOString(), apptEnd.toISOString()],
    );
    if (overlapClient.rowCount) {
      throw ApiError.conflict('You already have an overlapping appointment', 'CLIENT_OVERLAP');
    }

    await assertMasterMonthlyAppointmentsAllowNew(client, slot.master_id);

    const basePrice = Number(service.price_amount);
    const activePromo = await resolveActivePromotionForSlot(
      client,
      input.slotId,
      slot.master_id,
      input.serviceId,
    );
    const priceSnapshot = activePromo
      ? String(
          applyPromotionToPrice(
            basePrice,
            activePromo.discount_type,
            Number(activePromo.discount_value),
          ),
        )
      : service.price_amount;

    const contactSnap = await loadClientContactSnapshot(input.clientId, client);
    assertClientHasContact(contactSnap);

    const insAppt = await client.query<{ id: string }>(
      `insert into public.appointments (
         client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
         price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot,
         client_note, client_reference_photo_url,
         client_name_snapshot, client_phone_snapshot, client_email_snapshot,
         client_telegram_username_snapshot, client_telegram_id_snapshot, booking_source,
         pending_expires_at
       ) values ($1, $2, $3, $4, $5, $6, 'pending', $7, $8::public.price_type, $9, $10, $11, $12,
         $13, $14, $15, $16, $17::bigint, $18, $19)
       returning id`,
      [
        input.clientId,
        slot.master_id,
        input.serviceId,
        input.slotId,
        slotStart.toISOString(),
        apptEnd.toISOString(),
        priceSnapshot,
        service.price_type,
        service.title,
        service.duration_minutes,
        input.clientNote ?? null,
        referencePhotoUrl,
        contactSnap.clientName,
        contactSnap.clientPhone,
        contactSnap.clientEmail,
        contactSnap.clientTelegramUsername,
        contactSnap.clientTelegramId,
        contactSnap.bookingSource,
        pendingExpiresAt.toISOString(),
      ],
    );
    const appointmentId = insAppt.rows[0]!.id;

    await insertBookingEvent({
      appointmentId,
      eventType: 'booking.created',
      newStatus: 'pending',
      actorUserId: input.clientId,
      actorRole: 'client',
    });

    await client.query(
      `update public.master_availability_slots set status = 'booked', updated_at = now() where id = $1`,
      [input.slotId],
    );

    // Уведомления клиенту и мастеру — после commit (полный текст с ваучером).

    const vRes = await client.query<{ n: string }>(
      `select 'SL-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)) as n`,
    );
    const voucherNumber = vRes.rows[0]!.n;

    await client.query(`insert into public.booking_vouchers (appointment_id, voucher_number) values ($1, $2)`, [
      appointmentId,
      voucherNumber,
    ]);

    const clientProfileRes = await client.query<{
      full_name: string;
      phone: string | null;
      telegram_username: string | null;
    }>(
      `select coalesce(full_name, '') as full_name, phone, telegram_username
         from public.profiles where id = $1`,
      [input.clientId],
    );
    const masterNameRes = await client.query<{ n: string }>(
      `select coalesce(nullif(trim(display_name), ''), 'Мастер') as n from public.master_profiles where master_id = $1`,
      [slot.master_id],
    );
    const clientRow = clientProfileRes.rows[0];
    const clientDisplayName = contactSnap.clientName;
    const clientPhone = clientRow?.phone?.trim() || null;
    const masterDisplayName = masterNameRes.rows[0]?.n ?? 'Мастер';

    return {
      appointmentId,
      clientId: input.clientId,
      masterId: slot.master_id,
      serviceTitle: service.title,
      startsAt: slotStart.toISOString(),
      endsAt: apptEnd.toISOString(),
      price: Number(service.price_amount),
      voucherNumber,
      clientDisplayName,
      clientPhone,
      masterDisplayName,
    };
  });
}

type ClientAppointmentRow = {
  id: string;
  master_id: string;
  service_id: string;
  slot_id: string;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  client_note: string | null;
  client_reference_photo_url: string | null;
  created_at: Date | string;
  master_display_name: string;
  location_visit_type: string | null;
  location_city: string | null;
  location_street: string | null;
  location_building: string | null;
  location_building_detail: string | null;
  location_public_address: string | null;
  location_entrance: string | null;
  location_floor: string | null;
  location_room: string | null;
  location_intercom: string | null;
  location_landmark: string | null;
  location_directions: string | null;
  location_client_note: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  location_show_exact_after_booking: boolean | null;
  voucher_number: string | null;
  has_review: boolean;
};

function mapClientAppointmentRow(row: ClientAppointmentRow, clientId: string) {
  const status = row.status;
  const loc =
    row.location_visit_type != null
      ? sanitizeMasterLocationForViewer(
          {
            visitType: row.location_visit_type,
            city: row.location_city ?? '',
            street: row.location_street ?? '',
            building: row.location_building ?? '',
            buildingDetail: row.location_building_detail,
            entrance: row.location_entrance,
            floor: row.location_floor,
            room: row.location_room,
            intercom: row.location_intercom,
            landmark: row.location_landmark,
            directions: row.location_directions,
            clientNote: row.location_client_note,
            publicAddress: row.location_public_address ?? '',
            lat: row.location_lat != null ? Number(row.location_lat) : null,
            lng: row.location_lng != null ? Number(row.location_lng) : null,
            showExactAddressAfterBooking: row.location_show_exact_after_booking === true,
          },
          {
            viewerProfileId: clientId,
            appointmentStatus: status,
          },
        )
      : null;

  return {
    id: row.id,
    master_id: row.master_id,
    service_id: row.service_id,
    slot_id: row.slot_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    price_snapshot: row.price_snapshot,
    service_title_snapshot: formatServiceName(row.service_title_snapshot),
    client_note: row.client_note,
    client_reference_photo_url: row.client_reference_photo_url,
    created_at: row.created_at,
    master_display_name: formatMasterName(row.master_display_name),
    location_visit_type: loc?.visitType ?? row.location_visit_type,
    location_city: loc?.city ?? row.location_city,
    location_street: loc?.street ?? row.location_street,
    location_building: loc?.building ?? row.location_building,
    location_public_address: loc?.publicAddress ?? row.location_public_address,
    location_lat: loc?.lat ?? null,
    location_lng: loc?.lng ?? null,
    voucher_number: row.voucher_number,
    has_review: row.has_review,
  };
}

const CLIENT_APPOINTMENTS_FROM = `
     from public.appointments a
     left join public.master_profiles mp on mp.master_id = a.master_id
     left join public.master_locations ml
       on ml.master_id = a.master_id
      and ml.is_primary = true
     left join public.booking_vouchers bv on bv.appointment_id = a.id`;

export type AppointmentsListTab = 'pending' | 'upcoming' | 'history' | 'active' | 'all';

export const MASTER_APPOINTMENTS_LIST_MAX = 200;

function appointmentsTabFilter(tab: AppointmentsListTab | undefined): string {
  switch (tab) {
    case 'pending':
      return `a.status = 'pending'`;
    case 'upcoming':
      return UPCOMING_TAB_SQL;
    case 'history':
      return HISTORY_TAB_SQL;
    case 'active':
      return `a.status in ('pending') or (${UPCOMING_TAB_SQL})`;
    default:
      return 'true';
  }
}

function appointmentsTabOrder(tab: AppointmentsListTab | undefined): string {
  switch (tab) {
    case 'upcoming':
    case 'active':
      return 'a.starts_at asc';
    default:
      return 'a.starts_at desc';
  }
}

export async function listClientAppointments(
  clientId: string,
  params?: { limit?: number; offset?: number },
) {
  const limit = Math.min(Math.max(params?.limit ?? 30, 1), 100);
  const offset = Math.max(params?.offset ?? 0, 0);

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.appointments a where a.client_id = $1`,
    [clientId],
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await query<ClientAppointmentRow>(
    `select
       a.id,
       a.master_id,
       a.service_id,
       a.slot_id,
       a.starts_at,
       a.ends_at,
       a.status::text as status,
       a.price_snapshot::text as price_snapshot,
       a.service_title_snapshot,
       a.client_note,
       a.client_reference_photo_url,
       a.created_at,
       coalesce(mp.display_name, 'Мастер') as master_display_name,
       ml.visit_type::text as location_visit_type,
       ml.city as location_city,
       ml.street as location_street,
       ml.building as location_building,
       ml.building_detail as location_building_detail,
       ml.public_address as location_public_address,
       ml.entrance as location_entrance,
       ml.floor as location_floor,
       ml.room as location_room,
       ml.intercom as location_intercom,
       ml.landmark as location_landmark,
       ml.directions as location_directions,
       ml.client_note as location_client_note,
       ml.lat as location_lat,
       ml.lng as location_lng,
       ml.show_exact_address_after_booking as location_show_exact_after_booking,
       bv.voucher_number,
       exists (select 1 from public.reviews rv where rv.appointment_id = a.id) as has_review
     ${CLIENT_APPOINTMENTS_FROM}
    where a.client_id = $1
    order by a.starts_at desc
    limit $2 offset $3`,
    [clientId, limit, offset],
  );

  const items = r.rows.map((row) => mapClientAppointmentRow(row, clientId));
  const hasMore = offset + items.length < total;
  return { items, appointments: items, total, limit, offset, hasMore };
}

export type MasterAppointmentStatsDto = {
  pending: number;
  upcoming: number;
  history: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  earnedTotal: number;
  expectedTotal: number;
  disputedTotal: number;
};

export async function getMasterAppointmentStats(masterId: string): Promise<MasterAppointmentStatsDto> {
  const r = await query<{
    pending: number;
    upcoming: number;
    history: number;
    completed_count: number;
    cancelled_count: number;
    no_show_count: number;
    earned_total: string;
    expected_total: string;
    disputed_total: string;
  }>(
    `select count(*) filter (where a.status = 'pending')::int as pending,
            count(*) filter (where ${UPCOMING_TAB_SQL})::int as upcoming,
            count(*) filter (where ${HISTORY_TAB_SQL})::int as history,
            count(*) filter (where a.status = 'completed')::int as completed_count,
            count(*) filter (
              where a.status in ('cancelled_by_client', 'cancelled_by_master', 'cancelled_by_admin')
            )::int as cancelled_count,
            count(*) filter (where a.status = 'no_show')::int as no_show_count,
            coalesce(sum(a.price_snapshot) filter (where ${EARNED_REVENUE_STATUS_SQL}), 0)::text as earned_total,
            coalesce(
              sum(a.price_snapshot) filter (where ${EXPECTED_REVENUE_STATUS_SQL} and a.ends_at >= now()),
              0
            )::text as expected_total,
            coalesce(sum(a.price_snapshot) filter (where ${DISPUTED_REVENUE_STATUS_SQL}), 0)::text as disputed_total
       from public.appointments a
      where a.master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  return {
    pending: row?.pending ?? 0,
    upcoming: row?.upcoming ?? 0,
    history: row?.history ?? 0,
    completedCount: row?.completed_count ?? 0,
    cancelledCount: row?.cancelled_count ?? 0,
    noShowCount: row?.no_show_count ?? 0,
    earnedTotal: Number(row?.earned_total ?? 0),
    expectedTotal: Number(row?.expected_total ?? 0),
    disputedTotal: Number(row?.disputed_total ?? 0),
  };
}

export type MasterAppointmentListItem = {
  id: string;
  client_id: string;
  service_id: string;
  slot_id: string;
  starts_at: Date | string;
  ends_at: Date | string;
  status: string;
  price_snapshot: string;
  service_title_snapshot: string;
  service_duration_snapshot: number | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_telegram_username: string | null;
  client_telegram_id: string | null;
  client_avatar_url: string | null;
  client_note: string | null;
  client_reference_photo_url: string | null;
  booking_source: string | null;
  cancel_reason: string | null;
  voucher_number: string | null;
  pending_expires_at: string | null;
};

export async function listMasterAppointments(
  masterId: string,
  params?: { limit?: number; offset?: number; tab?: AppointmentsListTab },
) {
  const limit = Math.min(Math.max(params?.limit ?? 30, 1), MASTER_APPOINTMENTS_LIST_MAX);
  const offset = Math.max(params?.offset ?? 0, 0);
  const tab = params?.tab ?? 'all';
  const tabFilter = appointmentsTabFilter(tab);
  const orderBy = appointmentsTabOrder(tab);

  const countR = await query<{ total: string }>(
    `select count(*)::text as total
       from public.appointments a
      where a.master_id = $1 and (${tabFilter})`,
    [masterId],
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const r = await query(
    `select a.id, a.client_id, a.service_id, a.slot_id, a.starts_at, a.ends_at, a.status::text,
            a.price_snapshot::text, a.service_title_snapshot,
            a.service_duration_snapshot, a.client_note,
            a.client_reference_photo_url, a.created_at,
            a.client_name_snapshot, a.client_phone_snapshot, a.client_email_snapshot,
            a.client_telegram_username_snapshot, a.client_telegram_id_snapshot::text,
            a.booking_source, a.cancel_reason, a.cancel_reason_category,
            a.pending_expires_at,
            nullif(trim(p.full_name), '') as profile_full_name,
            p.phone as profile_phone, p.telegram_username as profile_telegram,
            nullif(trim(p.avatar_url), '') as client_avatar_url,
            mp.display_name as master_display_name,
            mp.photo_url as master_photo_url,
            bv.voucher_number
       from public.appointments a
       left join public.profiles p on p.id = a.client_id
       left join public.master_profiles mp on mp.master_id = a.client_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id
      where a.master_id = $1 and (${tabFilter})
      order by ${orderBy}
      limit $2 offset $3`,
    [masterId, limit, offset],
  );
  const items: MasterAppointmentListItem[] = r.rows.map((row: Record<string, unknown>) => {
    const phone =
      (row.client_phone_snapshot as string | null)?.trim() ||
      (row.profile_phone as string | null)?.trim() ||
      null;
    const telegram =
      (row.client_telegram_username_snapshot as string | null)?.trim()?.replace(/^@+/, '') ||
      (row.profile_telegram as string | null)?.trim()?.replace(/^@+/, '') ||
      null;
    const email = (row.client_email_snapshot as string | null)?.trim() || null;

    const clientIdentity = resolveClientDisplayIdentity({
      masterDisplayName: row.master_display_name as string | null,
      masterPhotoUrl: row.master_photo_url as string | null,
      profileFullName: row.profile_full_name as string | null,
      profileAvatarUrl: row.client_avatar_url as string | null,
      nameSnapshot: row.client_name_snapshot as string | null,
      phone: row.profile_phone as string | null,
      phoneSnapshot: phone,
      telegramUsername: telegram,
    });

    return {
      id: String(row.id),
      client_id: String(row.client_id),
      service_id: String(row.service_id),
      slot_id: String(row.slot_id),
      starts_at: row.starts_at as Date | string,
      ends_at: row.ends_at as Date | string,
      status: String(row.status),
      price_snapshot: String(row.price_snapshot),
      service_title_snapshot: formatServiceName(String(row.service_title_snapshot ?? '')),
      service_duration_snapshot:
        row.service_duration_snapshot != null ? Number(row.service_duration_snapshot) : null,
      client_name: clientIdentity.displayName,
      client_phone: phone,
      client_email: email,
      client_telegram_username: telegram,
      client_telegram_id: (row.client_telegram_id_snapshot as string | null)?.trim() || null,
      client_avatar_url: clientIdentity.avatarUrl,
      client_note: (row.client_note as string | null)?.trim() || null,
      client_reference_photo_url: (row.client_reference_photo_url as string | null)?.trim() || null,
      booking_source: (row.booking_source as string | null)?.trim() || null,
      cancel_reason: (row.cancel_reason as string | null)?.trim() || null,
      voucher_number: (row.voucher_number as string | null) ?? null,
      pending_expires_at:
        row.pending_expires_at instanceof Date
          ? row.pending_expires_at.toISOString()
          : row.pending_expires_at
            ? String(row.pending_expires_at)
            : null,
    };
  });
  const hasMore = offset + items.length < total;
  return { items, appointments: items, total, limit, offset, hasMore };
}

function normalizeCancelReason(reason?: string | null): string | null {
  const t = reason?.trim();
  return t && t.length > 0 ? t.slice(0, 2000) : null;
}

export async function cancelClientAppointment(
  clientId: string,
  appointmentId: string,
  reason?: string | null,
  reasonCategory?: string | null,
): Promise<{ masterId: string }> {
  const r = await query<{ status: string; master_id: string; starts_at: Date | string }>(
    `select status::text, master_id, starts_at from public.appointments where id = $1 and client_id = $2`,
    [appointmentId, clientId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  const oldStatus = row.status;
  const cancelReason = normalizeCancelReason(reason);
  const { isLateCancellation } = await import('../masters/masterBookingRulesStructured.service.js');
  const late = await isLateCancellation(row.master_id, new Date(row.starts_at));
  const category =
    late && !reasonCategory?.trim()
      ? 'late_cancellation'
      : reasonCategory?.trim().slice(0, 64) || null;
  await query(
    `update public.appointments
        set status = 'cancelled_by_client',
            cancel_reason = $2,
            cancel_reason_category = $3,
            updated_at = now()
      where id = $1`,
    [appointmentId, cancelReason, category],
  );
  const { insertBookingEvent } = await import('./bookingEvents.service.js');
  await insertBookingEvent({
    appointmentId,
    eventType: 'booking.cancelled_by_client',
    oldStatus,
    newStatus: 'cancelled_by_client',
    actorUserId: clientId,
    actorRole: 'client',
    reason: cancelReason,
    comment: category,
  });
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  void notifyClientByAppointmentId(appointmentId, 'cancelled_by_self');
  void scheduleJobsAfterBookingCancelled(appointmentId);

  return { masterId: row.master_id };
}

export async function masterConfirmAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  return masterConfirmAppointmentLifecycle(masterId, appointmentId);
}

export async function masterClientArrivedAppointment(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  return masterClientArrivedLifecycle(masterId, appointmentId);
}

export async function masterStartAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  return masterStartVisitLifecycle(masterId, appointmentId);
}

export async function masterCompleteAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const { masterMarkServiceCompleted } = await import('./appointments.completion.service.js');
  return masterMarkServiceCompleted(masterId, appointmentId);
}

export async function masterMarkCompletedAppointment(
  masterId: string,
  appointmentId: string,
): Promise<{ clientId: string }> {
  const { masterMarkServiceCompleted } = await import('./appointments.completion.service.js');
  return masterMarkServiceCompleted(masterId, appointmentId);
}

export async function clientConfirmCompletedAppointment(
  clientId: string,
  appointmentId: string,
): Promise<{ masterId: string }> {
  const { clientConfirmServiceCompleted } = await import('./appointments.completion.service.js');
  return clientConfirmServiceCompleted(clientId, appointmentId);
}

export { createClientBookingDispute, createMasterBookingDispute } from './bookingDisputes.service.js';
export { clientBookingSignal } from './appointments.clientSignals.js';
export { addClientBookingComment } from './appointments.clientComment.js';

export async function masterCloseOverdueAppointment(
  masterId: string,
  appointmentId: string,
  reason?: string | null,
): Promise<{ clientId: string }> {
  return masterCloseOverdueAppointmentLifecycle(masterId, appointmentId, reason);
}

export async function masterReportNoShowAppointment(
  masterId: string,
  appointmentId: string,
  input: import('./appointments.noShowReport.service.js').MasterReportNoShowInput,
): Promise<{ ticketCode: string }> {
  const { masterReportNoShowToSupport } = await import('./appointments.noShowReport.service.js');
  return masterReportNoShowToSupport(masterId, appointmentId, input);
}

export async function masterNoShowAppointment(
  masterId: string,
  appointmentId: string,
  comment?: string | null,
): Promise<{ clientId: string }> {
  return masterNoShowLifecycle(masterId, appointmentId, comment);
}

export async function masterCancelAppointment(
  masterId: string,
  appointmentId: string,
  reason?: string | null,
  category?: string | null,
): Promise<{ clientId: string }> {
  const cancelReason = normalizeCancelReason(reason);
  if (!cancelReason) {
    throw ApiError.badRequest('Укажите причину отмены', 'CANCEL_REASON_REQUIRED');
  }
  return masterCancelAppointmentLifecycle(masterId, appointmentId, cancelReason, category);
}

type AppointmentVoucherMeta = {
  id: string;
  client_id: string;
  master_id: string;
};

async function findAppointmentMetaByVoucher(voucherNumber: string): Promise<AppointmentVoucherMeta | null> {
  const r = await query<AppointmentVoucherMeta>(
    `select a.id, a.client_id, a.master_id
       from public.booking_vouchers bv
       join public.appointments a on a.id = bv.appointment_id
      where bv.voucher_number = $1`,
    [voucherNumber],
  );
  return r.rows[0] ?? null;
}

function assertBookingAccess(
  meta: AppointmentVoucherMeta,
  viewerId: string,
  role: 'client' | 'master',
): void {
  const allowed = role === 'client' ? meta.client_id === viewerId : meta.master_id === viewerId;
  if (!allowed) {
    throw ApiError.forbidden(
      'У вас нет доступа к этой записи. Войдите в нужный аккаунт.',
      'BOOKING_FORBIDDEN',
    );
  }
}

/** Запись клиента по номеру SL-… (проверка client_id). */
export async function getClientAppointmentByVoucher(clientId: string, voucherRaw: string) {
  const voucherNumber = normalizeBookingCode(voucherRaw);
  const meta = await findAppointmentMetaByVoucher(voucherNumber);
  if (!meta) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  assertBookingAccess(meta, clientId, 'client');

  const r = await query<ClientAppointmentRow>(
    `select
       a.id,
       a.master_id,
       a.service_id,
       a.slot_id,
       a.starts_at,
       a.ends_at,
       a.status::text as status,
       a.price_snapshot::text as price_snapshot,
       a.service_title_snapshot,
       a.client_note,
       a.client_reference_photo_url,
       a.created_at,
       coalesce(mp.display_name, 'Мастер') as master_display_name,
       ml.visit_type::text as location_visit_type,
       ml.city as location_city,
       ml.street as location_street,
       ml.building as location_building,
       ml.building_detail as location_building_detail,
       ml.public_address as location_public_address,
       ml.entrance as location_entrance,
       ml.floor as location_floor,
       ml.room as location_room,
       ml.intercom as location_intercom,
       ml.landmark as location_landmark,
       ml.directions as location_directions,
       ml.client_note as location_client_note,
       ml.lat as location_lat,
       ml.lng as location_lng,
       ml.show_exact_address_after_booking as location_show_exact_after_booking,
       bv.voucher_number,
       exists (select 1 from public.reviews rv where rv.appointment_id = a.id) as has_review
     ${CLIENT_APPOINTMENTS_FROM}
    where a.id = $1`,
    [meta.id],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  const base = mapClientAppointmentRow(row, clientId);

  const metaR = await query<{
    master_marked_completed_at: Date | string | null;
    client_confirmed_completed_at: Date | string | null;
    completed_at: Date | string | null;
    auto_completed_at: Date | string | null;
    cancel_reason: string | null;
    cancel_reason_category: string | null;
    service_duration_snapshot: number | null;
  }>(
    `select master_marked_completed_at, client_confirmed_completed_at, completed_at, auto_completed_at,
            cancel_reason, cancel_reason_category, service_duration_snapshot
       from public.appointments where id = $1`,
    [meta.id],
  );
  const metaRow = metaR.rows[0];
  const { getOpenDisputeForAppointment } = await import('./bookingDisputes.service.js');
  const { canClientLeaveReview } = await import('../../lib/appointmentStatus.js');

  const events = await listBookingEventsForAppointment(meta.id, 40);
  const dispute = await getOpenDisputeForAppointment(meta.id);
  const openDispute = dispute && ['open', 'in_review'].includes(dispute.status);
  const masterCard = await loadClientBookingMasterCard(meta.master_id, row.status);
  const publicAddr =
    base.location_public_address?.trim() ||
    [base.location_city, base.location_street, base.location_building].filter(Boolean).join(', ') ||
    null;
  const hasCoords = base.location_lat != null && base.location_lng != null;

  const enriched = enrichClientAppointmentDetail({
    status: row.status,
    starts_at: base.starts_at,
    ends_at: base.ends_at,
    service_duration_snapshot: metaRow?.service_duration_snapshot ?? null,
    cancel_reason: metaRow?.cancel_reason ?? null,
    cancel_reason_category: metaRow?.cancel_reason_category ?? null,
    has_review: base.has_review,
    can_leave_review: canClientLeaveReview(row.status, Boolean(openDispute)),
    has_open_dispute: Boolean(openDispute),
    public_address: publicAddr,
    has_coords: hasCoords,
    events,
    master: masterCard,
  });

  return {
    ...base,
    status_label: appointmentStatusLabel(row.status),
    status_hint: statusHint(row.status),
    master_marked_completed_at: metaRow?.master_marked_completed_at
      ? new Date(metaRow.master_marked_completed_at).toISOString()
      : null,
    client_confirmed_completed_at: metaRow?.client_confirmed_completed_at
      ? new Date(metaRow.client_confirmed_completed_at).toISOString()
      : null,
    completed_at: metaRow?.completed_at ? new Date(metaRow.completed_at).toISOString() : null,
    auto_completed_at: metaRow?.auto_completed_at
      ? new Date(metaRow.auto_completed_at).toISOString()
      : null,
    can_leave_review: canClientLeaveReview(row.status, Boolean(openDispute)),
    dispute: dispute
      ? {
          id: dispute.id,
          reason: dispute.reason,
          comment: dispute.comment,
          status: dispute.status,
          createdByRole: dispute.created_by_role,
        }
      : null,
    ...enriched,
  };
}

async function loadClientStatsForMaster(clientId: string, masterId: string) {
  const r = await query<{
    total: number;
    cancelled_by_client: number;
    cancelled_by_master: number;
    no_shows: number;
  }>(
    `select count(*)::int as total,
            count(*) filter (where status = 'cancelled_by_client')::int as cancelled_by_client,
            count(*) filter (where status = 'cancelled_by_master')::int as cancelled_by_master,
            count(*) filter (where status = 'no_show')::int as no_shows
       from public.appointments
      where client_id = $1 and master_id = $2`,
    [clientId, masterId],
  );
  const row = r.rows[0];
  const total = row?.total ?? 0;
  return {
    totalBookings: total,
    cancellationsByClient: row?.cancelled_by_client ?? 0,
    cancellationsByMaster: row?.cancelled_by_master ?? 0,
    noShows: row?.no_shows ?? 0,
    isFirstTime: total <= 1,
  };
}

/** Запись мастера по id (проверка master_id). */
export async function getMasterAppointmentById(masterId: string, appointmentId: string) {
  const access = await query<{ id: string }>(
    `select id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  if (!access.rows[0]) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  return loadMasterAppointmentDetail(masterId, appointmentId);
}

/** Запись мастера по номеру SL-… (проверка master_id). */
export async function getMasterAppointmentByVoucher(masterId: string, voucherRaw: string) {
  const voucherNumber = normalizeBookingCode(voucherRaw);
  const meta = await findAppointmentMetaByVoucher(voucherNumber);
  if (!meta) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }
  assertBookingAccess(meta, masterId, 'master');
  return loadMasterAppointmentDetail(masterId, meta.id);
}

async function loadMasterAppointmentDetail(masterId: string, appointmentId: string) {
  const r = await query<{
    id: string;
    client_id: string;
    service_id: string;
    slot_id: string;
    starts_at: Date | string;
    ends_at: Date | string;
    status: string;
    price_snapshot: string;
    service_title_snapshot: string;
    service_duration_snapshot: number | null;
    client_note: string | null;
    client_reference_photo_url: string | null;
    created_at: Date | string;
    full_name: string;
    phone: string | null;
    telegram_username: string | null;
    client_avatar_url: string | null;
    master_display_name: string | null;
    master_photo_url: string | null;
    voucher_number: string | null;
    client_name_snapshot: string | null;
    client_phone_snapshot: string | null;
    client_email_snapshot: string | null;
    client_telegram_username_snapshot: string | null;
    client_telegram_id_snapshot: string | null;
    booking_source: string | null;
    cancel_reason: string | null;
    cancel_reason_category: string | null;
    location_visit_type: string | null;
    location_public_address: string | null;
    service_category_name: string | null;
    pending_expires_at: Date | string | null;
  }>(
    `select a.id, a.client_id, a.service_id, a.slot_id, a.starts_at, a.ends_at, a.status::text,
            a.price_snapshot::text, a.service_title_snapshot, a.service_duration_snapshot,
            a.client_note, a.client_reference_photo_url, a.created_at,
            a.client_name_snapshot, a.client_phone_snapshot, a.client_email_snapshot,
            a.client_telegram_username_snapshot, a.client_telegram_id_snapshot::text,
            a.booking_source, a.cancel_reason, a.cancel_reason_category,
            a.pending_expires_at,
            coalesce(p.full_name, '') as full_name, p.phone, p.telegram_username,
            nullif(trim(p.avatar_url), '') as client_avatar_url,
            mp.display_name as master_display_name,
            mp.photo_url as master_photo_url,
            bv.voucher_number,
            ml.visit_type::text as location_visit_type,
            ml.public_address as location_public_address,
            sc.name as service_category_name
       from public.appointments a
       left join public.profiles p on p.id = a.client_id
       left join public.master_profiles mp on mp.master_id = a.client_id
       left join public.booking_vouchers bv on bv.appointment_id = a.id
       left join public.master_locations ml on ml.master_id = a.master_id and ml.is_primary = true
       left join public.master_services ms on ms.id = a.service_id
       left join public.service_categories sc on sc.id = ms.category_id
      where a.id = $1 and a.master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Запись не найдена', 'BOOKING_NOT_FOUND');
  }

  const startsAt =
    row.starts_at instanceof Date ? row.starts_at.toISOString() : String(row.starts_at);
  const endsAt = row.ends_at instanceof Date ? row.ends_at.toISOString() : String(row.ends_at);

  const clientPhone =
    row.client_phone_snapshot?.trim() || row.phone?.trim() || null;
  const clientTelegram =
    row.client_telegram_username_snapshot?.trim()?.replace(/^@+/, '') ||
    row.telegram_username?.trim()?.replace(/^@+/, '') ||
    null;
  const clientIdentity = resolveClientDisplayIdentity({
    masterDisplayName: row.master_display_name,
    masterPhotoUrl: row.master_photo_url,
    profileFullName: row.full_name,
    profileAvatarUrl: row.client_avatar_url,
    nameSnapshot: row.client_name_snapshot,
    phone: row.phone,
    phoneSnapshot: clientPhone,
    telegramUsername: clientTelegram,
  });
  const clientName = clientIdentity.displayName;

  const events = await listBookingEventsForAppointment(appointmentId, 30);
  const clientStats = await loadClientStatsForMaster(row.client_id, masterId);
  const { deriveClientSignalSummary } = await import('../../lib/bookingClientDetail.js');
  const clientSignal = deriveClientSignalSummary(events);

  const lifecycleUpcoming = buildMasterAppointmentActions(
    {
      status: row.status,
      startsAt: startsAt,
      endsAt: endsAt,
      hasClientOnSiteSignal: clientSignal?.kind === 'reported_arrived' || row.status === 'client_arrived',
    },
    new Date(),
    undefined,
    'upcoming',
  );
  const lifecycleHistory = buildMasterAppointmentActions(
    {
      status: row.status,
      startsAt: startsAt,
      endsAt: endsAt,
      hasClientOnSiteSignal: clientSignal?.kind === 'reported_arrived' || row.status === 'client_arrived',
    },
    new Date(),
    undefined,
    'history',
  );

  return {
    id: row.id,
    client_id: row.client_id,
    service_id: row.service_id,
    slot_id: row.slot_id,
    starts_at: startsAt,
    ends_at: endsAt,
    status: row.status,
    status_label: appointmentStatusLabel(row.status),
    status_hint: statusHint(row.status),
    price_snapshot: row.price_snapshot,
    service_title_snapshot: formatServiceName(row.service_title_snapshot),
    service_duration_snapshot: row.service_duration_snapshot,
    service_category_name: row.service_category_name,
    client_note: row.client_note,
    client_reference_photo_url: row.client_reference_photo_url,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    client_name: clientName,
    client_phone: clientPhone,
    client_email: row.client_email_snapshot?.trim() || null,
    client_telegram_username: clientTelegram,
    client_telegram_id: row.client_telegram_id_snapshot?.trim() || null,
    booking_source: row.booking_source,
    cancel_reason: row.cancel_reason,
    cancel_reason_category: row.cancel_reason_category,
    client_avatar_url: clientIdentity.avatarUrl,
    voucher_number: row.voucher_number,
    visit_type: row.location_visit_type,
    location_public_address: row.location_public_address,
    client_stats: clientStats,
    client_signal: clientSignal,
    timeline: buildMasterAppointmentTimeline(events),
    lifecycle: lifecycleUpcoming,
    lifecycle_history: lifecycleHistory,
    pending_expires_at: row.pending_expires_at
      ? row.pending_expires_at instanceof Date
        ? row.pending_expires_at.toISOString()
        : String(row.pending_expires_at)
      : null,
  };
}
