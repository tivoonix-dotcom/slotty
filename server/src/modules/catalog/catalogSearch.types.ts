/** Query для GET /api/catalog/listings (серверная фильтрация). */

export type CatalogDateRange = 'any' | 'today' | 'tomorrow' | 'week' | 'weekend';
export type CatalogTimeOfDay = 'any' | 'morning' | 'afternoon' | 'evening';
export type CatalogSortBy =
  | 'recommended'
  | 'rating'
  | 'price_asc'
  | 'price_desc'
  | 'reviews'
  | 'soonest';
export type CatalogDurationPreset = 'any' | 'under30' | '30_60' | '60_120' | 'over120';
export type CatalogVisitType = 'any' | 'studio' | 'at_home';

export type CatalogListingsQuery = {
  search?: string;
  /** Код категории из service_categories.code */
  categoryCode?: string;
  /** id строки master_locations (основной адрес мастера) */
  locationId?: string;
  /** Подстрока по public_address / street / building, если нет locationId */
  addressText?: string;
  dateRange: CatalogDateRange;
  timeOfDay: CatalogTimeOfDay;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minReviews?: number;
  visitType: CatalogVisitType;
  verifiedOnly: boolean;
  promotionOnly: boolean;
  durationPreset: CatalogDurationPreset;
  sortBy: CatalogSortBy;
  page: number;
  limit: number;
};

export type CatalogListingItem = {
  masterId: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  slug: string | null;
  rating: number;
  reviewsCount: number;
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

export type CatalogListingsResult = {
  items: CatalogListingItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type LocationSuggestion = {
  id: string;
  type: 'address';
  title: string;
  subtitle: string;
};
