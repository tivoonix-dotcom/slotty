import { LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import { apiFetch } from '../../../shared/api/backendClient';
import { fetchPublicGetCached } from '../../../shared/api/publicGetCache';
import type { MasterLocation } from '../../profile/model/masterLocation';
import type { ServiceListingRecord } from '../../services/model/demoMasters';
import { resolveServiceListingCoverUrl } from '../../catalog/catalogServicePhotos';
import { masterListingPortraitUrl } from '../../masters/lib/masterListingPortrait';

async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return j?.error?.message ?? `Ошибка ${res.status}`;
}

export type CatalogListingItemDto = {
  masterId: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  slug: string | null;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isProEntitled?: boolean;
  category: { code: string; name: string } | null;
  location: {
    publicAddress: string;
    city: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  minServicePrice: number | null;
  primaryServiceId: string | null;
  primaryServiceName: string | null;
  nextSlotStartsAt: string | null;
  nextSlotId: string | null;
};

export type CatalogListingsResponseDto = {
  items: CatalogListingItemDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type CatalogListingsParams = {
  search?: string;
  category?: string;
  locationId?: string;
  address?: string;
  dateRange?: 'any' | 'today' | 'tomorrow' | 'week' | 'weekend';
  timeOfDay?: 'any' | 'morning' | 'afternoon' | 'evening';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minReviews?: number;
  visitType?: 'any' | 'studio' | 'at_home';
  verifiedOnly?: boolean;
  promotionOnly?: boolean;
  duration?: 'any' | 'under30' | '30_60' | '60_120' | 'over120';
  sortBy?: 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'reviews' | 'soonest';
  page?: number;
  limit?: number;
};

function appendNum(qs: URLSearchParams, key: string, v: number | undefined) {
  if (v != null && Number.isFinite(v)) qs.set(key, String(v));
}

function appendBool(qs: URLSearchParams, key: string, v: boolean | undefined) {
  if (v) qs.set(key, 'true');
}

export async function fetchCatalogListings(params: CatalogListingsParams): Promise<CatalogListingsResponseDto> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.category?.trim()) qs.set('category', params.category.trim());
  if (params.locationId?.trim()) qs.set('locationId', params.locationId.trim());
  if (params.address?.trim()) qs.set('address', params.address.trim());
  if (params.dateRange && params.dateRange !== 'any') qs.set('dateRange', params.dateRange);
  if (params.timeOfDay && params.timeOfDay !== 'any') qs.set('timeOfDay', params.timeOfDay);
  appendNum(qs, 'minPrice', params.minPrice);
  appendNum(qs, 'maxPrice', params.maxPrice);
  appendNum(qs, 'minRating', params.minRating);
  appendNum(qs, 'minReviews', params.minReviews);
  if (params.visitType && params.visitType !== 'any') qs.set('visitType', params.visitType);
  appendBool(qs, 'verifiedOnly', params.verifiedOnly);
  appendBool(qs, 'promotionOnly', params.promotionOnly);
  if (params.duration && params.duration !== 'any') qs.set('duration', params.duration);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.page != null) qs.set('page', String(params.page));
  if (params.limit != null) qs.set('limit', String(params.limit));

  const url = `/api/catalog/listings?${qs.toString()}`;
  return fetchPublicGetCached(url, async () => {
    const res = await apiFetch(url, { skipAuth: true });
    if (!res.ok) throw new Error(await readApiError(res));
    return (await res.json()) as CatalogListingsResponseDto;
  });
}

export function catalogItemToListingRecord(item: CatalogListingItemDto): ServiceListingRecord {
  const locDto = item.location;
  const visitType = 'studio' as MasterLocation['visitType'];
  const baseLoc: MasterLocation = locDto
    ? {
        visitType,
        ...(locDto.city?.trim() ? { city: locDto.city.trim() } : {}),
        street: (locDto.publicAddress || '').trim() || LOCATION_EMPTY_SENTINEL,
        building: '',
        ...(typeof locDto.lat === 'number' &&
        Number.isFinite(locDto.lat) &&
        typeof locDto.lng === 'number' &&
        Number.isFinite(locDto.lng)
          ? { lat: locDto.lat, lng: locDto.lng }
          : {}),
      }
    : { visitType, street: LOCATION_EMPTY_SENTINEL, building: '' };

  const name = item.displayName.trim() || 'Мастер';
  const price = item.minServicePrice != null && Number.isFinite(item.minServicePrice) ? item.minServicePrice : 0;
  const serviceName = (item.primaryServiceName && item.primaryServiceName.trim()) || 'Услуга';
  const categoryLabel = item.category?.name?.trim() || item.category?.code || 'Мастер';
  const categoryCode = item.category?.code?.trim() || undefined;

  return {
    id: `${item.masterId}-${item.primaryServiceId ?? 'svc'}`,
    masterId: item.masterId,
    masterName: name,
    category: categoryLabel,
    categoryCode,
    serviceName,
    rating: item.rating,
    reviewsCount: item.reviewsCount,
    isVerified: item.isVerified,
    isProEntitled: item.isProEntitled === true,
    location: baseLoc,
    priceFrom: price,
    photoUrl: masterListingPortraitUrl(item.photoUrl),
    serviceCoverUrl: resolveServiceListingCoverUrl({
      category: categoryLabel,
      categoryCode,
      serviceName,
    }),
    primaryServiceId: item.primaryServiceId ?? undefined,
    nextSlotStartsAt: item.nextSlotStartsAt,
    nextSlotId: item.nextSlotId,
  };
}

export type LocationSuggestionDto = {
  id: string;
  type: 'address';
  title: string;
  subtitle: string;
};

export async function fetchLocationSuggestions(query: string, limit = 12): Promise<LocationSuggestionDto[]> {
  const qs = new URLSearchParams();
  qs.set('query', query.trim());
  qs.set('limit', String(limit));
  const res = await apiFetch(`/api/catalog/location-suggestions?${qs.toString()}`, { skipAuth: true });
  if (!res.ok) throw new Error(await readApiError(res));
  const j = (await res.json()) as { suggestions?: LocationSuggestionDto[] };
  return j.suggestions ?? [];
}
