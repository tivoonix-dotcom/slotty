import type { CatalogListingsParams } from '../../../features/services/api/catalogListingsApi';
import { normalizeCategoryCode } from '../../../features/catalog/serviceCategoryLabels';

export type CategoryMasterFilters = {
  /** Категория услуг (только каталог мастеров). */
  categoryCode: string | null;
  dateRange: 'any' | 'today' | 'tomorrow' | 'week' | 'weekend';
  timeOfDay: 'any' | 'morning' | 'afternoon' | 'evening';
  visitType: 'any' | 'studio' | 'at_home';
  minRating: '45' | '48' | '49' | null;
  minReviews: '5' | '20' | '50' | null;
  priceTier: 'under30' | '30_50' | '50_100' | 'over100' | null;
  duration: 'any' | 'under30' | '30_60' | '60_120' | 'over120';
  sortBy: NonNullable<CatalogListingsParams['sortBy']>;
  promotionOnly: boolean;
  verifiedOnly: boolean;
  onlyWithSlots: boolean;
};

export const DEFAULT_CATEGORY_MASTER_FILTERS: CategoryMasterFilters = {
  categoryCode: null,
  dateRange: 'any',
  timeOfDay: 'any',
  visitType: 'any',
  minRating: null,
  minReviews: null,
  priceTier: null,
  duration: 'any',
  sortBy: 'recommended',
  promotionOnly: false,
  verifiedOnly: false,
  onlyWithSlots: false,
};

export function filtersToQuickChips(f: CategoryMasterFilters): Set<string> {
  const s = new Set<string>();
  if (f.dateRange === 'today') s.add('today');
  if (f.dateRange === 'tomorrow') s.add('tomorrow');
  if (f.sortBy === 'soonest') s.add('near');
  if (f.sortBy === 'rating' || f.minRating != null) s.add('rating');
  if (f.sortBy === 'price_asc' || f.priceTier != null) s.add('price');
  if (f.visitType === 'at_home') s.add('home');
  if (f.visitType === 'studio') s.add('studio');
  if (f.promotionOnly) s.add('promo');
  return s;
}

export function toggleQuickChip(
  prev: CategoryMasterFilters,
  chipId: string,
): CategoryMasterFilters {
  const active = filtersToQuickChips(prev).has(chipId);
  const on = !active;
  const next = { ...prev };

  switch (chipId) {
    case 'today':
      next.dateRange = on ? 'today' : 'any';
      break;
    case 'tomorrow':
      next.dateRange = on ? 'tomorrow' : 'any';
      break;
    case 'near':
      next.sortBy = on ? 'soonest' : next.sortBy === 'soonest' ? 'recommended' : next.sortBy;
      break;
    case 'rating':
      if (on) {
        next.sortBy = 'rating';
        if (!next.minRating) next.minRating = '45';
      } else {
        next.minRating = null;
        if (next.sortBy === 'rating') next.sortBy = 'recommended';
      }
      break;
    case 'price':
      if (on) next.sortBy = 'price_asc';
      else if (next.sortBy === 'price_asc') next.sortBy = 'recommended';
      break;
    case 'home':
      next.visitType = on ? 'at_home' : 'any';
      break;
    case 'studio':
      next.visitType = on ? 'studio' : 'any';
      break;
    case 'promo':
      next.promotionOnly = on;
      break;
    default:
      break;
  }
  return next;
}

export function filtersToMastersQuickChips(f: CategoryMasterFilters): Set<string> {
  const s = new Set<string>();
  if (f.dateRange === 'today') s.add('today');
  if (f.sortBy === 'soonest') s.add('near');
  if (f.sortBy === 'rating' || f.minRating != null) s.add('top');
  if (f.visitType === 'at_home') s.add('home');
  if (f.visitType === 'studio') s.add('studio');
  return s;
}

export function toggleMastersQuickChip(
  prev: CategoryMasterFilters,
  chipId: string,
): CategoryMasterFilters {
  const active = filtersToMastersQuickChips(prev).has(chipId);
  const on = !active;
  const next = { ...prev };

  switch (chipId) {
    case 'today':
      next.dateRange = on ? 'today' : 'any';
      break;
    case 'near':
      next.sortBy = on ? 'soonest' : next.sortBy === 'soonest' ? 'recommended' : next.sortBy;
      break;
    case 'top':
      if (on) {
        next.sortBy = 'rating';
        next.minRating = null;
      } else {
        next.minRating = null;
        if (next.sortBy === 'rating') next.sortBy = 'recommended';
      }
      break;
    case 'home':
      next.visitType = on ? 'at_home' : 'any';
      break;
    case 'studio':
      next.visitType = on ? 'studio' : 'any';
      break;
    default:
      break;
  }
  return next;
}

export function countActiveCategoryFilters(f: CategoryMasterFilters): number {
  let n = 0;
  if (f.categoryCode) n++;
  if (f.dateRange !== 'any') n++;
  if (f.timeOfDay !== 'any') n++;
  if (f.visitType !== 'any') n++;
  if (f.minRating) n++;
  if (f.minReviews) n++;
  if (f.priceTier) n++;
  if (f.duration !== 'any') n++;
  if (f.sortBy !== 'recommended') n++;
  if (f.promotionOnly) n++;
  if (f.verifiedOnly) n++;
  if (f.onlyWithSlots) n++;
  return n;
}

