import type { PoolClient } from 'pg';
import { query } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export type ActivePromotionRow = {
  id: string;
  template: string;
  title: string;
  discount_type: string;
  discount_value: string;
  discount_label: string;
};

const ACTIVE_PROMO_STATUSES = ['active', 'scheduled'] as const;

export function isPromotionActiveOnDate(
  status: string,
  startsAt: string,
  endsAt: string,
  dayKey: string,
): boolean {
  if (!ACTIVE_PROMO_STATUSES.includes(status as (typeof ACTIVE_PROMO_STATUSES)[number])) {
    return false;
  }
  const day = dayKey.slice(0, 10);
  return day >= startsAt.slice(0, 10) && day <= endsAt.slice(0, 10);
}

export function applyPromotionToPrice(
  basePrice: number,
  discountType: string,
  discountValue: number,
): number {
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
  if (discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, discountValue));
    return Math.round(basePrice * (1 - pct / 100) * 100) / 100;
  }
  if (discountType === 'money') {
    return Math.max(0, Math.round((basePrice - discountValue) * 100) / 100);
  }
  if (discountType === 'gift') {
    return 0;
  }
  return basePrice;
}

export function mapPromotionFields(row: ActivePromotionRow | undefined, basePrice: number) {
  if (!row) return null;
  const discountValue = Number(row.discount_value);
  const discountedPrice = applyPromotionToPrice(basePrice, row.discount_type, discountValue);
  return {
    promotionId: row.id,
    promotionTemplate: row.template,
    promotionTitle: row.title,
    discountType: row.discount_type,
    discountValue,
    discountLabel: row.discount_label,
    originalPrice: basePrice,
    discountedPrice,
  };
}

export async function listSlotIdsWithActivePromotion(masterId: string): Promise<Set<string>> {
  const r = await query<{ slot_id: string }>(
    `select ps.slot_id
       from public.master_service_promotion_slots ps
       join public.master_service_promotions p on p.id = ps.promotion_id
      where ps.master_id = $1
        and p.status in ('active', 'scheduled')
        and p.ends_at >= current_date`,
    [masterId],
  );
  return new Set(r.rows.map((row) => row.slot_id));
}

export async function listServiceWidePromotionCoverage(
  masterId: string,
): Promise<{ service_id: string; starts_at: string; ends_at: string }[]> {
  const r = await query<{ service_id: string; starts_at: string; ends_at: string }>(
    `select p.service_id, p.starts_at::text, p.ends_at::text
       from public.master_service_promotions p
      where p.master_id = $1
        and p.status in ('active', 'scheduled')
        and p.ends_at >= current_date
        and not exists (
          select 1 from public.master_service_promotion_slots ps where ps.promotion_id = p.id
        )`,
    [masterId],
  );
  return r.rows;
}

type SlotValidateRow = {
  id: string;
  master_id: string;
  service_id: string | null;
  starts_at: Date;
  ends_at: Date;
  status: string;
};

export async function assertAndBindPromotionSlots(
  client: PoolClient,
  masterId: string,
  promotionId: string,
  serviceId: string,
  slotIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(slotIds)];
  if (!uniqueIds.length) {
    throw ApiError.badRequest('Укажите хотя бы одно окно', 'SLOT_IDS_REQUIRED');
  }
  if (uniqueIds.length > 48) {
    throw ApiError.badRequest('Слишком много окон в одной акции', 'TOO_MANY_SLOTS');
  }

  const slotsRes = await client.query<SlotValidateRow>(
    `select s.id, s.master_id, s.service_id, s.starts_at, s.ends_at, s.status::text as status
       from public.master_availability_slots s
      where s.id = any($1::uuid[])
      for update`,
    [uniqueIds],
  );

  if (slotsRes.rows.length !== uniqueIds.length) {
    throw ApiError.badRequest('Некоторые окна не найдены', 'SLOT_NOT_FOUND');
  }

  const nowRes = await client.query<{ n: Date }>(`select now() as n`);
  const now = nowRes.rows[0]!.n;

  for (const slot of slotsRes.rows) {
    if (slot.master_id !== masterId) {
      throw ApiError.forbidden('Окно принадлежит другому мастеру', 'SLOT_MASTER_MISMATCH');
    }
    if (slot.status !== 'available') {
      throw ApiError.conflict('Окно недоступно для акции', 'SLOT_NOT_AVAILABLE');
    }
    if (new Date(slot.starts_at) <= now) {
      throw ApiError.conflict('Нельзя создать акцию на прошедшее окно', 'SLOT_IN_PAST');
    }
    if (slot.service_id != null && slot.service_id !== serviceId) {
      throw ApiError.conflict('Окно привязано к другой услуге', 'SLOT_SERVICE_MISMATCH');
    }

    const booked = await client.query(
      `select 1 from public.appointments a
        where a.slot_id = $1 and a.status in ('pending', 'confirmed')`,
      [slot.id],
    );
    if (booked.rowCount) {
      throw ApiError.conflict('Окно уже занято', 'SLOT_BOOKED');
    }

    const activePromo = await client.query(
      `select 1
         from public.master_service_promotion_slots ps
         join public.master_service_promotions p on p.id = ps.promotion_id
        where ps.slot_id = $1
          and p.status in ('active', 'scheduled')
          and p.ends_at >= current_date`,
      [slot.id],
    );
    if (activePromo.rowCount) {
      throw ApiError.conflict('На это окно уже действует акция', 'SLOT_ALREADY_PROMOTED');
    }
  }

  for (const slotId of uniqueIds) {
    await client.query(
      `insert into public.master_service_promotion_slots (promotion_id, slot_id, master_id)
       values ($1, $2, $3)`,
      [promotionId, slotId, masterId],
    );
  }
}

export async function resolveActivePromotionForSlot(
  client: PoolClient,
  slotId: string,
  masterId: string,
  serviceId: string,
): Promise<ActivePromotionRow | null> {
  const slotBound = await client.query<ActivePromotionRow>(
    `select
        p.id,
        p.template,
        p.title,
        p.discount_type::text as discount_type,
        p.discount_value::text as discount_value,
        p.discount_label
       from public.master_service_promotion_slots ps
       join public.master_service_promotions p on p.id = ps.promotion_id
       join public.master_availability_slots s on s.id = ps.slot_id
      where ps.slot_id = $1
        and ps.master_id = $2
        and p.status in ('active', 'scheduled')
        and (timezone('Europe/Minsk', s.starts_at))::date between p.starts_at and p.ends_at
      order by p.created_at desc
      limit 1`,
    [slotId, masterId],
  );
  if (slotBound.rows[0]) return slotBound.rows[0];

  const serviceWide = await client.query<ActivePromotionRow>(
    `select
        p.id,
        p.template,
        p.title,
        p.discount_type::text as discount_type,
        p.discount_value::text as discount_value,
        p.discount_label
       from public.master_service_promotions p
       join public.master_availability_slots s on s.id = $1
      where p.master_id = $2
        and p.service_id = $3
        and p.status in ('active', 'scheduled')
        and (timezone('Europe/Minsk', s.starts_at))::date between p.starts_at and p.ends_at
        and not exists (
          select 1 from public.master_service_promotion_slots ps where ps.promotion_id = p.id
        )
      order by p.created_at desc
      limit 1`,
    [slotId, masterId, serviceId],
  );
  return serviceWide.rows[0] ?? null;
}
