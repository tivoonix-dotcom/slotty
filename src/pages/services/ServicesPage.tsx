import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingPath, getMasterPath, getProfilePath, ADMIN_SERVICES_PATH } from '../../app/paths';
import { fetchPublicSlots, type PublicSlotDto } from '../../features/booking/api/publicSlotsApi';
import { catalogItemToListingRecord, fetchCatalogListings } from '../../features/services/api/catalogListingsApi';
import type { CatalogListingsParams } from '../../features/services/api/catalogListingsApi';
import type { ServiceListingRecord } from '../../features/services/model/demoMasters';
import {
  DEMO_SERVICE_LISTINGS,
  formatReviewsCountLabel,
} from '../../features/services/model/demoMasters';
import {
  formatPublicAddress,
  masterLocationSearchHaystack,
} from '../../features/profile/model/masterLocation';
import { useAuth } from '../../features/auth/AuthProvider';
import { isDemoMaster } from '../../features/profile/lib/demoMasterStorage';
import { getDemoQuickSlots } from '../../features/services/model/demoQuickSlots';
import { setProfileRole } from '../../features/profile/lib/setProfileRole';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import { HomeHeader } from '../HomeHeader';
import { ServicesNearQuickSlots } from './ServicesNearQuickSlots';
import { ServicesDbLocationField } from './ServicesDbLocationField';

const PILL_LABELS = ['Все', 'Маникюр', 'Барберы', 'Брови', 'Массаж', 'Тату'] as const;

/** Код категории в БД для query каталога и слотов */
const CATEGORY_CODE_BY_LABEL: Record<string, string> = {
  Маникюр: 'manicure',
  Барберы: 'barbers',
  Брови: 'brows-lashes',
  Массаж: 'massage',
  Тату: 'tattoo',
};

const DAY_MS = 86_400_000;

type RatingFilter = 'any' | '4.5' | '4.7' | '4.9';
type PriceFilter = 'any' | 'under30' | 'range30_50' | 'range50_100' | 'over100';
type AvailabilityFilter = 'any' | 'today' | 'tomorrow' | 'week' | 'weekend';
type TimeOfDayFilter = 'any' | 'morning' | 'afternoon' | 'evening';
type VisitTypeFilter = 'any' | 'studio' | 'at_home';
type DurationFilter = 'any' | 'under30' | '30_60' | '60_120' | 'over120';
type ReviewsMinFilter = 0 | 5 | 10 | 20;
type SortBy = 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'reviews' | 'soonest';

type AppliedFilters = {
  search: string;
  category: string | null;
  locationId: string | null;
  address: string;
  minRating: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  availability: AvailabilityFilter;
  timeOfDay: TimeOfDayFilter;
  visitType: VisitTypeFilter;
  minReviews: ReviewsMinFilter;
  verifiedOnly: boolean;
  promotionOnly: boolean;
  duration: DurationFilter;
  sortBy: SortBy;
};

type ModalDraft = {
  category: string | null;
  locationId: string | null;
  address: string;
  rating: RatingFilter;
  price: PriceFilter;
  minPrice: string;
  maxPrice: string;
  availability: AvailabilityFilter;
  timeOfDay: TimeOfDayFilter;
  visitType: VisitTypeFilter;
  minReviews: ReviewsMinFilter;
  verifiedOnly: boolean;
  promotionOnly: boolean;
  duration: DurationFilter;
  sortBy: SortBy;
};

type ServicesCatalogState =
  | { kind: 'demo' }
  | {
      kind: 'api';
      phase: 'loading' | 'error' | 'ok';
      listings: ServiceListingRecord[];
      quickSlots: PublicSlotDto[];
      total: number;
    };

type ListingAvailability = {
  hasSlots: boolean;
  bucket: 'today' | 'tomorrow' | 'week' | 'none';
  label: string;
  tone: 'good' | 'soon' | 'none';
};

const defaultApplied: AppliedFilters = {
  search: '',
  category: null,
  locationId: null,
  address: '',
  minRating: null,
  minPrice: null,
  maxPrice: null,
  availability: 'any',
  timeOfDay: 'any',
  visitType: 'any',
  minReviews: 0,
  verifiedOnly: false,
  promotionOnly: false,
  duration: 'any',
  sortBy: 'recommended',
};

function isAppliedDefault(filters: AppliedFilters, searchUsed: string): boolean {
  return (
    !filters.category &&
    !searchUsed.trim() &&
    !filters.locationId &&
    !filters.address.trim() &&
    filters.minRating == null &&
    filters.minPrice == null &&
    filters.maxPrice == null &&
    filters.availability === 'any' &&
    filters.timeOfDay === 'any' &&
    filters.visitType === 'any' &&
    filters.minReviews === 0 &&
    !filters.verifiedOnly &&
    !filters.promotionOnly &&
    filters.duration === 'any' &&
    filters.sortBy === 'recommended'
  );
}

function filtersAreActive(filters: AppliedFilters): boolean {
  return !isAppliedDefault(filters, filters.search);
}

/** Подпись категории в демо-данных (мастера с «Брови и ресницы»). */
function categoryForDemoData(pillCategory: string | null): string | null {
  if (!pillCategory || pillCategory === 'Все') return null;
  if (pillCategory === 'Брови') return 'Брови и ресницы';
  return pillCategory;
}

