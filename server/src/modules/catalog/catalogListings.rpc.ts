import { query } from '../../config/db.js';
import type {
  CatalogListingsQuery,
  CatalogListingsResult,
  CatalogListingItem,
  CatalogSearchSuggestion,
  CatalogSearchSuggestionsResult,
  LocationSuggestion,
} from './catalogSearch.types.js';

type RpcListingsPayload = {
  items?: CatalogListingItem[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
};

function isMissingRpcError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (code === '42883' || code === '42P01' || code === '42725') return true;
  const message = String((err as { message?: string }).message ?? '');
  return /catalog_search_listings/i.test(message) && /does not exist|could not choose/i.test(message);
}

function normalizeListingItem(raw: CatalogListingItem): CatalogListingItem {
  const slot = raw.nextSlotStartsAt;
  let nextSlotStartsAt: string | null = null;
  if (slot != null && String(slot).trim() !== '') {
    const d = new Date(String(slot));
    nextSlotStartsAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return { ...raw, nextSlotStartsAt };
}

export async function searchCatalogListingsRpc(q: CatalogListingsQuery): Promise<CatalogListingsResult> {
  const r = await query<{ payload: RpcListingsPayload }>(
    `select public.catalog_search_listings(
      $1::text,
      $2::text,
      $3::uuid,
      $4::text,
      $5::text,
      $6::text,
      $7::numeric,
      $8::numeric,
      $9::numeric,
      $10::int,
      $11::text,
      $12::boolean,
      $13::boolean,
      $14::text,
      $15::text,
      $16::int,
      $17::int,
      $18::text,
      $19::int,
      $20::int,
      $21::boolean,
      $22::boolean,
      $23::boolean,
      $24::double precision,
      $25::double precision
    ) as payload`,
    [
      q.search?.trim() || null,
      q.categoryCode?.trim() || null,
      q.locationId?.trim() || null,
      q.addressText?.trim() || null,
      q.dateRange,
      q.timeOfDay,
      q.minPrice ?? null,
      q.maxPrice ?? null,
      q.minRating ?? null,
      q.minReviews ?? null,
      q.visitType,
      q.verifiedOnly,
      q.promotionOnly,
      q.durationPreset,
      q.sortBy,
      q.page,
      q.limit,
      q.slotDate?.trim() || null,
      q.timeFromHour ?? null,
      q.timeToHour ?? null,
      q.onlyWithSlots ?? false,
      q.popularOnly ?? false,
      q.newOnly ?? false,
      q.userLat ?? null,
      q.userLng ?? null,
    ],
  );

  const payload = r.rows[0]?.payload ?? {};
  const items = (payload.items ?? []).map((row) => normalizeListingItem(row));
  const total = payload.total ?? 0;
  const page = payload.page ?? q.page;
  const limit = payload.limit ?? q.limit;
  const hasMore = payload.hasMore ?? page * limit < total;

  return { items, total, page, limit, hasMore };
}

export async function suggestMasterLocationsRpc(
  rawQuery: string,
  limit: number,
): Promise<LocationSuggestion[]> {
  const r = await query<{ suggestions: LocationSuggestion[] }>(
    `select public.catalog_suggest_locations($1::text, $2::int) as suggestions`,
    [rawQuery, limit],
  );
  const rows = r.rows[0]?.suggestions;
  return Array.isArray(rows) ? rows : [];
}

type RpcSuggestSearchPayload = {
  popular?: CatalogSearchSuggestion[];
  items?: CatalogSearchSuggestion[];
};

export async function suggestCatalogSearchRpc(
  rawQuery: string,
  limit: number,
): Promise<CatalogSearchSuggestionsResult> {
  const r = await query<{ payload: RpcSuggestSearchPayload }>(
    `select public.catalog_suggest_search($1::text, $2::int) as payload`,
    [rawQuery, limit],
  );
  const payload = r.rows[0]?.payload ?? {};
  return {
    popular: Array.isArray(payload.popular) ? payload.popular : [],
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}

export async function recordCatalogSearchQueryRpc(rawQuery: string): Promise<void> {
  await query(`select public.catalog_record_search_query($1::text)`, [rawQuery]);
}

export { isMissingRpcError };
