import type { PoolClient } from 'pg';
import { withTransaction, query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertMasterMonthlyAppointmentsAllowNew } from '../billing/billing.service.js';
import {
  applyPromotionToPrice,
  resolveActivePromotionForSlot,
} from '../service-extras/promotionSlots.service.js';
import { notifyClientByAppointmentId } from './appointments.clientNotifications.js';

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

    const pub = await client.query(
      `select 1 from public.master_profiles mp
        where mp.master_id = $1 and mp.publication_status = 'published'`,
      [slot.master_id],
    );
    if (!pub.rowCount) {
      throw ApiError.conflict('Master is not published', 'MASTER_NOT_PUBLISHED');
    }

    if (slot.status !== 'available') {
      throw ApiError.conflict('Slot is not available', 'SLOT_UNAVAILABLE');
    }

    const nowRow = await client.query<{ n: Date }>(`select now() as n`);
    const now = nowRow.rows[0]!.n;
    const slotStart = new Date(slot.starts_at as Date);
    if (slotStart <= now) {
      throw ApiError.conflict('Slot already started', 'SLOT_IN_PAST');
    }

    const svcRes = await client.query<{
      id: string;
      master_id: string;
      is_active: boolean;
      duration_minutes: number;
      price_amount: string;
      price_type: string;
      title: string;
    }>(
      `select id, master_id, is_active, duration_minutes, price_amount::text, price_type::text, title
         from public.master_services
        where id = $1`,
      [input.serviceId],
    );
    const service = svcRes.rows[0];
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    if (!service.is_active) {
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

    const overlapMaster = await client.query(
      `select 1 from public.appointments a
        where a.master_id = $1
          and a.status in ('pending', 'confirmed')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')`,
      [slot.master_id, slotStart.toISOString(), apptEnd.toISOString()],
    );
    if (overlapMaster.rowCount) {
      throw ApiError.conflict('Master has overlapping appointment', 'MASTER_OVERLAP');
    }

    const overlapClient = await client.query(
      `select 1 from public.appointments a
        where a.client_id = $1
          and a.status in ('pending', 'confirmed')
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

    const insAppt = await client.query<{ id: string }>(
      `insert into public.appointments (
         client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
         price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot, client_note
       ) values ($1, $2, $3, $4, $5, $6, 'pending', $7, $8::public.price_type, $9, $10, $11)
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
      ],
    );
    const appointmentId = insAppt.rows[0]!.id;

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

    const clientNameRes = await client.query<{ n: string }>(
      `select coalesce(nullif(trim(full_name), ''), 'Клиент') as n from public.profiles where id = $1`,
      [input.clientId],
    );
    const masterNameRes = await client.query<{ n: string }>(
      `select coalesce(nullif(trim(display_name), ''), 'Мастер') as n from public.master_profiles where master_id = $1`,
      [slot.master_id],
    );
    const clientDisplayName = clientNameRes.rows[0]?.n ?? 'Клиент';
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
      masterDisplayName,
    };
  });
}

export async function listClientAppointments(clientId: string) {
  const r = await query(
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
       a.created_at,
       coalesce(mp.display_name, 'Мастер') as master_display_name,
       ml.visit_type::text as location_visit_type,
       ml.city as location_city,
       ml.street as location_street,
       ml.building as location_building,
       ml.public_address as location_public_address,
       ml.lat as location_lat,
       ml.lng as location_lng,
       bv.voucher_number
     from public.appointments a
     left join public.master_profiles mp on mp.master_id = a.master_id
     left join public.master_locations ml
       on ml.master_id = a.master_id
      and ml.is_primary = true
     left join public.booking_vouchers bv on bv.appointment_id = a.id
    where a.client_id = $1
    order by a.starts_at desc`,
    [clientId],
  );
  return r.rows;
}

export async function listMasterAppointments(masterId: string) {
  const r = await query(
    `select a.id, a.client_id, a.service_id, a.slot_id, a.starts_at, a.ends_at, a.status::text,
            a.price_snapshot::text, a.service_title_snapshot, a.client_note, a.created_at,
            coalesce(nullif(trim(p.full_name), ''), 'Клиент') as client_name,
            nullif(trim(p.phone), '') as client_phone
       from public.appointments a
       left join public.profiles p on p.id = a.client_id
      where a.master_id = $1
      order by a.starts_at desc`,
    [masterId],
  );
  return r.rows;
}

export async function cancelClientAppointment(clientId: string, appointmentId: string): Promise<{ masterId: string }> {
  const r = await query<{ status: string; master_id: string }>(
    `select status::text, master_id from public.appointments where id = $1 and client_id = $2`,
    [appointmentId, clientId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  await query(
    `update public.appointments set status = 'cancelled_by_client', updated_at = now() where id = $1`,
    [appointmentId],
  );
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  void notifyClientByAppointmentId(appointmentId, 'cancelled_by_self');

  return { masterId: row.master_id };
}

export async function masterConfirmAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending') {
    throw ApiError.conflict('Only pending appointments can be confirmed', 'BAD_STATUS');
  }
  await query(`update public.appointments set status = 'confirmed', updated_at = now() where id = $1`, [
    appointmentId,
  ]);

  void notifyClientByAppointmentId(appointmentId, 'confirmed');

  return { clientId: row.client_id };
}

export async function masterCompleteAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'confirmed') {
    throw ApiError.conflict('Only confirmed appointments can be completed', 'BAD_STATUS');
  }
  await query(`update public.appointments set status = 'completed', updated_at = now() where id = $1`, [
    appointmentId,
  ]);

  void notifyClientByAppointmentId(appointmentId, 'completed');

  return { clientId: row.client_id };
}

export async function masterCancelAppointment(masterId: string, appointmentId: string): Promise<{ clientId: string }> {
  const r = await query<{ status: string; client_id: string }>(
    `select status::text, client_id from public.appointments where id = $1 and master_id = $2`,
    [appointmentId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Appointment not found');
  }
  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw ApiError.conflict('Appointment cannot be cancelled', 'BAD_STATUS');
  }
  await query(
    `update public.appointments set status = 'cancelled_by_master', updated_at = now() where id = $1`,
    [appointmentId],
  );
  await query(
    `update public.master_availability_slots s
        set status = 'available', updated_at = now()
      from public.appointments a
      where a.id = $1 and s.id = a.slot_id and s.status = 'booked'`,
    [appointmentId],
  );

  void notifyClientByAppointmentId(appointmentId, 'cancelled_by_master');

  return { clientId: row.client_id };
}
