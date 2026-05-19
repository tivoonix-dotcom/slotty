import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { assertMasterHasProPlan } from '../billing/billing.service.js';
import { assertAndBindPromotionSlots } from './promotionSlots.service.js';

function num(v: string | number): number {
  return typeof v === 'number' ? v : Number(v);
}

async function assertServicesBelongToMaster(masterId: string, serviceIds: string[]) {
  if (!serviceIds.length) return;
  const r = await query(
    `select count(*)::int as c from public.master_services where master_id = $1 and id = any($2::uuid[])`,
    [masterId, serviceIds],
  );
  const c = (r.rows[0] as { c: number }).c;
  if (c !== serviceIds.length) {
    throw ApiError.badRequest('Некорректный список услуг набора', 'BAD_SERVICE_IDS');
  }
}

async function assertServiceBelongsToMaster(masterId: string, serviceId: string) {
  const r = await query(`select 1 from public.master_services where master_id = $1 and id = $2`, [
    masterId,
    serviceId,
  ]);
  if (!r.rowCount) {
    throw ApiError.badRequest('Услуга не найдена', 'BAD_SERVICE');
  }
}

export async function syncServicePromotionFlags(masterId: string) {
  await query(
    `update public.master_services ms
        set has_promotion = exists (
              select 1
                from public.master_service_promotions p
               where p.master_id = ms.master_id
                 and p.service_id = ms.id
                 and p.status in ('active', 'scheduled')
                 and p.ends_at >= current_date
            ),
            updated_at = now()
      where ms.master_id = $1`,
    [masterId],
  );
}

