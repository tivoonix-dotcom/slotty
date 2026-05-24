import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';
import type { ServiceCatalogChip } from '../lib/filterServices';

export type CatalogSortBy = NonNullable<CatalogListingsParams['sortBy']>;
export type CatalogDateRange = NonNullable<CatalogListingsParams['dateRange']>;
export type CatalogTimeOfDay = NonNullable<CatalogListingsParams['timeOfDay']>;
export type CatalogVisitType = NonNullable<CatalogListingsParams['visitType']>;
export type CatalogDuration = NonNullable<CatalogListingsParams['duration']>;
export type PriceTier = 'any' | 'under30' | '30_50' | '50_100' | 'over100';

export type CatalogFiltersState = {
  categoryCode: string | null;
  sortBy: CatalogSortBy;
  dateRange: CatalogDateRange | 'any';
  timeOfDay: CatalogTimeOfDay | 'any';
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
  timeOfDay: 'any',
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

export function catalogFiltersToApiParams(
  filters: CatalogFiltersState,
  search: string,
): CatalogListingsParams {
  const tier = filters.priceTier !== 'any' ? priceTierToRange(filters.priceTier) : null;
  const minPrice = tier?.min ?? filters.minPrice ?? undefined;
  const maxPrice = tier?.max ?? filters.maxPrice ?? undefined;

  let dateRange = filters.dateRange;
  if (filters.chips.has('today') && dateRange === 'any') dateRange = 'today';

  const promotionOnly = filters.promotionOnly || filters.chips.has('promo');

  return {
    limit: 80,
    sortBy: filters.sortBy,
    search: search.trim() || undefined,
    category: filters.categoryCode ?? undefined,
    dateRange: dateRange === 'any' ? undefined : dateRange,
    timeOfDay: filters.timeOfDay === 'any' ? undefined : filters.timeOfDay,
    visitType: filters.visitType === 'any' ? undefined : filters.visitType,
    duration: filters.duration === 'any' ? undefined : filters.duration,
    minPrice: minPrice ?? undefined,
    maxPrice: maxPrice ?? undefined,
    minRating: filters.minRating ?? undefined,
    minReviews: filters.minReviews > 0 ? filters.minReviews : undefined,
    verifiedOnly: filters.verifiedOnly || undefined,
    promotionOnly: promotionOnly || undefined,
  };
}

export function countActiveCatalogFilters(filters: CatalogFiltersState): number {
  let n = 0;
  if (filters.categoryCode) n += 1;
  if (filters.sortBy !== 'recommended') n += 1;
  if (filters.dateRange !== 'any') n += 1;
  if (filters.timeOfDay !== 'any') n += 1;
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
  if (chip === 'today' && chips.has('today')) next.dateRange = 'today';
  if (chip === 'today' && !chips.has('today') && next.dateRange === 'today') next.dateRange = 'any';
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
    };
  }

  const chip = tab as ServiceCatalogChip;
  return {
    ...filters,
    chips: new Set([chip]),
    promotionOnly: chip === 'promo',
  };
}

export const CATALOG_SORT_OPTIONS: Array<{ value: CatalogSortBy; label: string }> = [
  { value: 'recommended', label: 'Сначала популярные' },
  { value: 'soonest', label: 'Ближайшее время' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'reviews', label: 'Больше отзывов' },
];

export const SORT_OPTIONS: Array<{ value: CatalogSortBy; label: string }> = [
  { value: 'recommended', label: 'Популярные' },
  { value: 'soonest', label: 'Ближайшее время' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
  { value: 'reviews', label: 'Больше отзывов' },
];
