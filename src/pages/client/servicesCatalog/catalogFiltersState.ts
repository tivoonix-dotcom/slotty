import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';
import type { ServiceCatalogChip } from '../lib/filterServices';
import { formatIsoDateLocal, isFullTimeRange, offsetFromIso } from './catalogFilterDateTime';

export type CatalogSortBy = NonNullable<CatalogListingsParams['sortBy']>;

const CATALOG_SORT_VALUES = new Set<CatalogSortBy>([
  'recommended',
  'popular',
  'soonest',
  'rating',
  'price_asc',
  'price_desc',
  'reviews',
  'distance_asc',
]);
export type CatalogDateRange = NonNullable<CatalogListingsParams['dateRange']>;
export type CatalogTimeOfDay = NonNullable<CatalogListingsParams['timeOfDay']>;
export type CatalogVisitType = NonNullable<CatalogListingsParams['visitType']>;
export type CatalogDuration = NonNullable<CatalogListingsParams['duration']>;
export type PriceTier = 'any' | 'under30' | '30_50' | '50_100' | 'over100';

export type CatalogFiltersState = {
  categoryCode: string | null;
  sortBy: CatalogSortBy;
  dateRange: CatalogDateRange | 'any';
  /** ISO YYYY-MM-DD — точный день для API (приоритет над dateRange). */
  slotDate: string | null;
  /** Смещение от сегодня (0 = сегодня) для UI-карусели дат. */
  dateDayOffset: number | null;
  timeOfDay: CatalogTimeOfDay | 'any';
  /** Диапазон часов для UI-слайдера (0–24). */
  timeStartHour: number;
  timeEndHour: number;
  visitType: CatalogVisitType | 'any';
  duration: CatalogDuration | 'any';
  priceTier: PriceTier;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  minReviews: number;
  verifiedOnly: boolean;
  promotionOnly: boolean;
  onlineBookingOnly: boolean;
  chips: Set<ServiceCatalogChip>;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFiltersState = {
  categoryCode: null,
  sortBy: 'recommended',
  dateRange: 'any',
  slotDate: null,
  dateDayOffset: null,
  timeOfDay: 'any',
  timeStartHour: 0,
  timeEndHour: 24,
  visitType: 'any',
  duration: 'any',
  priceTier: 'any',
  minPrice: null,
  maxPrice: null,
  minRating: null,
  minReviews: 0,
  verifiedOnly: false,
  promotionOnly: false,
  onlineBookingOnly: false,
  chips: new Set(),
};

function priceTierToRange(tier: PriceTier): { min: number | null; max: number | null } {
  switch (tier) {
    case 'under30':
      return { min: null, max: 30 };
    case '30_50':
      return { min: 30, max: 50 };
    case '50_100':
      return { min: 50, max: 100 };
    case 'over100':
      return { min: 100, max: null };
    default:
      return { min: null, max: null };
  }
}

export type CatalogFiltersGeo = {
  userLat?: number | null;
  userLng?: number | null;
};

export function catalogFiltersToApiParams(
  filters: CatalogFiltersState,
  search: string,
  geo?: CatalogFiltersGeo,
): CatalogListingsParams {
  const tier = filters.priceTier !== 'any' ? priceTierToRange(filters.priceTier) : null;
  const minPrice = tier?.min ?? filters.minPrice ?? undefined;
  const maxPrice = tier?.max ?? filters.maxPrice ?? undefined;

  let dateRange = filters.dateRange;
  if (filters.chips.has('today') && dateRange === 'any' && !filters.slotDate) dateRange = 'today';

  const promotionOnly = filters.promotionOnly || filters.chips.has('promo');
  const popularOnly = filters.chips.has('popular');
  const newOnly = filters.chips.has('new');
  const hasExactTime = !isFullTimeRange(filters.timeStartHour, filters.timeEndHour);
  const lat =
    geo?.userLat != null && Number.isFinite(geo.userLat) ? geo.userLat : undefined;
  const lng =
    geo?.userLng != null && Number.isFinite(geo.userLng) ? geo.userLng : undefined;

  return {
    limit: 80,
    sortBy: filters.sortBy,
    search: search.trim() || undefined,
    category: filters.categoryCode ?? undefined,
    slotDate: filters.slotDate ?? undefined,
    dateRange:
      filters.slotDate || dateRange === 'any' ? undefined : dateRange,
    timeFrom: hasExactTime ? filters.timeStartHour : undefined,
    timeTo: hasExactTime ? filters.timeEndHour : undefined,
    timeOfDay:
      hasExactTime || filters.timeOfDay === 'any' ? undefined : filters.timeOfDay,
    visitType: filters.visitType === 'any' ? undefined : filters.visitType,
    duration: filters.duration === 'any' ? undefined : filters.duration,
    minPrice: minPrice ?? undefined,
    maxPrice: maxPrice ?? undefined,
    minRating: filters.minRating ?? undefined,
    minReviews: filters.minReviews > 0 ? filters.minReviews : undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
    promotionOnly: promotionOnly || undefined,
    onlyWithSlots: filters.onlineBookingOnly || undefined,
    popularOnly: popularOnly || undefined,
    newOnly: newOnly || undefined,
    lat,
    lng,
  };
}

export function countActiveCatalogFilters(filters: CatalogFiltersState): number {
  let n = 0;
  if (filters.categoryCode) n += 1;
  if (filters.sortBy !== 'recommended') n += 1;
  if (filters.slotDate || filters.dateRange !== 'any') n += 1;
  if (!isFullTimeRange(filters.timeStartHour, filters.timeEndHour) || filters.timeOfDay !== 'any') {
    n += 1;
  }
  if (filters.visitType !== 'any') n += 1;
  if (filters.duration !== 'any') n += 1;
  if (filters.priceTier !== 'any' || filters.minPrice != null || filters.maxPrice != null) n += 1;
  if (filters.minRating != null) n += 1;
  if (filters.minReviews > 0) n += 1;
  if (filters.verifiedOnly) n += 1;
  if (filters.promotionOnly) n += 1;
  if (filters.onlineBookingOnly) n += 1;
  n += filters.chips.size;
  return n;
}

export function toggleCatalogChip(
  filters: CatalogFiltersState,
  chip: ServiceCatalogChip,
): CatalogFiltersState {
  const chips = new Set(filters.chips);
  if (chips.has(chip)) chips.delete(chip);
  else chips.add(chip);
  const next = { ...filters, chips };
  if (chip === 'promo') next.promotionOnly = chips.has('promo');
  if (chip === 'today' && chips.has('today')) {
    next.dateRange = 'today';
    next.dateDayOffset = 0;
    next.slotDate = formatIsoDateLocal(new Date());
  }
  if (chip === 'today' && !chips.has('today') && next.dateRange === 'today') {
    next.dateRange = 'any';
    next.dateDayOffset = null;
    next.slotDate = null;
  }
  return next;
}

export function resetCatalogFilters(): CatalogFiltersState {
  return {
    ...DEFAULT_CATALOG_FILTERS,
    chips: new Set(),
  };
}

/** Верхние табы каталога: все / популярные / акции */
export type CatalogViewTab = 'all' | 'popular' | 'promo' | 'new';

export const CATALOG_VIEW_TABS: Array<{ id: CatalogViewTab; label: string }> = [
  { id: 'all', label: 'Все услуги' },
  { id: 'popular', label: 'Популярные' },
  { id: 'promo', label: 'С акциями' },
  { id: 'new', label: 'Новинки' },
];

export function getCatalogViewTab(filters: CatalogFiltersState): CatalogViewTab {
  if (filters.chips.has('promo') || filters.promotionOnly) return 'promo';
  if (filters.chips.has('popular')) return 'popular';
  if (filters.chips.has('new')) return 'new';
  return 'all';
}

export function setCatalogViewTab(
  filters: CatalogFiltersState,
  tab: CatalogViewTab,
): CatalogFiltersState {
  if (tab === 'all') {
    const chips = new Set(filters.chips);
    chips.delete('popular');
    chips.delete('promo');
    chips.delete('new');
    return {
      ...filters,
      chips,
      promotionOnly: false,
      sortBy: filters.sortBy === 'popular' ? 'recommended' : filters.sortBy,
    };
  }

  const chip = tab as ServiceCatalogChip;
  return {
    ...filters,
    chips: new Set([chip]),
    promotionOnly: chip === 'promo',
    sortBy: tab === 'popular' ? 'popular' : filters.sortBy,
  };
}

export const CATALOG_SORT_OPTIONS: Array<{ value: CatalogSortBy; label: string }> = [
  { value: 'recommended', label: 'Сначала популярные' },
  { value: 'soonest', label: 'Ближайшее время' },
  { value: 'distance_asc', label: 'Ближе ко мне' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'reviews', label: 'Больше отзывов' },
];

export const SORT_OPTIONS: Array<{ value: CatalogSortBy; label: string }> = [
  { value: 'recommended', label: 'Популярные' },
  { value: 'soonest', label: 'Ближайшее время' },
  { value: 'distance_asc', label: 'Ближе ко мне' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'reviews', label: 'Больше отзывов' },
];

export function parseCatalogFiltersFromSearch(
  searchParams: URLSearchParams,
): CatalogFiltersState {
  const chips = new Set<ServiceCatalogChip>();
  const tab = searchParams.get('tab');
  if (tab === 'popular') chips.add('popular');
  if (tab === 'promo') chips.add('promo');
  if (tab === 'new') chips.add('new');

  const sortRaw = searchParams.get('sort');
  const sortBy =
    sortRaw && CATALOG_SORT_VALUES.has(sortRaw as CatalogSortBy)
      ? (sortRaw as CatalogSortBy)
      : chips.has('popular')
        ? 'popular'
        : 'recommended';

  const slotDateRaw = searchParams.get('slotDate')?.trim();
  let slotDate: string | null = null;
  let dateDayOffset: number | null = null;
  let dateRange: CatalogDateRange | 'any' = 'any';
  if (slotDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(slotDateRaw)) {
    slotDate = slotDateRaw;
    dateDayOffset = offsetFromIso(slotDateRaw);
    if (dateDayOffset === 0) {
      dateRange = 'today';
      chips.add('today');
    } else if (dateDayOffset === 1) {
      dateRange = 'tomorrow';
    }
  }

  return {
    ...DEFAULT_CATALOG_FILTERS,
    chips,
    sortBy,
    promotionOnly: chips.has('promo'),
    slotDate,
    dateDayOffset,
    dateRange,
  };
}