type BundleRow = {
  id: string;
  title: string;
  description: string;
  service_ids: string[];
  original_price: string;
  bundle_price: string;
  discount_percent: number;
  discount_amount: string;
  duration_minutes: number;
  image_url: string | null;
  image_source: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapBundle(row: BundleRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    serviceIds: row.service_ids ?? [],
    originalPrice: num(row.original_price),
    bundlePrice: num(row.bundle_price),
    discountPercent: row.discount_percent,
    discountAmount: num(row.discount_amount),
    durationMinutes: row.duration_minutes,
    imageUrl: row.image_url ?? undefined,
    imageSource: row.image_source,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMyBundles(masterId: string) {
  const r = await query(
    `select id, title, description, service_ids, original_price::text, bundle_price::text,
            discount_percent, discount_amount::text, duration_minutes, image_url, image_source,
            status, created_at, updated_at
       from public.master_service_bundles
      where master_id = $1
      order by updated_at desc`,
    [masterId],
  );
  return (r.rows as BundleRow[]).map(mapBundle);
}

export async function createMyBundle(
  masterId: string,
  body: {
    title: string;
    description?: string;
    serviceIds: string[];
    originalPrice: number;
    bundlePrice: number;
    discountPercent: number;
    discountAmount: number;
    durationMinutes: number;
    imageUrl?: string;
    imageSource?: string;
    status: string;
  },
) {
  await assertMasterHasProPlan(masterId);
  await assertServicesBelongToMaster(masterId, body.serviceIds);
  if (body.status === 'visible' && body.serviceIds.length < 2) {
    throw ApiError.badRequest('В наборе должно быть минимум 2 услуги', 'BUNDLE_MIN_SERVICES');
  }

  const ins = await query<{ id: string }>(
    `insert into public.master_service_bundles (
       master_id, title, description, service_ids, original_price, bundle_price,
       discount_percent, discount_amount, duration_minutes, image_url, image_source, status
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning id`,
    [
      masterId,
      body.title,
      body.description ?? '',
      body.serviceIds,
      body.originalPrice,
      body.bundlePrice,
      body.discountPercent,
      body.discountAmount,
      body.durationMinutes,
      body.imageUrl ?? null,
      body.imageSource ?? 'placeholder',
      body.status,
    ],
  );
  return getMyBundle(masterId, ins.rows[0]!.id);
}

export async function getMyBundle(masterId: string, bundleId: string) {
  const r = await query(
    `select id, title, description, service_ids, original_price::text, bundle_price::text,
            discount_percent, discount_amount::text, duration_minutes, image_url, image_source,
            status, created_at, updated_at
       from public.master_service_bundles
      where id = $1 and master_id = $2`,
    [bundleId, masterId],
  );
  const row = r.rows[0] as BundleRow | undefined;
  if (!row) throw ApiError.notFound('Bundle not found');
  return mapBundle(row);
}

export async function patchMyBundle(
  masterId: string,
  bundleId: string,
  patch: Partial<{
    title: string;
    description: string;
    serviceIds: string[];
    originalPrice: number;
    bundlePrice: number;
    discountPercent: number;
    discountAmount: number;
    durationMinutes: number;
    imageUrl: string | null;
    imageSource: string;
    status: string;
  }>,
) {
  const current = await getMyBundle(masterId, bundleId);
  const nextIds = patch.serviceIds ?? current.serviceIds;
  await assertServicesBelongToMaster(masterId, nextIds);
  const nextStatus = patch.status ?? current.status;
  if (nextStatus === 'visible' && nextIds.length < 2) {
    throw ApiError.badRequest('В наборе должно быть минимум 2 услуги', 'BUNDLE_MIN_SERVICES');
  }

  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const push = (col: string, v: unknown) => {
    fields.push(`${col} = $${i++}`);
    vals.push(v);
  };

  if (patch.title !== undefined) push('title', patch.title);
  if (patch.description !== undefined) push('description', patch.description);
  if (patch.serviceIds !== undefined) push('service_ids', patch.serviceIds);
  if (patch.originalPrice !== undefined) push('original_price', patch.originalPrice);
  if (patch.bundlePrice !== undefined) push('bundle_price', patch.bundlePrice);
  if (patch.discountPercent !== undefined) push('discount_percent', patch.discountPercent);
  if (patch.discountAmount !== undefined) push('discount_amount', patch.discountAmount);
  if (patch.durationMinutes !== undefined) push('duration_minutes', patch.durationMinutes);
  if (patch.imageUrl !== undefined) push('image_url', patch.imageUrl);
  if (patch.imageSource !== undefined) push('image_source', patch.imageSource);
  if (patch.status !== undefined) push('status', patch.status);

  if (fields.length) {
    vals.push(bundleId, masterId);
    await query(
      `update public.master_service_bundles set ${fields.join(', ')}, updated_at = now()
        where id = $${i++} and master_id = $${i}`,
      vals,
    );
  }
  return getMyBundle(masterId, bundleId);
}

export async function deleteMyBundle(masterId: string, bundleId: string) {
  const r = await query(`delete from public.master_service_bundles where id = $1 and master_id = $2`, [
    bundleId,
    masterId,
  ]);
  if (!r.rowCount) throw ApiError.notFound('Bundle not found');
}

type PromoRow = {
  id: string;
  template: string;
  title: string;
  description: string;
  service_id: string;
  discount_type: string;
  discount_value: string;
  discount_label: string;
  starts_at: string;
  ends_at: string;
  status: string;
  background_image: string;
  created_at: string;
  updated_at: string;
};

function mapPromotion(row: PromoRow, serviceTitle?: string) {
  return {
    id: row.id,
    template: row.template,
    title: row.title,
    description: row.description,
    serviceId: row.service_id,
    serviceTitle: serviceTitle ?? '',
    discountType: row.discount_type,
    discountValue: num(row.discount_value),
    discountLabel: row.discount_label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    backgroundImage: row.background_image,
    createdAt: row.created_at,
  };
}

export async function listMyPromotions(masterId: string) {
  const r = await query(
    `select p.id, p.template, p.title, p.description, p.service_id, p.discount_type,
            p.discount_value::text, p.discount_label, p.starts_at::text, p.ends_at::text,
            p.status, p.background_image, p.created_at, p.updated_at,
            ms.title as service_title
       from public.master_service_promotions p
       join public.master_services ms on ms.id = p.service_id and ms.master_id = p.master_id
      where p.master_id = $1
      order by p.created_at desc`,
    [masterId],
  );
  return (r.rows as (PromoRow & { service_title: string })[]).map((row) =>
    mapPromotion(row, row.service_title),
  );
}

function resolvePromotionStatus(
  publish: boolean,
  startsAt: string,
  endsAt: string,
  explicit?: string,
): string {
  if (!publish) return 'draft';
  if (explicit === 'finished') return 'finished';
  const today = new Date().toISOString().slice(0, 10);
  if (endsAt < today) return 'finished';
  if (startsAt > today) return 'scheduled';
  return 'active';
}

export async function createMyPromotion(
  masterId: string,
  body: {
    template: string;
    title: string;
    description?: string;
    serviceId: string;
    discountType: string;
    discountValue: number;
    discountLabel: string;
    startsAt: string;
    endsAt: string;
    status?: string;
    backgroundImage?: string;
    publish?: boolean;
    slotIds?: string[];
  },
) {
  await assertMasterHasProPlan(masterId);
  await assertServiceBelongsToMaster(masterId, body.serviceId);

  const isFreeSlots = body.template === 'free_slots';
  const slotIds = body.slotIds ?? [];

  if (isFreeSlots && !slotIds.length) {
    throw ApiError.badRequest(
      'Для умной акции укажите окна (slotIds)',
      'FREE_SLOTS_REQUIRES_SLOT_IDS',
    );
  }
  if (!isFreeSlots && slotIds.length) {
    throw ApiError.badRequest(
      'Привязка к окнам только для template free_slots',
      'SLOT_IDS_NOT_ALLOWED',
    );
  }

  const status = resolvePromotionStatus(
    body.publish ?? body.status !== 'draft',
    body.startsAt,
    body.endsAt,
    body.status,
  );

  const promotionId = await withTransaction(async (client: PoolClient) => {
    const ins = await client.query<{ id: string }>(
      `insert into public.master_service_promotions (
         master_id, template, title, description, service_id, discount_type, discount_value,
         discount_label, starts_at, ends_at, status, background_image
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id`,
      [
        masterId,
        body.template,
        body.title,
        body.description ?? '',
        body.serviceId,
        body.discountType,
        body.discountValue,
        body.discountLabel,
        body.startsAt,
        body.endsAt,
        status,
        body.backgroundImage ?? '',
      ],
    );
    const id = ins.rows[0]!.id;

    if (isFreeSlots) {
      await assertAndBindPromotionSlots(client, masterId, id, body.serviceId, slotIds);
    }

    return id;
  });

  await syncServicePromotionFlags(masterId);
  return getMyPromotion(masterId, promotionId);
}

export async function getMyPromotion(masterId: string, promotionId: string) {
  const r = await query(
    `select p.id, p.template, p.title, p.description, p.service_id, p.discount_type,
            p.discount_value::text, p.discount_label, p.starts_at::text, p.ends_at::text,
            p.status, p.background_image, p.created_at, p.updated_at,
            ms.title as service_title
       from public.master_service_promotions p
       join public.master_services ms on ms.id = p.service_id and ms.master_id = p.master_id
      where p.id = $1 and p.master_id = $2`,
    [promotionId, masterId],
  );
  const row = r.rows[0] as (PromoRow & { service_title: string }) | undefined;
  if (!row) throw ApiError.notFound('Promotion not found');
  return mapPromotion(row, row.service_title);
}

export async function patchMyPromotion(
  masterId: string,
  promotionId: string,
  patch: Partial<{
    template: string;
    title: string;
    description: string;
    serviceId: string;
    discountType: string;
    discountValue: number;
    discountLabel: string;
    startsAt: string;
    endsAt: string;
    status: string;
    backgroundImage: string;
    publish?: boolean;
  }>,
) {
  const current = await getMyPromotion(masterId, promotionId);
  const serviceId = patch.serviceId ?? current.serviceId;
  await assertServiceBelongsToMaster(masterId, serviceId);

  const startsAt = patch.startsAt ?? current.startsAt;
  const endsAt = patch.endsAt ?? current.endsAt;
  let status = patch.status;
  if (patch.publish !== undefined) {
    status = resolvePromotionStatus(patch.publish, startsAt, endsAt, patch.status);
  } else if (status === undefined && patch.startsAt !== undefined) {
    status = resolvePromotionStatus(current.status !== 'draft', startsAt, endsAt, current.status);
  }

  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const push = (col: string, v: unknown) => {
    fields.push(`${col} = $${i++}`);
    vals.push(v);
  };

  if (patch.template !== undefined) push('template', patch.template);
  if (patch.title !== undefined) push('title', patch.title);
  if (patch.description !== undefined) push('description', patch.description);
  if (patch.serviceId !== undefined) push('service_id', patch.serviceId);
  if (patch.discountType !== undefined) push('discount_type', patch.discountType);
  if (patch.discountValue !== undefined) push('discount_value', patch.discountValue);
  if (patch.discountLabel !== undefined) push('discount_label', patch.discountLabel);
  if (patch.startsAt !== undefined) push('starts_at', patch.startsAt);
  if (patch.endsAt !== undefined) push('ends_at', patch.endsAt);
  if (status !== undefined) push('status', status);
  if (patch.backgroundImage !== undefined) push('background_image', patch.backgroundImage);

  if (fields.length) {
    vals.push(promotionId, masterId);
    await query(
      `update public.master_service_promotions set ${fields.join(', ')}, updated_at = now()
        where id = $${i++} and master_id = $${i}`,
      vals,
    );
  }
  await syncServicePromotionFlags(masterId);
  return getMyPromotion(masterId, promotionId);
}

export async function deleteMyPromotion(masterId: string, promotionId: string) {
  const r = await query(`delete from public.master_service_promotions where id = $1 and master_id = $2`, [
    promotionId,
    masterId,
  ]);
  if (!r.rowCount) throw ApiError.notFound('Promotion not found');
  await syncServicePromotionFlags(masterId);
}
