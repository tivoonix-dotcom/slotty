import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertSlotWithinPlanHorizon } from '../billing/billing.service.js';

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const MAX_SLOT_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

async function assertSlotNoOverlap(
  masterId: string,
  startsAt: Date,
  endsAt: Date,
  excludeSlotId: string | null,
): Promise<void> {
  const ex = await query(
    `select 1 from public.master_availability_slots s
      where s.master_id = $1
        and s.status = 'available'
        and ($4::uuid is null or s.id <> $4::uuid)
        and tstzrange(s.starts_at, s.ends_at, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
      limit 1`,
    [masterId, startsAt.toISOString(), endsAt.toISOString(), excludeSlotId],
  );
  if (ex.rowCount) {
    throw ApiError.conflict('Пересечение с другим свободным окном', 'SLOT_OVERLAP');
  }
}

export async function listPublicSlots(filters: {
  masterId?: string;
  serviceId?: string;
  category?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const params: unknown[] = [];
  let i = 1;
  let where = `
    s.status = 'available'
    and s.starts_at > now()
    and mp.publication_status = 'published'
    and exists (
      select 1 from public.master_services msz
      where msz.master_id = s.master_id and msz.is_active = true
    )
  `;
  if (filters.masterId) {
    where += ` and s.master_id = $${i++}`;
    params.push(filters.masterId);
  }
  if (filters.serviceId) {
    where += ` and (
      (s.service_id is null or s.service_id = $${i})
      and exists (
        select 1 from public.master_services ms
        where ms.id = $${i}
          and ms.master_id = s.master_id
          and ms.is_active = true
      )
    )`;
    params.push(filters.serviceId);
    i++;
  }
  if (filters.category) {
    where += ` and exists (
      select 1 from public.service_categories sc
      where sc.id = mp.primary_category_id and sc.code = $${i++}
    )`;
    params.push(filters.category);
  }
  if (filters.from) {
    where += ` and s.starts_at >= $${i++}`;
    params.push(filters.from);
  }
  if (filters.to) {
    where += ` and s.starts_at < $${i++}`;
    params.push(filters.to);
  }

  const lim = Math.min(Math.max(filters.limit ?? 500, 1), 500);
  params.push(lim);
  const limIdx = i;

  const sql = `
    select
      s.id,
      s.master_id,
      s.service_id,
      s.starts_at,
      s.ends_at,
      s.status::text as status,
      s.source::text as source,
      mp.display_name as master_display_name,
      coalesce(ms.title, psvc.title) as service_title,
      coalesce(ms.price_amount, psvc.price_amount)::text as service_price,
      coalesce(s.service_id, psvc.id) as booking_service_id
    from public.master_availability_slots s
    join public.master_profiles mp on mp.master_id = s.master_id
    left join public.master_services ms on ms.id = s.service_id and ms.master_id = s.master_id
    left join lateral (
      select ms2.id, ms2.title, ms2.price_amount
      from public.master_services ms2
      where ms2.master_id = s.master_id and ms2.is_active = true
      order by ms2.sort_order asc, ms2.price_amount asc nulls last, ms2.title asc
      limit 1
    ) psvc on true
    where ${where}
    order by s.starts_at asc
    limit $${limIdx}
  `;
  const r = await query<{
    id: string;
    master_id: string;
    service_id: string | null;
    starts_at: Date | string;
    ends_at: Date | string;
    status: string;
    source: string;
    master_display_name: string;
    service_title: string | null;
    service_price: string | null;
    booking_service_id: string;
  }>(sql, params);
  return r.rows.map((row) => ({
    id: row.id,
    masterId: row.master_id,
    serviceId: row.service_id,
    bookingServiceId: row.booking_service_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    source: row.source,
    masterDisplayName: row.master_display_name,
    serviceTitle: row.service_title ?? 'Услуга',
    servicePrice: num(row.service_price) ?? 0,
  }));
}

export async function listMySlots(masterId: string) {
  const r = await query(
    `select id, master_id, service_id, starts_at, ends_at, status::text, source::text, created_at
       from public.master_availability_slots
      where master_id = $1
      order by starts_at desc`,
    [masterId],
  );
  return r.rows;
}

export async function createMySlot(
  masterId: string,
  body: { startsAt: Date; endsAt: Date; serviceId?: string | null },
) {
  if (body.endsAt <= body.startsAt) {
    throw ApiError.badRequest('endsAt must be after startsAt', 'BAD_SLOT_RANGE');
  }
  const now = new Date();
  if (body.startsAt < now) {
    throw ApiError.badRequest('Окно не может начинаться в прошлом', 'SLOT_IN_PAST');
  }
  await assertSlotWithinPlanHorizon(masterId, body.startsAt);
  if (body.endsAt.getTime() - body.startsAt.getTime() > MAX_SLOT_DURATION_MS) {
    throw ApiError.badRequest('Слишком длинный интервал окна', 'SLOT_TOO_LONG');
  }
  if (body.serviceId) {
    const s = await query(`select 1 from public.master_services where id = $1 and master_id = $2 and is_active = true`, [
      body.serviceId,
      masterId,
    ]);
    if (!s.rowCount) {
      throw ApiError.badRequest('Invalid service for this master', 'BAD_SERVICE');
    }
  }

  await assertSlotNoOverlap(masterId, body.startsAt, body.endsAt, null);

  const ins = await query<{ id: string }>(
    `insert into public.master_availability_slots (master_id, starts_at, ends_at, service_id, status, source)
     values ($1, $2, $3, $4, 'available', 'manual')
     returning id`,
    [masterId, body.startsAt, body.endsAt, body.serviceId ?? null],
  );
  return getMySlot(masterId, ins.rows[0]!.id);
}

export async function getMySlot(masterId: string, slotId: string) {
  const r = await query(
    `select id, master_id, service_id, starts_at, ends_at, status::text, source::text, created_at
       from public.master_availability_slots
      where id = $1 and master_id = $2`,
    [slotId, masterId],
  );
  const row = r.rows[0];
  if (!row) {
    throw ApiError.notFound('Slot not found');
  }
  return row;
}

export async function patchMySlot(
  masterId: string,
  slotId: string,
  patch: { startsAt?: Date; endsAt?: Date; serviceId?: string | null },
) {
  const cur = await getMySlot(masterId, slotId);
  if (cur.status !== 'available') {
    throw ApiError.conflict('Only available slots can be edited', 'SLOT_NOT_AVAILABLE');
  }
  const starts = patch.startsAt ?? (cur.starts_at as Date);
  const ends = patch.endsAt ?? (cur.ends_at as Date);
  const now = new Date();
  if (ends <= starts) {
    throw ApiError.badRequest('endsAt must be after startsAt', 'BAD_SLOT_RANGE');
  }
  if (starts < now) {
    throw ApiError.badRequest('Окно не может начинаться в прошлом', 'SLOT_IN_PAST');
  }
  await assertSlotWithinPlanHorizon(masterId, starts);
  if (ends.getTime() - starts.getTime() > MAX_SLOT_DURATION_MS) {
    throw ApiError.badRequest('Слишком длинный интервал окна', 'SLOT_TOO_LONG');
  }
  const serviceId =
    patch.serviceId !== undefined ? patch.serviceId : (cur.service_id as string | null);
  if (serviceId) {
    const s = await query(`select 1 from public.master_services where id = $1 and master_id = $2 and is_active = true`, [
      serviceId,
      masterId,
    ]);
    if (!s.rowCount) {
      throw ApiError.badRequest('Invalid service for this master', 'BAD_SERVICE');
    }
  }

  await assertSlotNoOverlap(masterId, starts, ends, slotId);

  await query(
    `update public.master_availability_slots
        set starts_at = $1, ends_at = $2, service_id = $3, updated_at = now()
      where id = $4 and master_id = $5`,
    [starts, ends, serviceId, slotId, masterId],
  );
  return getMySlot(masterId, slotId);
}

export async function deleteMySlot(masterId: string, slotId: string) {
  const cur = await getMySlot(masterId, slotId);
  if (cur.status !== 'available') {
    throw ApiError.conflict('Only available slots can be deleted', 'SLOT_NOT_AVAILABLE');
  }
  const ap = await query(`select 1 from public.appointments where slot_id = $1`, [slotId]);
  if (ap.rowCount) {
    throw ApiError.conflict('Slot has an appointment', 'SLOT_HAS_APPOINTMENT');
  }
  await query(`delete from public.master_availability_slots where id = $1 and master_id = $2`, [slotId, masterId]);
}