export function categoryFiltersToApiParams(
  f: CategoryMasterFilters,
  base: Pick<CatalogListingsParams, 'category' | 'limit'> & { search?: string },
  hasGeo: boolean,
  geo?: { userLat?: number | null; userLng?: number | null },
): CatalogListingsParams {
  const p: CatalogListingsParams = { ...base };
  if (base.search?.trim()) p.search = base.search.trim();
  if (f.categoryCode) p.category = normalizeCategoryCode(f.categoryCode);

  if (f.dateRange !== 'any') p.dateRange = f.dateRange;
  if (f.timeOfDay !== 'any') p.timeOfDay = f.timeOfDay;
  if (f.visitType !== 'any') p.visitType = f.visitType;
  if (f.duration !== 'any') p.duration = f.duration;
  if (f.promotionOnly) p.promotionOnly = true;
  if (f.verifiedOnly) p.verifiedOnly = true;
  if (f.onlyWithSlots) p.onlyWithSlots = true;

  const lat = geo?.userLat != null && Number.isFinite(geo.userLat) ? geo.userLat : undefined;
  const lng = geo?.userLng != null && Number.isFinite(geo.userLng) ? geo.userLng : undefined;
  if (lat != null && lng != null) {
    p.lat = lat;
    p.lng = lng;
  }

  if (f.minRating === '45') p.minRating = 4.5;
  else if (f.minRating === '48') p.minRating = 4.8;
  else if (f.minRating === '49') p.minRating = 4.9;

  if (f.minReviews === '5') p.minReviews = 5;
  else if (f.minReviews === '20') p.minReviews = 20;
  else if (f.minReviews === '50') p.minReviews = 50;

  if (f.priceTier === 'under30') p.maxPrice = 30;
  else if (f.priceTier === '30_50') {
    p.minPrice = 30;
    p.maxPrice = 50;
  } else if (f.priceTier === '50_100') {
    p.minPrice = 50;
    p.maxPrice = 100;
  } else if (f.priceTier === 'over100') p.minPrice = 100;

  if (f.sortBy === 'soonest' && hasGeo) p.sortBy = 'soonest';
  else if (f.sortBy !== 'recommended') p.sortBy = f.sortBy;

  return p;
}

/** Есть ли отличия от дефолта (для flatMode каталога). */
export function filtersForTopRankCatalog(
  f: CategoryMasterFilters,
): CategoryMasterFilters {
  return { ...f, minRating: null, sortBy: 'rating' };
}

export function hasActiveCatalogFilters(f: CategoryMasterFilters): boolean {
  return countActiveCategoryFilters(f) > 0;
}

export const MASTER_SORT_OPTIONS: Array<{
  value: CategoryMasterFilters['sortBy'];
  label: string;
}> = [
  { value: 'recommended', label: 'Сначала популярные' },
  { value: 'soonest', label: 'Ближайшее время' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'reviews', label: 'Больше отзывов' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

export type MastersViewTab = 'all' | 'near' | 'today' | 'top';

export const MASTERS_VIEW_TABS: Array<{ id: MastersViewTab; label: string }> = [
  { id: 'all', label: 'Все мастера' },
  { id: 'near', label: 'Рядом' },
  { id: 'today', label: 'Сегодня' },
  { id: 'top', label: 'Топ рейтинг' },
];

export function getMastersViewTab(filters: CategoryMasterFilters): MastersViewTab {
  if (filtersToMastersQuickChips(filters).has('top')) return 'top';
  if (filtersToMastersQuickChips(filters).has('near')) return 'near';
  if (filtersToMastersQuickChips(filters).has('today')) return 'today';
  return 'all';
}

export function setMastersViewTab(
  filters: CategoryMasterFilters,
  tab: MastersViewTab,
): CategoryMasterFilters {
  if (tab === 'all') {
    return {
      ...filters,
      dateRange: 'any',
      sortBy: filters.sortBy === 'soonest' || filters.sortBy === 'rating' ? 'recommended' : filters.sortBy,
      minRating: null,
    };
  }
  return toggleMastersQuickChip(
    {
      ...filters,
      dateRange: 'any',
      sortBy: 'recommended',
      minRating: null,
    },
    tab === 'top' ? 'top' : tab,
  );
}

const MASTERS_CATALOG_SORT_VALUES = new Set<CategoryMasterFilters['sortBy']>([
  'recommended',
  'rating',
  'price_asc',
  'price_desc',
  'reviews',
  'soonest',
]);

/** Query-параметры из mega-menu и прямых ссылок на `/masters`. */
export function parseMastersCatalogFiltersFromSearch(
  searchParams: URLSearchParams,
): CategoryMasterFilters {
  const f: CategoryMasterFilters = { ...DEFAULT_CATEGORY_MASTER_FILTERS };

  const tab = searchParams.get('tab');
  if (tab === 'today') f.dateRange = 'today';
  if (tab === 'near') {
    f.sortBy = 'soonest';
    f.onlyWithSlots = true;
  }
  if (tab === 'top') {
    f.sortBy = 'rating';
  }

  if (searchParams.get('slots') === '1') f.onlyWithSlots = true;
  if (searchParams.get('verified') === '1') f.verifiedOnly = true;
  if (searchParams.get('promo') === '1') f.promotionOnly = true;

  const sort = searchParams.get('sort');
  if (sort && MASTERS_CATALOG_SORT_VALUES.has(sort as CategoryMasterFilters['sortBy'])) {
    f.sortBy = sort as CategoryMasterFilters['sortBy'];
  }

  if (searchParams.get('rating') === '1') {
    f.sortBy = 'rating';
    f.minRating = '45';
  }

  const reviews = searchParams.get('reviews');
  if (reviews === '5' || reviews === '20' || reviews === '50') {
    f.minReviews = reviews;
  }

  const category = searchParams.get('category');
  if (category) f.categoryCode = normalizeCategoryCode(category);

  return f;
}
