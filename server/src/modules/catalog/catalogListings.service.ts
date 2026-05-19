import { query } from '../../config/db.js';
import type {
  CatalogListingsQuery,
  CatalogListingsResult,
  CatalogListingItem,
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

/** Условие по свободным слотам (дата в Europe/Minsk + опционально время суток). */
function slotExistsSql(q: CatalogListingsQuery, paramOffset: number): { sql: string; nextParam: number } {
  if (q.dateRange === 'any' && q.timeOfDay === 'any') {
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

  if (q.dateRange === 'today') {
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

  if (q.timeOfDay === 'morning') {
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
    return 'next_slot_starts_at asc nulls last, rating_avg::numeric desc nulls last, display_name asc';
  }
  /* recommended */
  return `
    case when next_slot_starts_at is null then 1 else 0 end asc,
    next_slot_starts_at asc nulls last,
    rating_avg::numeric desc nulls last,
    reviews_count desc nulls last,
    display_name asc
  `;
}

export async function suggestMasterLocations(rawQuery: string, limit: number): Promise<LocationSuggestion[]> {
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

export async function searchCatalogListings(q: CatalogListingsQuery): Promise<CatalogListingsResult> {
  const page = clampInt(q.page, 1, 500);
  const limit = clampInt(q.limit, 1, 80);
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  let i = 1;

  const whereParts: string[] = [`mp.publication_status = 'published'`];

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
        where ms.master_id = mp.master_id and ms.is_active = true
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
        sc.code as category_code,
        sc.name as category_name,
        ml.public_address,
        ml.city,
        ml.lat::double precision as location_lat,
        ml.lng::double precision as location_lng,
        ps.id as primary_service_id,
        ps.title as primary_service_title,
        ps.price_amount::text as primary_service_price,
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
        select ms.id, ms.title, ms.price_amount
        from public.master_services ms
        where ms.master_id = mp.master_id and ms.is_active = true
        order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
        limit 1
      ) ps on true
      where ${whereSql}
    )
    select * from base
    order by ${orderBySql(q.sortBy)}
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
      category_code: string | null;
      category_name: string | null;
      public_address: string | null;
      city: string | null;
      location_lat: number | string | null;
      location_lng: number | string | null;
      primary_service_id: string | null;
      primary_service_title: string | null;
      primary_service_price: string | null;
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
      category: row.category_code
        ? { code: row.category_code, name: row.category_name ?? row.category_code }
        : null,
      location,
      minServicePrice: num(row.primary_service_price),
      primaryServiceId: row.primary_service_id,
      primaryServiceName: row.primary_service_title,
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
