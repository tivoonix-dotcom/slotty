import { query } from '../../config/db.js';
import { PUBLIC_BOOKABLE_MASTER_ACCOUNT_SQL } from '../../lib/publicMasterAccountSql.js';
import type {
  CatalogListingsQuery,
  CatalogListingsResult,
  CatalogListingItem,
  CatalogSearchSuggestion,
  CatalogSearchSuggestionsResult,
  LocationSuggestion,
} from './catalogSearch.types.js';

function num(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeIlikeFragment(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw.trim().replace(/[%_\\]/g, ' ').slice(0, 160);
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

/** Мастер виден в каталоге: опубликован, аккаунт активен (или снято ограничение по сроку). */
export const CATALOG_MASTER_ACCOUNT_SQL = PUBLIC_BOOKABLE_MASTER_ACCOUNT_SQL;

export const CATALOG_SERVICE_VISIBLE_SQL = `ms.is_active = true and ms.admin_hidden_at is null`;

/** Условие по свободным слотам (дата в Europe/Minsk + опционально время суток). */
function isFullHourRange(from?: number, to?: number): boolean {
  if (from == null || to == null) return true;
  return from <= 0 && to >= 24;
}

function slotExistsSql(q: CatalogListingsQuery, paramOffset: number): { sql: string; nextParam: number } {
  const hasSlotDate = Boolean(q.slotDate?.trim());
  const hasDateRange = q.dateRange !== 'any';
  const hasExactTime = q.timeFromHour != null && q.timeToHour != null && !isFullHourRange(q.timeFromHour, q.timeToHour);
  const hasTimeOfDay = q.timeOfDay !== 'any';

  if (!hasSlotDate && !hasDateRange && !hasExactTime && !hasTimeOfDay) {
    return { sql: 'true', nextParam: paramOffset };
  }

  const parts: string[] = [
    `exists (
      select 1 from public.master_availability_slots s
      where s.master_id = mp.master_id
        and s.status = 'available'
        and s.starts_at > now()`,
  ];

  const msk = `(s.starts_at at time zone 'Europe/Minsk')`;

  if (hasSlotDate) {
    parts.push(`and (${msk})::date = '${q.slotDate!.trim()}'::date`);
  } else if (q.dateRange === 'today') {
    parts.push(`and (${msk})::date = (timezone('Europe/Minsk', now()))::date`);
  } else if (q.dateRange === 'tomorrow') {
    parts.push(`and (${msk})::date = ((timezone('Europe/Minsk', now()) + interval '1 day'))::date)`);
  } else if (q.dateRange === 'week') {
    parts.push(`and (${msk})::date >= (timezone('Europe/Minsk', now()))::date`);
    parts.push(`and (${msk})::date <= ((timezone('Europe/Minsk', now()) + interval '7 day'))::date)`);
  } else if (q.dateRange === 'weekend') {
    parts.push(`and extract(dow from (${msk})) in (0, 6)`);
    parts.push(`and (${msk})::date >= (timezone('Europe/Minsk', now()))::date`);
    parts.push(`and (${msk})::date <= ((timezone('Europe/Minsk', now()) + interval '14 day'))::date)`);
  }

  if (hasExactTime) {
    parts.push(`and extract(hour from (${msk})) >= ${q.timeFromHour}`);
    parts.push(`and extract(hour from (${msk})) < ${q.timeToHour}`);
  } else if (q.timeOfDay === 'morning') {
    parts.push(`and extract(hour from (${msk})) >= 8 and extract(hour from (${msk})) < 12`);
  } else if (q.timeOfDay === 'afternoon') {
    parts.push(`and extract(hour from (${msk})) >= 12 and extract(hour from (${msk})) < 17`);
  } else if (q.timeOfDay === 'evening') {
    parts.push(`and extract(hour from (${msk})) >= 17 and extract(hour from (${msk})) < 22`);
  }

  parts.push(')');
  return { sql: parts.join('\n        '), nextParam: paramOffset };
}

function durationSql(preset: CatalogListingsQuery['durationPreset']): string {
  if (preset === 'any') return 'true';
  if (preset === 'under30') {
    return `exists (
      select 1 from public.master_services ms
      where ms.master_id = mp.master_id and ms.is_active = true
        and ms.duration_minutes > 0 and ms.duration_minutes < 30
    )`;
  }
  if (preset === '30_60') {
    return `exists (
      select 1 from public.master_services ms
      where ms.master_id = mp.master_id and ms.is_active = true
        and ms.duration_minutes >= 30 and ms.duration_minutes <= 60
    )`;
  }
  if (preset === '60_120') {
    return `exists (
      select 1 from public.master_services ms
      where ms.master_id = mp.master_id and ms.is_active = true
        and ms.duration_minutes > 60 and ms.duration_minutes <= 120
    )`;
  }
  return `exists (
    select 1 from public.master_services ms
    where ms.master_id = mp.master_id and ms.is_active = true
      and ms.duration_minutes > 120
  )`;
}

const LEGACY_POPULARITY_SCORE_SQL = `(
  coalesce(rating_avg::numeric, 0) * 14
  + least(coalesce(reviews_count, 0), 30) * 2.2
  + case when next_slot_starts_at is not null then 12 else 0 end
  + case when is_verified then 12 else 0 end
)`;

function orderBySql(sortBy: CatalogListingsQuery['sortBy']): string {
  if (sortBy === 'rating') {
    return 'rating_avg::numeric desc nulls last, display_name asc';
  }
  if (sortBy === 'price_asc') {
    return 'primary_service_price::numeric asc nulls last, display_name asc';
  }
  if (sortBy === 'price_desc') {
    return 'primary_service_price::numeric desc nulls last, display_name asc';
  }
  if (sortBy === 'reviews') {
    return 'reviews_count desc nulls last, display_name asc';
  }
  if (sortBy === 'soonest') {
    return `
      case when next_slot_starts_at is null then 1 else 0 end asc,
      next_slot_starts_at asc nulls last,
      ${LEGACY_POPULARITY_SCORE_SQL} desc nulls last,
      rating_avg::numeric desc nulls last,
      display_name asc
    `;
  }
  if (sortBy === 'popular') {
    return `
      ${LEGACY_POPULARITY_SCORE_SQL} desc nulls last,
      reviews_count desc nulls last,
      rating_avg::numeric desc nulls last,
      display_name asc
    `;
  }
  /* recommended */
  return `
    case when next_slot_starts_at is null then 1 else 0 end asc,
    next_slot_starts_at asc nulls last,
    ${LEGACY_POPULARITY_SCORE_SQL} desc nulls last,
    rating_avg::numeric desc nulls last,
    reviews_count desc nulls last,
    display_name asc
  `;
}

import {
  isMissingRpcError,
  recordCatalogSearchQueryRpc,
  searchCatalogListingsRpc,
  suggestCatalogSearchRpc,
  suggestMasterLocationsRpc,
} from './catalogListings.rpc.js';

async function enrichCatalogItemsWithServiceCovers(
  items: CatalogListingItem[],
): Promise<CatalogListingItem[]> {
  const ids = items.map((item) => item.primaryServiceId).filter((id): id is string => Boolean(id?.trim()));
  if (!ids.length) return items;

  try {
    const r = await query<{
      id: string;
      cover_image_url: string | null;
      cover_image_focal_x: number;
      cover_image_focal_y: number;
    }>(
      `select id, cover_image_url, cover_image_focal_x, cover_image_focal_y
         from public.master_services
        where id = any($1::uuid[])`,
      [ids],
    );

    const byId = new Map(r.rows.map((row) => [row.id, row]));
    return items.map((item) => {
      if (!item.primaryServiceId) return item;
      const row = byId.get(item.primaryServiceId);
      if (!row?.cover_image_url?.trim()) return item;
      return {
        ...item,
        primaryServiceCoverUrl: row.cover_image_url,
        primaryServiceCoverFocalX: row.cover_image_focal_x,
        primaryServiceCoverFocalY: row.cover_image_focal_y,
      };
    });
  } catch (err) {
    const code = err && typeof err === 'object' ? (err as { code?: string }).code : undefined;
    if (code === '42703') {
      console.warn('[catalog] master_services cover columns missing — apply migration 079');
      return items;
    }
    throw err;
  }
}

export async function searchCatalogListings(q: CatalogListingsQuery): Promise<CatalogListingsResult> {
  try {
    const out = await searchCatalogListingsRpc(q);
    return { ...out, items: await enrichCatalogItemsWithServiceCovers(out.items) };
  } catch (err) {
    if (!isMissingRpcError(err)) throw err;
    console.warn('[catalog] RPC catalog_search_listings missing — apply migration 038; using legacy SQL');
    return searchCatalogListingsLegacy(q);
  }
}

export async function recordCatalogListingView(
  masterId: string,
  serviceId?: string | null,
): Promise<void> {
  const id = masterId?.trim();
  if (!id) return;

  try {
    await query(`select public.catalog_record_listing_view($1::uuid, $2::uuid)`, [
      id,
      serviceId?.trim() || null,
    ]);
  } catch (err) {
    if (isMissingRpcError(err)) return;
    const code = err && typeof err === 'object' ? (err as { code?: string }).code : undefined;
    if (code === '42P01') return;
    console.warn('[catalog] record listing view failed', err);
  }
}

export async function suggestMasterLocations(rawQuery: string, limit: number): Promise<LocationSuggestion[]> {
  try {
    return await suggestMasterLocationsRpc(rawQuery, limit);
  } catch (err) {
    if (!isMissingRpcError(err)) throw err;
    console.warn('[catalog] RPC catalog_suggest_locations missing — apply migration 038; using legacy SQL');
    return suggestMasterLocationsLegacy(rawQuery, limit);
  }
}

export async function suggestCatalogSearch(
  rawQuery: string,
  limit: number,
): Promise<CatalogSearchSuggestionsResult> {
  try {
    return await suggestCatalogSearchRpc(rawQuery, limit);
  } catch (err) {
    if (!isMissingRpcError(err)) throw err;
    console.warn('[catalog] RPC catalog_suggest_search missing — apply migration 077; using legacy SQL');
    return suggestCatalogSearchLegacy(rawQuery, limit);
  }
}

export async function recordCatalogSearchQuery(rawQuery: string): Promise<void> {
  const frag = safeIlikeFragment(rawQuery);
  if (!frag) return;
  try {
    await recordCatalogSearchQueryRpc(frag);
  } catch (err) {
    if (!isMissingRpcError(err)) throw err;
  }
}

async function suggestCatalogSearchLegacy(
  rawQuery: string,
  limit: number,
): Promise<CatalogSearchSuggestionsResult> {
  const frag = safeIlikeFragment(rawQuery);
  const lim = clampInt(limit, 1, 20);

  if (!frag) {
    const popular = await query<{ title: string }>(
      `
      select distinct trim(ms.title) as title
      from public.master_services ms
      join public.master_profiles mp on mp.master_id = ms.master_id
      where ms.is_active = true
        and ms.admin_hidden_at is null
        and mp.publication_status = 'published'
        and ${CATALOG_MASTER_ACCOUNT_SQL}
        and trim(coalesce(ms.title, '')) <> ''
      order by trim(ms.title) asc
      limit $1
      `,
      [Math.min(lim, 8)],
    );
    return {
      popular: popular.rows.map((row, i) => ({
        id: `svc:${i}`,
        type: 'query' as const,
        title: row.title,
        subtitle: 'Часто ищут',
        group: 'popular' as const,
      })),
      items: [],
    };
  }

  const pattern = `%${frag}%`;
  const items: CatalogSearchSuggestion[] = [];

  const cats = await query<{ code: string; name: string; master_count: number }>(
    `
    select sc.code, sc.name, count(distinct mp.master_id)::int as master_count
    from public.service_categories sc
    join public.master_profiles mp on mp.primary_category_id = sc.id
    where sc.is_active = true
      and mp.publication_status = 'published'
      and ${CATALOG_MASTER_ACCOUNT_SQL}
      and (sc.name ilike $1 or sc.code ilike $1)
    group by sc.code, sc.name
    order by count(distinct mp.master_id) desc
    limit 3
    `,
    [pattern],
  );
  for (const row of cats.rows) {
    items.push({
      id: `cat:${row.code}`,
      type: 'category',
      title: row.name,
      subtitle: row.master_count === 1 ? '1 мастер' : `${row.master_count} мастеров`,
      categoryCode: row.code,
      group: 'match',
    });
  }

  const services = await query<{
    service_id: string;
    title: string;
    master_id: string;
    category_code: string | null;
    price_amount: string | null;
  }>(
    `
    select ms.id as service_id, ms.title, ms.master_id, sc.code as category_code, ms.price_amount::text
    from public.master_services ms
    join public.master_profiles mp on mp.master_id = ms.master_id
    left join public.service_categories sc on sc.id = ms.category_id
    where ms.is_active = true
      and ms.admin_hidden_at is null
      and mp.publication_status = 'published'
      and ${CATALOG_MASTER_ACCOUNT_SQL}
      and ms.title ilike $1
    order by mp.reviews_count desc nulls last, ms.title asc
    limit 5
    `,
    [pattern],
  );
  for (const row of services.rows) {
    const price = row.price_amount ? ` · от ${row.price_amount} BYN` : '';
    items.push({
      id: `svc:${row.service_id}`,
      type: 'service',
      title: row.title,
      subtitle: `${row.category_code ?? 'Услуга'}${price}`,
      masterId: row.master_id,
      serviceId: row.service_id,
      categoryCode: row.category_code ?? undefined,
      group: 'match',
    });
  }

  const masters = await query<{
    master_id: string;
    display_name: string;
    slug: string | null;
    category_code: string | null;
    category_name: string | null;
    rating_avg: string | null;
  }>(
    `
    select mp.master_id, mp.display_name, mp.slug, sc.code as category_code, sc.name as category_name, mp.rating_avg::text
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    where mp.publication_status = 'published'
      and ${CATALOG_MASTER_ACCOUNT_SQL}
      and mp.display_name ilike $1
    order by mp.reviews_count desc nulls last, mp.display_name asc
    limit 4
    `,
    [pattern],
  );
  for (const row of masters.rows) {
    const rating = row.rating_avg && Number(row.rating_avg) > 0 ? ` · ${Number(row.rating_avg).toFixed(1)}` : '';
    items.push({
      id: `m:${row.master_id}`,
      type: 'master',
      title: row.display_name,
      subtitle: `${row.category_name ?? 'Мастер'}${rating}`,
      masterId: row.master_id,
      slug: row.slug,
      categoryCode: row.category_code ?? undefined,
      group: 'match',
    });
  }

  return { popular: [], items: items.slice(0, lim) };
}

async function suggestMasterLocationsLegacy(rawQuery: string, limit: number): Promise<LocationSuggestion[]> {
  const frag = safeIlikeFragment(rawQuery);
  if (!frag) return [];

  const lim = clampInt(limit, 1, 30);
  const pattern = `%${frag}%`;

  const sql = `
    with base as (
      select
        ml.id,
        ml.public_address,
        ml.master_id,
        (
          select count(*)::int
          from public.master_availability_slots s
          where s.master_id = ml.master_id
            and s.status = 'available'
            and s.starts_at > now()
        ) as slot_count
      from public.master_locations ml
      join public.master_profiles mp on mp.master_id = ml.master_id
      where mp.publication_status = 'published'
        and ${CATALOG_MASTER_ACCOUNT_SQL}
        and ml.is_primary = true
        and (
          ml.public_address ilike $1
          or coalesce(ml.street, '') ilike $1
          or coalesce(ml.building, '') ilike $1
          or coalesce(ml.landmark, '') ilike $1
        )
    ),
    agg as (
      select
        min(id) as id,
        public_address as title,
        count(distinct master_id)::int as master_count,
        sum(slot_count)::int as slot_count
      from base
      group by lower(trim(public_address)), public_address
    )
    select id, title, master_count, slot_count
    from agg
    order by master_count desc, title asc
    limit $2
  `;

  const r = await query<{
    id: string;
    title: string;
    master_count: number;
    slot_count: number;
  }>(sql, [pattern, lim]);

  return r.rows.map((row) => {
    const m = row.master_count;
    const s = row.slot_count;
    const mLabel = m === 1 ? '1 мастер' : `${m} мастеров`;
    const sLabel = s === 0 ? 'нет окон' : s === 1 ? '1 окно' : `${s} окон`;
    return {
      id: row.id,
      type: 'address' as const,
      title: row.title,
      subtitle: `${mLabel} · ${sLabel}`,
    };
  });
}

async function searchCatalogListingsLegacy(q: CatalogListingsQuery): Promise<CatalogListingsResult> {
  const page = clampInt(q.page, 1, 500);
  const limit = clampInt(q.limit, 1, 80);
  const offset = (page - 1) * limit;
  const effectiveSort: CatalogListingsQuery['sortBy'] =
    q.popularOnly && q.sortBy === 'recommended' ? 'popular' : q.sortBy;

  const params: unknown[] = [];
  let i = 1;

  const whereParts: string[] = [`mp.publication_status = 'published'`, CATALOG_MASTER_ACCOUNT_SQL];

  const searchFrag = safeIlikeFragment(q.search);
  if (searchFrag) {
    const p = `%${searchFrag}%`;
    params.push(p);
    const idx = i++;
    whereParts.push(`(
      mp.display_name ilike $${idx}
      or exists (
        select 1 from public.master_services ms
        join public.service_categories scs on scs.id = ms.category_id
        where ms.master_id = mp.master_id and ${CATALOG_SERVICE_VISIBLE_SQL}
          and (
            ms.title ilike $${idx}
            or scs.name ilike $${idx}
            or scs.code ilike $${idx}
          )
      )
      or coalesce(ml.public_address, '') ilike $${idx}
    )`);
  }

  if (q.categoryCode?.trim()) {
    params.push(q.categoryCode.trim());
    const idx = i++;
    whereParts.push(`(
      sc.code = $${idx}
      or exists (
        select 1 from public.master_services ms2
        join public.service_categories sc2 on sc2.id = ms2.category_id
        where ms2.master_id = mp.master_id and ms2.is_active = true
          and sc2.code = $${idx}
      )
    )`);
  }

  if (q.locationId?.trim()) {
    params.push(q.locationId.trim());
    whereParts.push(`ml.id = $${i++}::uuid`);
  } else {
    const addr = safeIlikeFragment(q.addressText);
    if (addr) {
      const p = `%${addr}%`;
      params.push(p);
      const idx = i++;
      whereParts.push(`(
        coalesce(ml.public_address, '') ilike $${idx}
        or coalesce(ml.street, '') ilike $${idx}
        or coalesce(ml.building, '') ilike $${idx}
      )`);
    }
  }

  if (q.minRating != null && Number.isFinite(q.minRating)) {
    params.push(q.minRating);
    whereParts.push(`mp.rating_avg >= $${i++}::numeric`);
  }

  if (q.minReviews != null && q.minReviews > 0) {
    params.push(q.minReviews);
    whereParts.push(`mp.reviews_count >= $${i++}::int`);
  }

  if (q.visitType === 'studio' || q.visitType === 'at_home') {
    params.push(q.visitType);
    whereParts.push(`ml.visit_type = $${i++}::public.visit_type`);
  }

  if (q.verifiedOnly) {
    whereParts.push(`mp.is_verified = true`);
  }

  if (q.promotionOnly) {
    whereParts.push(`(
      exists (
        select 1 from public.master_services msp
        where msp.master_id = mp.master_id and msp.is_active = true
          and (
            msp.has_promotion = true
            or (msp.old_price_amount is not null and msp.old_price_amount > msp.price_amount)
          )
      )
      or exists (
        select 1 from public.master_service_promotions pr
        where pr.master_id = mp.master_id
          and pr.status = 'active'
          and pr.starts_at <= now()
          and pr.ends_at >= now()
      )
    )`);
  }

  if (q.newOnly) {
    whereParts.push(`(
      mp.reviews_count < 10
      or (mp.published_at is not null and mp.published_at > now() - interval '60 days')
    )`);
  }

  if (q.onlyWithSlots) {
    whereParts.push(`exists (
      select 1 from public.master_availability_slots s
      where s.master_id = mp.master_id
        and s.status = 'available'
        and s.starts_at > now()
    )`);
  }

  whereParts.push(durationSql(q.durationPreset));

  const slotSql = slotExistsSql(q, i);
  if (slotSql.sql !== 'true') {
    whereParts.push(slotSql.sql);
  }

  if (q.minPrice != null && Number.isFinite(q.minPrice)) {
    params.push(q.minPrice);
    whereParts.push(`exists (
      select 1 from public.master_services msp
      where msp.master_id = mp.master_id and msp.is_active = true
        and msp.price_amount >= $${i++}::numeric
    )`);
  }

  if (q.maxPrice != null && Number.isFinite(q.maxPrice)) {
    params.push(q.maxPrice);
    whereParts.push(`exists (
      select 1 from public.master_services msp
      where msp.master_id = mp.master_id and msp.is_active = true
        and msp.price_amount <= $${i++}::numeric
    )`);
  }

  const whereSql = whereParts.join('\n  and ');
  const whereParams = [...params];
  const limitPlaceholder = i++;
  const offsetPlaceholder = i++;
  const listParams = [...whereParams, limit, offset];

  const countSql = `
    select count(*)::int as c
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
    where ${whereSql}
  `;

  const listSql = `
    with base as (
      select
        mp.master_id,
        mp.display_name,
        mp.bio,
        mp.photo_url,
        mp.slug,
        mp.rating_avg::text,
        mp.reviews_count,
        mp.is_verified,
        sc.code as category_code,
        sc.name as category_name,
        ml.public_address,
        ml.city,
        ml.lat::double precision as location_lat,
        ml.lng::double precision as location_lng,
        ps.id as primary_service_id,
        ps.title as primary_service_title,
        ps.price_amount::text as primary_service_price,
        ps.cover_image_url as primary_service_cover_url,
        ps.cover_image_focal_x as primary_service_cover_focal_x,
        ps.cover_image_focal_y as primary_service_cover_focal_y,
        (
          select min(s.starts_at)
          from public.master_availability_slots s
          where s.master_id = mp.master_id
            and s.status = 'available'
            and s.starts_at > now()
        ) as next_slot_starts_at,
        (
          select s.id
          from public.master_availability_slots s
          where s.master_id = mp.master_id
            and s.status = 'available'
            and s.starts_at > now()
          order by s.starts_at asc
          limit 1
        ) as next_slot_id
      from public.master_profiles mp
      left join public.service_categories sc on sc.id = mp.primary_category_id
      left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
      left join lateral (
        select ms.id, ms.title, ms.price_amount, ms.cover_image_url, ms.cover_image_focal_x, ms.cover_image_focal_y
        from public.master_services ms
        where ms.master_id = mp.master_id and ${CATALOG_SERVICE_VISIBLE_SQL}
        order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
        limit 1
      ) ps on true
      where ${whereSql}
    )
    select * from base
    order by ${orderBySql(effectiveSort)}
    limit $${limitPlaceholder} offset $${offsetPlaceholder}
  `;

  const [countRes, listRes] = await Promise.all([
    query<{ c: number }>(countSql, whereParams),
    query<{
      master_id: string;
      display_name: string;
      bio: string;
      photo_url: string | null;
      slug: string | null;
      rating_avg: string;
      reviews_count: number;
      is_verified: boolean;
      category_code: string | null;
      category_name: string | null;
      public_address: string | null;
      city: string | null;
      location_lat: number | string | null;
      location_lng: number | string | null;
      primary_service_id: string | null;
      primary_service_title: string | null;
      primary_service_price: string | null;
      primary_service_cover_url: string | null;
      primary_service_cover_focal_x: number | null;
      primary_service_cover_focal_y: number | null;
      next_slot_starts_at: Date | string | null;
      next_slot_id: string | null;
    }>(listSql, listParams),
  ]);

  const total = countRes.rows[0]?.c ?? 0;

  const items: CatalogListingItem[] = listRes.rows.map((row) => {
    const lat = num(row.location_lat);
    const lng = num(row.location_lng);
    const hasCoords = lat != null && lng != null;
    const location =
      row.public_address
        ? { publicAddress: row.public_address, city: row.city, lat, lng }
        : row.city
          ? { publicAddress: row.city, city: row.city, lat, lng }
          : hasCoords
            ? { publicAddress: 'Точка на карте', city: row.city, lat, lng }
            : null;

    return {
      masterId: row.master_id,
      displayName: row.display_name,
      bio: row.bio,
      photoUrl: row.photo_url,
      slug: row.slug,
      rating: num(row.rating_avg) ?? 0,
      reviewsCount: row.reviews_count,
      isVerified: Boolean(row.is_verified),
      category: row.category_code
        ? { code: row.category_code, name: row.category_name ?? row.category_code }
        : null,
      location,
      minServicePrice: num(row.primary_service_price),
      primaryServiceId: row.primary_service_id,
      primaryServiceName: row.primary_service_title,
      primaryServiceCoverUrl: row.primary_service_cover_url,
      primaryServiceCoverFocalX: row.primary_service_cover_focal_x,
      primaryServiceCoverFocalY: row.primary_service_cover_focal_y,
      nextSlotStartsAt:
        row.next_slot_starts_at != null
          ? new Date(row.next_slot_starts_at as Date).toISOString()
          : null,
      nextSlotId: row.next_slot_id,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}