function categoryMatchesListing(pillCategory: string | null, rowCategory: string): boolean {
  if (!pillCategory) return true;
  if (pillCategory === 'Брови') return rowCategory === 'Брови и ресницы';
  return rowCategory === pillCategory;
}

function ratingToMin(rating: RatingFilter): number | null {
  if (rating === 'any') return null;
  return Number(rating);
}

function draftFromPriceChip(price: Exclude<PriceFilter, 'any'>): Pick<ModalDraft, 'price' | 'minPrice' | 'maxPrice'> {
  const r = priceChipToRange(price);
  return {
    price,
    minPrice: r.min != null ? String(r.min) : '',
    maxPrice: r.max != null ? String(r.max) : '',
  };
}

function priceChipToRange(price: PriceFilter): { min: number | null; max: number | null } {
  switch (price) {
    case 'any':
      return { min: null, max: null };
    case 'under30':
      return { min: null, max: 30 };
    case 'range30_50':
      return { min: 30, max: 50 };
    case 'range50_100':
      return { min: 50, max: 100 };
    case 'over100':
      return { min: 100, max: null };
    default:
      return { min: null, max: null };
  }
}

function parseMoneyInput(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function inferPriceChipFromRange(min: number | null, max: number | null): PriceFilter {
  if (min == null && max == null) return 'any';
  if (min == null && max === 30) return 'under30';
  if (min === 30 && max === 50) return 'range30_50';
  if (min === 50 && max === 100) return 'range50_100';
  if (min === 100 && max == null) return 'over100';
  return 'any';
}

function appliedPriceDraftFromApplied(applied: AppliedFilters): Pick<ModalDraft, 'price' | 'minPrice' | 'maxPrice'> {
  return {
    price: inferPriceChipFromRange(applied.minPrice, applied.maxPrice),
    minPrice: applied.minPrice != null ? String(applied.minPrice) : '',
    maxPrice: applied.maxPrice != null ? String(applied.maxPrice) : '',
  };
}

function resolveModalPrices(draft: ModalDraft): { minPrice: number | null; maxPrice: number | null } {
  if (draft.price !== 'any') {
    const chip = priceChipToRange(draft.price);
    return { minPrice: chip.min, maxPrice: chip.max };
  }
  let mn = parseMoneyInput(draft.minPrice);
  let mx = parseMoneyInput(draft.maxPrice);
  if (mn != null && mx != null && mn > mx) {
    const t = mn;
    mn = mx;
    mx = t;
  }
  return { minPrice: mn, maxPrice: mx };
}

function minRatingToDraft(value: number | null): RatingFilter {
  if (value == null) return 'any';
  if (value >= 4.9) return '4.9';
  if (value >= 4.7) return '4.7';
  return '4.5';
}

function mapSortToApi(sortBy: SortBy): NonNullable<CatalogListingsParams['sortBy']> {
  return sortBy;
}

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getAvailability(item: ServiceListingRecord, allowDemoFake = true): ListingAvailability {
  if (item.nextSlotStartsAt) {
    const slotStart = new Date(item.nextSlotStartsAt);
    if (!Number.isNaN(slotStart.getTime())) {
      const anchor = new Date();
      anchor.setHours(0, 0, 0, 0);
      const slotDay = new Date(slotStart);
      slotDay.setHours(0, 0, 0, 0);
      const diff = Math.round((slotDay.getTime() - anchor.getTime()) / DAY_MS);
      const time = slotStart.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (diff === 0) return { hasSlots: true, bucket: 'today', label: `Сегодня, ${time}`, tone: 'good' };
      if (diff === 1) return { hasSlots: true, bucket: 'tomorrow', label: `Завтра, ${time}`, tone: 'good' };
      if (diff >= 2 && diff <= 7) return { hasSlots: true, bucket: 'week', label: `На этой неделе, ${time}`, tone: 'soon' };
      if (diff > 7) return { hasSlots: true, bucket: 'week', label: `Есть окна, ${time}`, tone: 'soon' };
    }
  }

  if (!allowDemoFake) {
    return {
      hasSlots: false,
      bucket: 'none',
      label: 'Нет свободного времени',
      tone: 'none',
    };
  }

  const hash = hashString(`${item.id}-${item.masterId}-${item.serviceName}`);
  const variant = hash % 5;
  const time = ['10:00', '12:30', '14:00', '16:15', '18:00'][hash % 5];

  if (variant === 0) {
    return {
      hasSlots: true,
      bucket: 'today',
      label: `Сегодня, ${time}`,
      tone: 'good',
    };
  }

  if (variant === 1) {
    return {
      hasSlots: true,
      bucket: 'tomorrow',
      label: `Завтра, ${time}`,
      tone: 'good',
    };
  }

  if (variant === 2 || variant === 3) {
    return {
      hasSlots: true,
      bucket: 'week',
      label: `На этой неделе, ${time}`,
      tone: 'soon',
    };
  }

  return {
    hasSlots: false,
    bucket: 'none',
    label: 'Нет свободного времени',
    tone: 'none',
  };
}

function availabilityMatches(item: ServiceListingRecord, filter: AvailabilityFilter): boolean {
  if (filter === 'any') return true;

  const availability = getAvailability(item);

  if (filter === 'today') return availability.bucket === 'today';
  if (filter === 'tomorrow') return availability.bucket === 'tomorrow';
  if (filter === 'weekend') {
    if (item.nextSlotStartsAt) {
      const d = new Date(item.nextSlotStartsAt);
      const dow = d.getDay();
      return dow === 0 || dow === 6;
    }
    return availability.bucket === 'today' || availability.bucket === 'tomorrow' || availability.bucket === 'week';
  }
  if (filter === 'week') {
    return availability.bucket === 'today' || availability.bucket === 'tomorrow' || availability.bucket === 'week';
  }
  return false;
}

function availabilityRank(item: ServiceListingRecord): number {
  const availability = getAvailability(item);

  if (availability.bucket === 'today') return 0;
  if (availability.bucket === 'tomorrow') return 1;
  if (availability.bucket === 'week') return 2;

  return 3;
}

function filterListings(rows: ServiceListingRecord[], filters: AppliedFilters): ServiceListingRecord[] {
  const query = filters.search.trim().toLowerCase();
  const address = filters.address.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.category && !categoryMatchesListing(filters.category, row.category)) return false;
    if (filters.minRating != null && row.rating < filters.minRating) return false;
    if (filters.minPrice != null && row.priceFrom < filters.minPrice) return false;
    if (filters.maxPrice != null && row.priceFrom > filters.maxPrice) return false;
    if (filters.minReviews > 0 && row.reviewsCount < filters.minReviews) return false;
    if (filters.visitType !== 'any' && row.location.visitType !== filters.visitType) return false;
    if (!availabilityMatches(row, filters.availability)) return false;

    if (address && !masterLocationSearchHaystack(row.location).includes(address)) {
      return false;
    }

    if (!query) return true;

    const haystack = `
      ${row.serviceName}
      ${row.masterName}
      ${row.category}
      ${masterLocationSearchHaystack(row.location)}
    `.toLowerCase();

    return haystack.includes(query);
  });
}

function sortListings(rows: ServiceListingRecord[], sortBy: SortBy): ServiceListingRecord[] {
  const next = [...rows];

  if (sortBy === 'recommended') {
    return next.sort((a, b) => {
      const availabilityDiff = availabilityRank(a) - availabilityRank(b);
      if (availabilityDiff !== 0) return availabilityDiff;

      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;

      return b.reviewsCount - a.reviewsCount;
    });
  }

  if (sortBy === 'rating') {
    return next.sort((a, b) => b.rating - a.rating);
  }

  if (sortBy === 'price_asc') {
    return next.sort((a, b) => a.priceFrom - b.priceFrom);
  }

  if (sortBy === 'price_desc') {
    return next.sort((a, b) => b.priceFrom - a.priceFrom);
  }

  if (sortBy === 'soonest') {
    return next.sort((a, b) => {
      const ta = a.nextSlotStartsAt ? new Date(a.nextSlotStartsAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.nextSlotStartsAt ? new Date(b.nextSlotStartsAt).getTime() : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return b.rating - a.rating;
    });
  }

  return next.sort((a, b) => b.reviewsCount - a.reviewsCount);
}

function availabilityLabel(value: AvailabilityFilter): string {
  if (value === 'today') return 'Сегодня';
  if (value === 'tomorrow') return 'Завтра';
  if (value === 'week') return 'На этой неделе';
  if (value === 'weekend') return 'Выходные';
  return 'Любое время';
}

function timeOfDayLabel(value: TimeOfDayFilter): string {
  if (value === 'morning') return 'Утро 8–12';
  if (value === 'afternoon') return 'День 12–17';
  if (value === 'evening') return 'Вечер 17–22';
  return '';
}

function visitTypeLabel(value: VisitTypeFilter): string {
  if (value === 'studio') return 'В салоне';
  if (value === 'at_home') return 'Выезд на дом';
  return '';
}

function durationLabel(value: DurationFilter): string {
  if (value === 'under30') return 'До 30 мин';
  if (value === '30_60') return '30–60 мин';
  if (value === '60_120') return '1–2 ч';
  if (value === 'over120') return 'Больше 2 ч';
  return '';
}

function sortLabel(value: SortBy): string {
  if (value === 'rating') return 'По рейтингу';
  if (value === 'price_asc') return 'Сначала дешевле';
  if (value === 'price_desc') return 'Сначала дороже';
  if (value === 'reviews') return 'Больше отзывов';
  if (value === 'soonest') return 'Ближайшее время';
  return 'Рекомендуемые';
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ServicesListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4" aria-hidden>
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="h-52 animate-pulse rounded-[34px] bg-[#F1EFEF] p-4 shadow-[0_18px_55px_rgba(17,17,17,0.05)]"
        />
      ))}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
        active
          ? 'bg-[#E29595] text-white'
          : 'bg-[#F1EFEF] text-neutral-700'
      }`}
    >
      {children}
    </button>
  );
}

function ServiceCard({
  item,
  imagePriority,
  isDemoAvailability,
}: {
  item: ServiceListingRecord;
  imagePriority?: boolean;
  isDemoAvailability: boolean;
}) {
  const navigate = useNavigate();
  const masterPath = getMasterPath(item.masterId);
  const bookingPath = getBookingPath(
    item.masterId,
    item.primaryServiceId ?? undefined,
    item.nextSlotId ?? undefined,
    {
      from: 'services',
    },
  );
  const availability = getAvailability(item, isDemoAvailability);

  return (
    <article
      role="button"
      tabIndex={0}
      className="animate-fade-enter cursor-pointer rounded-[34px] bg-[#F1EFEF] p-3 shadow-[0_18px_55px_rgba(17,17,17,0.05)] outline-none transition active:scale-[0.995]"
      style={{ animationDelay: '40ms' }}
      aria-label={`Открыть профиль мастера ${item.masterName}`}
      onClick={() => navigate(masterPath)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(masterPath);
        }
      }}
    >
      <div className="rounded-[30px] bg-white p-4 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
        <div className="flex gap-4">
          <div className="h-[7.25rem] w-[7.25rem] shrink-0 overflow-hidden rounded-[26px] bg-[#F1EFEF] shadow-sm">
            <ImageReveal
              src={item.photoUrl}
              alt=""
              width={160}
              height={160}
              className="h-full w-full object-cover"
              loading={imagePriority ? 'eager' : 'lazy'}
              fetchPriority={imagePriority ? 'high' : 'low'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                  {item.masterName}
                </p>

                <p className="mt-1 text-[14px] font-medium text-neutral-400">
                  {item.category}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#F1EFEF] px-2.5 py-1.5">
                <IconStar className="text-[#E29595]" />
                <span className="text-[13px] font-semibold tabular-nums text-neutral-900">
                  {item.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <h2 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.035em] text-neutral-900">
              {item.serviceName}
            </h2>

            <p className="mt-2 truncate text-[13px] leading-snug text-neutral-500">
              {formatPublicAddress(item.location)}
            </p>

            <p className="mt-1 text-[13px] font-medium text-neutral-400">
              {formatReviewsCountLabel(item.reviewsCount)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
          <div
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold ${
              availability.tone === 'good'
                ? 'bg-[#EAFBF2] text-[#2F8A5B]'
                : availability.tone === 'soon'
                  ? 'bg-[#FFF4E8] text-[#B66A24]'
                  : 'bg-[#F3F1F1] text-neutral-500'
            }`}
          >
            <IconClock className="h-4 w-4" />
            <span className="truncate">{availability.label}</span>
          </div>

          <p className="text-right">
            <span className="text-[13px] font-medium text-neutral-400">от </span>
            <span className="text-[24px] font-semibold leading-none tracking-[-0.055em] text-neutral-950">
              {item.priceFrom}
            </span>
            <span className="ml-1 text-[14px] font-semibold text-neutral-500">BYN</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            onClick={(event) => {
              event.stopPropagation();
              navigate(masterPath);
            }}
          >
            Профиль
          </button>

          <button
            type="button"
            className="flex min-h-12 flex-[1.2] items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
            onClick={(event) => {
              event.stopPropagation();
              const canDirectBook = Boolean(item.primaryServiceId);
              if (!canDirectBook) {
                navigate(masterPath);
                return;
              }
              navigate(availability.hasSlots ? bookingPath : masterPath);
            }}
          >
            {availability.hasSlots && item.primaryServiceId ? 'Записаться' : 'Подробнее'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ServicesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const demoMaster = isDemoMaster();
  const showMasterCabinetCta = profile?.role === 'master';

  const pickClientRoleAnd = useCallback(
    async (path: string) => {
      void setProfileRole('client');
      navigate(path);
    },
    [navigate],
  );

  const onProfileTab = useCallback(
    (tab: 'appointments' | 'favorites') => {
      void pickClientRoleAnd(getProfilePath(tab));
    },
    [pickClientRoleAnd],
  );

  const [applied, setApplied] = useState<AppliedFilters>(defaultApplied);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState<ModalDraft>(() => ({
    category: null,
    locationId: null,
    address: '',
    rating: 'any',
    price: 'any',
    minPrice: '',
    maxPrice: '',
    availability: 'any',
    timeOfDay: 'any',
    visitType: 'any',
    minReviews: 0,
    verifiedOnly: false,
    promotionOnly: false,
    duration: 'any',
    sortBy: 'recommended',
  }));

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [catalogRetrySeq, setCatalogRetrySeq] = useState(0);
  const [dbListingsExist, setDbListingsExist] = useState<boolean | null>(null);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const [catalog, setCatalog] = useState<ServicesCatalogState>(() =>
    getApiBaseUrl() ? { kind: 'api', phase: 'loading', listings: [], quickSlots: [], total: 0 } : { kind: 'demo' },
  );

  const activePill = applied.category ?? 'Все';
  const deferredSearch = useDeferredValue(applied.search);
  const searchPending = applied.search !== deferredSearch;

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setCatalog({ kind: 'demo' });
      setDbListingsExist(null);
      return;
    }
    const label = applied.category ?? 'Все';
    const catCode = label === 'Все' ? undefined : CATEGORY_CODE_BY_LABEL[label];
    let cancelled = false;
    setCatalog((prev) =>
      prev.kind === 'api'
        ? { ...prev, phase: 'loading', listings: [] }
        : { kind: 'api', phase: 'loading', listings: [], quickSlots: [], total: 0 },
    );
    (async () => {
      try {
        const [listingsRes, slots] = await Promise.all([
          fetchCatalogListings({
            search: deferredSearch.trim() || undefined,
            category: catCode,
            locationId: applied.locationId ?? undefined,
            address: applied.locationId ? undefined : applied.address.trim() || undefined,
            dateRange: applied.availability === 'any' ? undefined : applied.availability,
            timeOfDay: applied.timeOfDay === 'any' ? undefined : applied.timeOfDay,
            minPrice: applied.minPrice ?? undefined,
            maxPrice: applied.maxPrice ?? undefined,
            minRating: applied.minRating ?? undefined,
            minReviews: applied.minReviews > 0 ? applied.minReviews : undefined,
            visitType: applied.visitType === 'any' ? undefined : applied.visitType,
            verifiedOnly: applied.verifiedOnly,
            promotionOnly: applied.promotionOnly,
            duration: applied.duration === 'any' ? undefined : applied.duration,
            sortBy: mapSortToApi(applied.sortBy),
            page: 1,
            limit: 80,
          }),
          fetchPublicSlots({ category: catCode, limit: 14 }),
        ]);
        if (cancelled) return;
        if (isAppliedDefault(applied, deferredSearch)) {
          setDbListingsExist(listingsRes.total > 0);
        }
        setCatalog({
          kind: 'api',
          phase: 'ok',
          listings: listingsRes.items.map(catalogItemToListingRecord),
          quickSlots: slots,
          total: listingsRes.total,
        });
      } catch {
        if (cancelled) return;
        setCatalog({ kind: 'api', phase: 'error', listings: [], quickSlots: [], total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    deferredSearch,
    applied.category,
    applied.locationId,
    applied.address,
    applied.minRating,
    applied.minPrice,
    applied.maxPrice,
    applied.availability,
    applied.timeOfDay,
    applied.visitType,
    applied.minReviews,
    applied.verifiedOnly,
    applied.promotionOnly,
    applied.duration,
    applied.sortBy,
    catalogRetrySeq,
  ]);

  const filtered = useMemo(() => {
    if (catalog.kind === 'demo') {
      const rows = filterListings(DEMO_SERVICE_LISTINGS, applied);
      return sortListings(rows, applied.sortBy);
    }
    if (catalog.phase === 'loading' || catalog.phase === 'error') return [];
    return catalog.listings;
  }, [applied, catalog]);

  const resultTotal = useMemo(() => {
    if (catalog.kind === 'demo') return filtered.length;
    if (catalog.phase === 'ok') return catalog.total;
    return filtered.length;
  }, [catalog, filtered.length]);

  const quickSlotsProp = useMemo((): PublicSlotDto[] | 'loading' | 'error' | undefined => {
    if (catalog.kind === 'demo') return undefined;
    if (catalog.phase === 'loading') return 'loading';
    if (catalog.phase === 'error') return 'error';
    return catalog.quickSlots;
  }, [catalog]);

  const isError = catalog.kind === 'api' && catalog.phase === 'error';
  const isLoading = catalog.kind === 'api' && catalog.phase === 'loading';
  const hasSearchQuery = applied.search.trim().length > 0;
  const hasResults = filtered.length > 0;
  const hasServicesInDatabase = useMemo(() => {
    if (catalog.kind === 'demo') return DEMO_SERVICE_LISTINGS.length > 0;
    return dbListingsExist === true;
  }, [catalog.kind, dbListingsExist]);

  const catalogGloballyEmpty = catalog.kind === 'api' && dbListingsExist === false;

  const hasAvailableSlots = useMemo(() => {
    if (catalog.kind === 'demo') {
      return getDemoQuickSlots({ category: categoryForDemoData(applied.category), maxSlots: 6 }).length > 0;
    }
    if (catalog.phase !== 'ok') return false;
    return catalog.quickSlots.length > 0;
  }, [catalog, applied.category]);

  const showNearQuickSlotsSection =
    !isError &&
    !catalogGloballyEmpty &&
    hasServicesInDatabase &&
    (catalog.kind === 'demo'
      ? hasAvailableSlots
      : isLoading ||
        quickSlotsProp === 'loading' ||
        quickSlotsProp === 'error' ||
        (Array.isArray(quickSlotsProp) && quickSlotsProp.length > 0));

  const showFoundRow =
    hasServicesInDatabase && (hasResults || hasSearchQuery || filtersAreActive(applied));

  const awaitingListData = isLoading || searchPending;

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];

    if (applied.search.trim()) labels.push(`«${applied.search.trim()}»`);
    if (applied.address.trim() || applied.locationId) labels.push(applied.address.trim() || 'Адрес');
    if (applied.minRating != null) labels.push(`${applied.minRating}+ рейтинг`);
    if (applied.minPrice != null || applied.maxPrice != null) {
      const a = applied.minPrice != null ? `от ${applied.minPrice}` : '';
      const b = applied.maxPrice != null ? `до ${applied.maxPrice} BYN` : '';
      labels.push([a, b].filter(Boolean).join(' ').trim());
    }
    if (applied.availability !== 'any') labels.push(availabilityLabel(applied.availability));
    if (applied.timeOfDay !== 'any') {
      const t = timeOfDayLabel(applied.timeOfDay);
      if (t) labels.push(t);
    }
    if (applied.visitType !== 'any') {
      const v = visitTypeLabel(applied.visitType);
      if (v) labels.push(v);
    }
    if (applied.minReviews > 0) labels.push(`от ${applied.minReviews} отзывов`);
    if (applied.verifiedOnly) labels.push('Проверенные');
    if (applied.promotionOnly) labels.push('Акции и скидки');
    if (applied.duration !== 'any') {
      const d = durationLabel(applied.duration);
      if (d) labels.push(d);
    }
    if (applied.sortBy !== 'recommended') labels.push(sortLabel(applied.sortBy));

    return labels;
  }, [applied]);

  const openFilterModal = useCallback(() => {
    setModalDraft({
      category: applied.category,
      locationId: applied.locationId,
      address: applied.address,
      rating: minRatingToDraft(applied.minRating),
      ...appliedPriceDraftFromApplied(applied),
      availability: applied.availability,
      timeOfDay: applied.timeOfDay,
      visitType: applied.visitType,
      minReviews: applied.minReviews,
      verifiedOnly: applied.verifiedOnly,
      promotionOnly: applied.promotionOnly,
      duration: applied.duration,
      sortBy: applied.sortBy,
    });

    setFilterOpen(true);
  }, [applied]);

  useEffect(() => {
    if (!filterOpen && !sortSheetOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterOpen(false);
        setSortSheetOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [filterOpen, sortSheetOpen]);

  const setSearch = useCallback((search: string) => {
    setApplied((current) => ({
      ...current,
      search,
    }));
  }, []);

  const setPillCategory = useCallback((label: (typeof PILL_LABELS)[number]) => {
    setApplied((current) => ({
      ...current,
      category: label === 'Все' ? null : label,
    }));
  }, []);

  const resetAllFilters = useCallback(() => {
    setApplied(defaultApplied);
  }, []);

  const handleShowAllListings = useCallback(() => {
    setApplied(defaultApplied);
  }, []);

  const applyModal = useCallback(() => {
    const { minPrice, maxPrice } = resolveModalPrices(modalDraft);
    setApplied((current) => ({
      ...current,
      category: modalDraft.category,
      locationId: modalDraft.locationId,
      address: modalDraft.address,
      minRating: ratingToMin(modalDraft.rating),
      minPrice,
      maxPrice,
      availability: modalDraft.availability,
      timeOfDay: modalDraft.timeOfDay,
      visitType: modalDraft.visitType,
      minReviews: modalDraft.minReviews,
      verifiedOnly: modalDraft.verifiedOnly,
      promotionOnly: modalDraft.promotionOnly,
      duration: modalDraft.duration,
      sortBy: modalDraft.sortBy,
    }));

    setFilterOpen(false);
  }, [modalDraft]);

  const resetModalDraft = useCallback(() => {
    setModalDraft({
      category: null,
      locationId: null,
      address: '',
      rating: 'any',
      price: 'any',
      minPrice: '',
      maxPrice: '',
      availability: 'any',
      timeOfDay: 'any',
      visitType: 'any',
      minReviews: 0,
      verifiedOnly: false,
      promotionOnly: false,
      duration: 'any',
      sortBy: 'recommended',
    });
  }, []);

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <HomeHeader isDemoMaster={demoMaster} onProfileTab={onProfileTab} />

      <main className="mx-auto max-w-[1100px] px-4 pb-10 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:px-6">
        <div className="mx-auto max-w-lg">
          <section className="rounded-[38px] bg-[#F1EFEF] p-3 shadow-[0_20px_60px_rgba(17,17,17,0.05)]">
            <div className="rounded-[32px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">


              <h1 className="mt-2 text-[34px] font-semibold leading-[1.02] tracking-[-0.07em] text-neutral-950">
                Найдите услугу
              </h1>


              <label className="mt-5 block">
                <span className="sr-only">Услуга, мастер или салон</span>

                <div className="flex items-center gap-3 rounded-[26px] bg-[#F1EFEF] px-4 py-3.5">
                  <IconSearch className="shrink-0 text-neutral-400" />

                  <input
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    role="searchbox"
                    value={applied.search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Услуга, мастер или салон"
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
                    autoComplete="off"
                  />
                  {applied.search.trim() ? (
                    <button
                      type="button"
                      aria-label="Очистить поиск"
                      className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[13px] font-semibold text-neutral-500 transition hover:bg-white active:scale-[0.98]"
                      onClick={() => setSearch('')}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                {searchPending ? (
                  <p className="mt-2 text-[12px] font-medium text-neutral-400">Подождите, обновляем результаты…</p>
                ) : null}
              </label>
            </div>
          </section>

          <div className="mt-5 flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PILL_LABELS.map((label) => {
              const active = label === activePill;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPillCategory(label)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-[15px] font-semibold transition active:scale-[0.98] ${
                    active
                      ? 'bg-[#E29595] text-white'
                      : 'bg-[#F1EFEF] text-neutral-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {!filterOpen ? (
            <div className="mt-4">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Район или адрес</p>
              <ServicesDbLocationField
                locationId={applied.locationId}
                addressLine={applied.address}
                onChange={(next) =>
                  setApplied((current) => ({
                    ...current,
                    locationId: next.locationId,
                    address: next.addressLine,
                  }))
                }
              />
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={openFilterModal}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              <IconSliders className="h-4 w-4" />
              Фильтры
            </button>

            <button
              type="button"
              onClick={() => setSortSheetOpen(true)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              <IconList className="h-4 w-4" />
              Сортировка
            </button>
          </div>

          {showNearQuickSlotsSection ? (
            <ServicesNearQuickSlots category={applied.category} apiSlots={quickSlotsProp} />
          ) : null}

          {showFoundRow ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold text-neutral-400">
                Найдено:{' '}
                <span className="text-neutral-900">
                  {awaitingListData && catalog.kind === 'api' ? '…' : resultTotal}
                </span>
              </p>

              {filtersAreActive(applied) ? (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-full bg-[#F1EFEF] px-3.5 py-2 text-[13px] font-semibold text-neutral-500 transition active:scale-[0.98]"
                >
                  Сбросить
                </button>
              ) : null}
            </div>
          ) : null}

          {activeFilterLabels.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeFilterLabels.map((label, idx) => (
                <span
                  key={`${label}-${idx}`}
                  className="shrink-0 rounded-full bg-[#F1EFEF] px-3.5 py-2 text-[13px] font-semibold text-neutral-500"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4">
            {isError ? (
              <NothingFoundCard
                title="Не удалось загрузить услуги"
                text="Попробуйте обновить страницу"
                action={
                  <button
                    type="button"
                    onClick={() => setCatalogRetrySeq((n) => n + 1)}
                    className="inline-flex min-h-12 w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition active:scale-[0.99]"
                  >
                    Повторить
                  </button>
                }
              />
            ) : awaitingListData && catalog.kind === 'api' ? (
              <ServicesListSkeleton />
            ) : catalogGloballyEmpty ? (
              <NothingFoundCard
                title="Услуги скоро появятся"
                text="Мы уже добавляем мастеров и свободные окна"
                action={
                  <div className="flex w-full max-w-xs flex-col gap-2 self-center">
                    <button
                      type="button"
                      onClick={() => setCatalogRetrySeq((n) => n + 1)}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition active:scale-[0.99]"
                    >
                      Обновить
                    </button>
                    {showMasterCabinetCta ? (
                      <button
                        type="button"
                        onClick={() => {
                          void setProfileRole('master');
                          navigate(ADMIN_SERVICES_PATH);
                        }}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-8 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
                      >
                        Добавить услугу
                      </button>
                    ) : null}
                  </div>
                }
              />
            ) : !hasResults && hasServicesInDatabase && hasSearchQuery ? (
              <NothingFoundCard
                title="Нет такой услуги"
                text="Попробуйте другое название"
                action={
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex min-h-12 w-full max-w-xs items-center justify-center self-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition active:scale-[0.99]"
                  >
                    Очистить поиск
                  </button>
                }
              />
            ) : !hasResults && hasServicesInDatabase ? (
              <NothingFoundCard
                title="Ничего не нашли"
                text="Попробуйте изменить фильтры"
                action={
                  <div className="flex w-full max-w-xs flex-col gap-2 self-center">
                    {filtersAreActive(applied) ? (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition active:scale-[0.99]"
                      >
                        Сбросить фильтры
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleShowAllListings}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-8 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
                    >
                      Показать все
                    </button>
                  </div>
                }
              />
            ) : (
              filtered.map((item, index) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  imagePriority={index < 10}
                  isDemoAvailability={catalog.kind === 'demo'}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {filterOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end overflow-x-hidden overflow-y-hidden lg:items-center lg:justify-center lg:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="absolute inset-0 min-h-full min-w-full animate-menu-backdrop bg-black/25 backdrop-blur-[2px]"
            onClick={() => setFilterOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-sheet-title"
            className="relative mx-auto min-h-0 min-w-0 max-h-[min(92dvh,42rem)] w-full max-w-lg animate-menu-sheet overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-t-[38px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-6 shadow-[0_-24px_80px_rgba(0,0,0,0.16)] lg:rounded-[38px] lg:pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 lg:hidden" aria-hidden />

            <h2 id="filters-sheet-title" className="text-[28px] font-semibold tracking-[-0.06em] text-neutral-950">
              Фильтры
            </h2>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Категория
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <FilterButton
                active={modalDraft.category == null}
                onClick={() => setModalDraft((current) => ({ ...current, category: null }))}
              >
                Любая
              </FilterButton>

              {PILL_LABELS.filter((label) => label !== 'Все').map((category) => (
                <FilterButton
                  key={category}
                  active={modalDraft.category === category}
                  onClick={() => setModalDraft((current) => ({ ...current, category }))}
                >
                  {category}
                </FilterButton>
              ))}
            </div>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Район или адрес
            </p>
            <label htmlFor="services-filter-address-modal" className="sr-only">
              Район или адрес, подсказки из каталога
            </label>

            <div className="mt-2">
              <ServicesDbLocationField
                id="services-filter-address-modal"
                viewportDropdown
                locationId={modalDraft.locationId}
                addressLine={modalDraft.address}
                onChange={(next) =>
                  setModalDraft((current) => ({
                    ...current,
                    locationId: next.locationId,
                    address: next.addressLine,
                  }))
                }
              />
            </div>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Когда свободно
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['any', 'Любое'],
                  ['today', 'Сегодня'],
                  ['tomorrow', 'Завтра'],
                  ['week', 'На неделе'],
                  ['weekend', 'Выходные'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.availability === value}
                  onClick={() => setModalDraft((current) => ({ ...current, availability: value }))}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Время дня
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['any', 'Любое'],
                  ['morning', 'Утро 8–12'],
                  ['afternoon', 'День 12–17'],
                  ['evening', 'Вечер 17–22'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.timeOfDay === value}
                  onClick={() => setModalDraft((current) => ({ ...current, timeOfDay: value }))}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Рейтинг
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['any', 'Любой'],
                  ['4.5', '4.5+'],
                  ['4.7', '4.7+'],
                  ['4.9', '4.9+'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.rating === value}
                  onClick={() => setModalDraft((current) => ({ ...current, rating: value }))}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Цена, BYN
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <FilterButton
                active={modalDraft.price === 'any'}
                onClick={() =>
                  setModalDraft((current) => ({
                    ...current,
                    price: 'any',
                    minPrice: '',
                    maxPrice: '',
                  }))
                }
              >
                Любая
              </FilterButton>

              {(
                [
                  ['under30', 'до 30'],
                  ['range30_50', '30–50'],
                  ['range50_100', '50–100'],
                  ['over100', '100+'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.price === value}
                  onClick={() =>
                    setModalDraft((current) => ({
                      ...current,
                      ...draftFromPriceChip(value),
                    }))
                  }
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-500">От</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={modalDraft.minPrice}
                  onChange={(e) =>
                    setModalDraft((c) => ({
                      ...c,
                      minPrice: e.target.value,
                      price: 'any',
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-[20px] bg-[#F1EFEF] px-3 py-3 text-[15px] font-semibold text-neutral-900 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-500">До</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={modalDraft.maxPrice}
                  onChange={(e) =>
                    setModalDraft((c) => ({
                      ...c,
                      maxPrice: e.target.value,
                      price: 'any',
                    }))
                  }
                  placeholder="∞"
                  className="w-full rounded-[20px] bg-[#F1EFEF] px-3 py-3 text-[15px] font-semibold text-neutral-900 outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              className="mt-5 flex w-full min-h-12 items-center justify-between rounded-[22px] bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-800 transition active:scale-[0.99]"
              onClick={() => setMoreFiltersOpen((o) => !o)}
            >
              <span>Ещё фильтры</span>
              <span className="text-neutral-400">{moreFiltersOpen ? '−' : '+'}</span>
            </button>

            {moreFiltersOpen ? (
              <div className="mt-4 space-y-5 border-t border-neutral-100 pt-4">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Формат приёма
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['any', 'Любой'],
                        ['studio', 'В салоне'],
                        ['at_home', 'Выезд на дом'],
                      ] as const
                    ).map(([value, label]) => (
                      <FilterButton
                        key={value}
                        active={modalDraft.visitType === value}
                        onClick={() => setModalDraft((c) => ({ ...c, visitType: value }))}
                      >
                        {label}
                      </FilterButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Отзывы
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        [0, 'Любое'],
                        [5, 'от 5'],
                        [10, 'от 10'],
                        [20, 'от 20'],
                      ] as const
                    ).map(([value, label]) => (
                      <FilterButton
                        key={value}
                        active={modalDraft.minReviews === value}
                        onClick={() => setModalDraft((c) => ({ ...c, minReviews: value }))}
                      >
                        {label}
                      </FilterButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Длительность услуги
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['any', 'Любая'],
                        ['under30', 'до 30 мин'],
                        ['30_60', '30–60 мин'],
                        ['60_120', '1–2 ч'],
                        ['over120', '> 2 ч'],
                      ] as const
                    ).map(([value, label]) => (
                      <FilterButton
                        key={value}
                        active={modalDraft.duration === value}
                        onClick={() => setModalDraft((c) => ({ ...c, duration: value }))}
                      >
                        {label}
                      </FilterButton>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] bg-[#F1EFEF] px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#E29595]"
                    checked={modalDraft.verifiedOnly}
                    onChange={(e) => setModalDraft((c) => ({ ...c, verifiedOnly: e.target.checked }))}
                  />
                  <span className="text-[15px] font-semibold text-neutral-900">Только проверенные мастера</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] bg-[#F1EFEF] px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#E29595]"
                    checked={modalDraft.promotionOnly}
                    onChange={(e) => setModalDraft((c) => ({ ...c, promotionOnly: e.target.checked }))}
                  />
                  <span className="text-[15px] font-semibold text-neutral-900">Есть акция или скидка</span>
                </label>
              </div>
            ) : null}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={resetModalDraft}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                Сбросить
              </button>

              <button
                type="button"
                onClick={applyModal}
                className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#E29595] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.24)] transition active:scale-[0.98]"
              >
                Показать
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {sortSheetOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end overflow-x-hidden overflow-y-hidden lg:items-center lg:justify-center lg:p-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Закрыть сортировку"
            className="absolute inset-0 min-h-full min-w-full animate-menu-backdrop bg-black/25 backdrop-blur-[2px]"
            onClick={() => setSortSheetOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sort-sheet-title"
            className="relative mx-auto min-h-0 min-w-0 max-h-[min(92dvh,42rem)] w-full max-w-lg animate-menu-sheet overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-t-[38px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-6 shadow-[0_-24px_80px_rgba(0,0,0,0.16)] lg:rounded-[38px] lg:pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 lg:hidden" aria-hidden />

            <h2 id="sort-sheet-title" className="text-[28px] font-semibold tracking-[-0.06em] text-neutral-950">
              Сортировка
            </h2>

            <div className="mt-6 flex flex-wrap gap-2">
              {(
                [
                  ['recommended', 'Рекомендуемые'],
                  ['soonest', 'Ближайшее время'],
                  ['rating', 'По рейтингу'],
                  ['price_asc', 'Сначала дешевле'],
                  ['price_desc', 'Сначала дороже'],
                  ['reviews', 'Больше отзывов'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={applied.sortBy === value}
                  onClick={() => {
                    setApplied((current) => ({ ...current, sortBy: value }));
                    setSortSheetOpen(false);
                  }}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSortSheetOpen(false)}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}