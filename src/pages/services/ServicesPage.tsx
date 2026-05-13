import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingPath, getMasterPath, getProfilePath } from '../../app/paths';
import { fetchPublicSlots, type PublicSlotDto } from '../../features/booking/api/publicSlotsApi';
import {
  fetchPublishedMasters,
  publishedMasterToListingRecord,
} from '../../features/services/api/publishedMastersApi';
import type { ServiceListingRecord } from '../../features/services/model/demoMasters';
import {
  DEMO_SERVICE_LISTINGS,
  formatReviewsCountLabel,
} from '../../features/services/model/demoMasters';
import {
  formatPublicAddress,
  masterLocationSearchHaystack,
} from '../../features/profile/model/masterLocation';
import { isDemoMaster } from '../../features/profile/lib/demoMasterStorage';
import { setProfileRole } from '../../features/profile/lib/setProfileRole';
import { getApiBaseUrl } from '../../shared/api/backendClient';
import { NothingFoundCard } from '../../shared/ui/NothingFoundCard';
import { HomeHeader } from '../HomeHeader';
import { ServicesNearQuickSlots } from './ServicesNearQuickSlots';

const PILL_LABELS = [
  'Все',
  'Маникюр',
  'Барберы',
  'Брови и ресницы',
  'Массаж',
  'Фитнес',
  'Тату',
] as const;

/** Код категории в БД для query GET /api/masters и /api/slots */
const CATEGORY_CODE_BY_LABEL: Record<string, string> = {
  Маникюр: 'manicure',
  Барберы: 'barbers',
  'Брови и ресницы': 'brows-lashes',
  Массаж: 'massage',
  Фитнес: 'fitness',
  Тату: 'tattoo',
};

const DAY_MS = 86_400_000;

const ALL_SERVICES_CATALOG: Record<string, string[]> = {
  Маникюр: [
    'Маникюр с покрытием',
    'Маникюр без покрытия',
    'Педикюр',
    'Наращивание ногтей',
    'Снятие покрытия',
    'Дизайн ногтей',
  ],
  Барберы: [
    'Мужская стрижка',
    'Борода',
    'Стрижка + борода',
    'Детская стрижка',
    'Камуфляж седины',
  ],
  'Брови и ресницы': [
    'Коррекция бровей',
    'Окрашивание бровей',
    'Ламинирование бровей',
    'Ламинирование ресниц',
    'Наращивание ресниц',
  ],
  Массаж: [
    'Классический массаж',
    'Спортивный массаж',
    'Релакс массаж',
    'Массаж спины',
    'Антицеллюлитный массаж',
  ],
  Фитнес: [
    'Персональная тренировка',
    'Растяжка',
    'Функциональная тренировка',
    'Силовая тренировка',
    'Консультация тренера',
  ],
  Тату: [
    'Мини-тату',
    'Эскиз',
    'Консультация',
    'Перекрытие тату',
    'Коррекция тату',
  ],
};

type RatingFilter = 'any' | '4.5' | '4.7' | '4.9';
type PriceFilter = 'any' | '30' | '50' | '100';
type AvailabilityFilter = 'any' | 'today' | 'tomorrow' | 'week';
type SortBy = 'recommended' | 'rating' | 'price' | 'reviews';

type AppliedFilters = {
  search: string;
  category: string | null;
  address: string;
  minRating: number | null;
  maxPrice: number | null;
  availability: AvailabilityFilter;
  sortBy: SortBy;
};

type ModalDraft = {
  category: string | null;
  address: string;
  rating: RatingFilter;
  price: PriceFilter;
  availability: AvailabilityFilter;
  sortBy: SortBy;
};

type ServicesCatalogState =
  | { kind: 'demo' }
  | { kind: 'api'; phase: 'loading' | 'error' | 'ok'; listings: ServiceListingRecord[]; quickSlots: PublicSlotDto[] };

type ListingAvailability = {
  hasSlots: boolean;
  bucket: 'today' | 'tomorrow' | 'week' | 'none';
  label: string;
  tone: 'good' | 'soon' | 'none';
};

const defaultApplied: AppliedFilters = {
  search: '',
  category: null,
  address: '',
  minRating: null,
  maxPrice: null,
  availability: 'any',
  sortBy: 'recommended',
};

function ratingToMin(rating: RatingFilter): number | null {
  if (rating === 'any') return null;
  return Number(rating);
}

function priceToMax(price: PriceFilter): number | null {
  if (price === 'any') return null;
  return Number(price);
}

function minRatingToDraft(value: number | null): RatingFilter {
  if (value == null) return 'any';
  if (value >= 4.9) return '4.9';
  if (value >= 4.7) return '4.7';
  return '4.5';
}

function maxPriceToDraft(value: number | null): PriceFilter {
  if (value == null) return 'any';
  if (value <= 30) return '30';
  if (value <= 50) return '50';
  return '100';
}

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getAvailability(item: ServiceListingRecord): ListingAvailability {
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

  return availability.bucket === 'today' || availability.bucket === 'tomorrow' || availability.bucket === 'week';
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
    if (filters.category && row.category !== filters.category) return false;
    if (filters.minRating != null && row.rating < filters.minRating) return false;
    if (filters.maxPrice != null && row.priceFrom > filters.maxPrice) return false;
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

  if (sortBy === 'price') {
    return next.sort((a, b) => a.priceFrom - b.priceFrom);
  }

  return next.sort((a, b) => b.reviewsCount - a.reviewsCount);
}

function availabilityLabel(value: AvailabilityFilter): string {
  if (value === 'today') return 'Сегодня';
  if (value === 'tomorrow') return 'Завтра';
  if (value === 'week') return 'На этой неделе';
  return 'Любое время';
}

function sortLabel(value: SortBy): string {
  if (value === 'rating') return 'По рейтингу';
  if (value === 'price') return 'Сначала дешевле';
  if (value === 'reviews') return 'Больше отзывов';
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

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
          ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.22)]'
          : 'bg-[#F1EFEF] text-neutral-700'
      }`}
    >
      {children}
    </button>
  );
}

function ServiceCard({ item }: { item: ServiceListingRecord }) {
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
  const availability = getAvailability(item);

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
            <img
              src={item.photoUrl}
              alt=""
              width={160}
              height={160}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
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
  const demoMaster = isDemoMaster();

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
  const [allServicesOpen, setAllServicesOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState<ModalDraft>({
    category: null,
    address: '',
    rating: 'any',
    price: 'any',
    availability: 'any',
    sortBy: 'recommended',
  });

  const [catalogRetrySeq, setCatalogRetrySeq] = useState(0);

  const [catalog, setCatalog] = useState<ServicesCatalogState>(() =>
    getApiBaseUrl() ? { kind: 'api', phase: 'loading', listings: [], quickSlots: [] } : { kind: 'demo' },
  );

  const activePill = applied.category ?? 'Все';

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setCatalog({ kind: 'demo' });
      return;
    }
    const label = applied.category ?? 'Все';
    const catCode = label === 'Все' ? undefined : CATEGORY_CODE_BY_LABEL[label];
    let cancelled = false;
    setCatalog({ kind: 'api', phase: 'loading', listings: [], quickSlots: [] });
    (async () => {
      try {
        const [masters, slots] = await Promise.all([
          fetchPublishedMasters({
            category: catCode,
            search: applied.search.trim() || undefined,
            limit: 80,
          }),
          fetchPublicSlots({ category: catCode, limit: 14 }),
        ]);
        if (cancelled) return;
        setCatalog({
          kind: 'api',
          phase: 'ok',
          listings: masters.map(publishedMasterToListingRecord),
          quickSlots: slots,
        });
      } catch {
        if (cancelled) return;
        setCatalog({ kind: 'api', phase: 'error', listings: [], quickSlots: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applied.category, applied.search, catalogRetrySeq]);

  const enrichedApiListings = useMemo(() => {
    if (catalog.kind !== 'api' || catalog.phase !== 'ok') return [];
    return catalog.listings.map((row) => {
      const match = catalog.quickSlots
        .filter(
          (s) =>
            s.masterId === row.masterId &&
            Boolean(row.primaryServiceId) &&
            s.bookingServiceId === row.primaryServiceId,
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
      return { ...row, nextSlotId: match?.id ?? null };
    });
  }, [catalog]);

  const filtered = useMemo(() => {
    if (catalog.kind === 'demo') {
      const rows = filterListings(DEMO_SERVICE_LISTINGS, applied);
      return sortListings(rows, applied.sortBy);
    }
    if (catalog.phase === 'loading' || catalog.phase === 'error') return [];
    const rows = filterListings(enrichedApiListings, applied);
    return sortListings(rows, applied.sortBy);
  }, [applied, catalog, enrichedApiListings]);

  const quickSlotsProp = useMemo((): PublicSlotDto[] | 'loading' | 'error' | undefined => {
    if (catalog.kind === 'demo') return undefined;
    if (catalog.phase === 'loading') return 'loading';
    if (catalog.phase === 'error') return 'error';
    return catalog.quickSlots;
  }, [catalog]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];

    if (applied.address.trim()) labels.push(applied.address.trim());
    if (applied.minRating != null) labels.push(`${applied.minRating}+ рейтинг`);
    if (applied.maxPrice != null) labels.push(`до ${applied.maxPrice} BYN`);
    if (applied.availability !== 'any') labels.push(availabilityLabel(applied.availability));
    if (applied.sortBy !== 'recommended') labels.push(sortLabel(applied.sortBy));

    return labels;
  }, [applied]);

  const openFilterModal = useCallback(() => {
    setModalDraft({
      category: applied.category,
      address: applied.address,
      rating: minRatingToDraft(applied.minRating),
      price: maxPriceToDraft(applied.maxPrice),
      availability: applied.availability,
      sortBy: applied.sortBy,
    });

    setFilterOpen(true);
  }, [applied]);

  useEffect(() => {
    if (!filterOpen && !allServicesOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterOpen(false);
        setAllServicesOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [filterOpen, allServicesOpen]);

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

  const applyModal = useCallback(() => {
    setApplied((current) => ({
      ...current,
      category: modalDraft.category,
      address: modalDraft.address,
      minRating: ratingToMin(modalDraft.rating),
      maxPrice: priceToMax(modalDraft.price),
      availability: modalDraft.availability,
      sortBy: modalDraft.sortBy,
    }));

    setFilterOpen(false);
  }, [modalDraft]);

  const resetModalDraft = useCallback(() => {
    setModalDraft({
      category: null,
      address: '',
      rating: 'any',
      price: 'any',
      availability: 'any',
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
                <span className="sr-only">Поиск</span>

                <div className="flex items-center gap-3 rounded-[26px] bg-[#F1EFEF] px-4 py-3.5">
                  <IconSearch className="shrink-0 text-neutral-400" />

                  <input
                    type="search"
                    value={applied.search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Поиск услуги или мастера"
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
                    autoComplete="off"
                  />
                </div>
              </label>
            </div>
          </section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PILL_LABELS.map((label) => {
              const active = label === activePill;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPillCategory(label)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-[15px] font-semibold transition active:scale-[0.98] ${
                    active
                      ? 'bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.22)]'
                      : 'bg-[#F1EFEF] text-neutral-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

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
              onClick={() => setAllServicesOpen(true)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
            >
              <IconList className="h-4 w-4" />
              Все услуги
            </button>
          </div>

          <ServicesNearQuickSlots category={applied.category} apiSlots={quickSlotsProp} />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-neutral-400">
              Найдено: <span className="text-neutral-900">{filtered.length}</span>
            </p>

            {activeFilterLabels.length > 0 || applied.search.trim() ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="rounded-full bg-[#F1EFEF] px-3.5 py-2 text-[13px] font-semibold text-neutral-500 transition active:scale-[0.98]"
              >
                Сбросить
              </button>
            ) : null}
          </div>

          {activeFilterLabels.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="shrink-0 rounded-full bg-[#F1EFEF] px-3.5 py-2 text-[13px] font-semibold text-neutral-500"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4">
            {catalog.kind === 'api' && catalog.phase === 'error' ? (
              <NothingFoundCard
                title="Не удалось загрузить каталог"
                text="Проверьте соединение с сервером или попробуйте позже."
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
            ) : catalog.kind === 'api' && catalog.phase === 'loading' ? (
              <p className="py-10 text-center text-[15px] font-medium text-neutral-500">Загрузка каталога…</p>
            ) : filtered.length === 0 ? (
              <NothingFoundCard
                title="Ничего не нашли"
                text="Попробуйте изменить категорию, район, цену или свободное время."
                action={
                  <div className="flex w-full max-w-xs flex-col gap-2 self-center">
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-8 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(226,149,149,0.28)] transition active:scale-[0.99]"
                    >
                      Сбросить фильтры
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllServicesOpen(true)}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-8 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
                    >
                      Открыть все услуги
                    </button>
                  </div>
                }
              />
            ) : (
              filtered.map((item) => <ServiceCard key={item.id} item={item} />)
            )}
          </div>
        </div>
      </main>

      {filterOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center lg:p-6" role="presentation">
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="absolute inset-0 animate-menu-backdrop bg-black/25 backdrop-blur-[2px]"
            onClick={() => setFilterOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-sheet-title"
            className="relative max-h-[min(92dvh,42rem)] w-full max-w-lg animate-menu-sheet overflow-y-auto rounded-t-[38px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-6 shadow-[0_-24px_80px_rgba(0,0,0,0.16)] lg:rounded-[38px] lg:pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 lg:hidden" aria-hidden />

            <h2 id="filters-sheet-title" className="text-[28px] font-semibold tracking-[-0.06em] text-neutral-950">
              Фильтры
            </h2>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Сортировка
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['recommended', 'Рекомендуемые'],
                  ['rating', 'По рейтингу'],
                  ['price', 'Сначала дешевле'],
                  ['reviews', 'Больше отзывов'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.sortBy === value}
                  onClick={() => setModalDraft((current) => ({ ...current, sortBy: value }))}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

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
              Район / адрес
            </p>

            <input
              type="text"
              value={modalDraft.address}
              onChange={(event) => setModalDraft((current) => ({ ...current, address: event.target.value }))}
              placeholder="Например, Немига или центр"
              className="mt-2 w-full rounded-[24px] bg-[#F1EFEF] px-4 py-3.5 text-[16px] font-semibold text-neutral-950 outline-none ring-0 placeholder:font-medium placeholder:text-neutral-400"
            />

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Свободное время
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['any', 'Любое'],
                  ['today', 'Сегодня'],
                  ['tomorrow', 'Завтра'],
                  ['week', 'На неделе'],
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
              Цена
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['any', 'Любая'],
                  ['30', 'до 30 BYN'],
                  ['50', 'до 50 BYN'],
                  ['100', 'до 100 BYN'],
                ] as const
              ).map(([value, label]) => (
                <FilterButton
                  key={value}
                  active={modalDraft.price === value}
                  onClick={() => setModalDraft((current) => ({ ...current, price: value }))}
                >
                  {label}
                </FilterButton>
              ))}
            </div>

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

      {allServicesOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center lg:p-6" role="presentation">
          <button
            type="button"
            aria-label="Закрыть список услуг"
            className="absolute inset-0 animate-menu-backdrop bg-black/25 backdrop-blur-[2px]"
            onClick={() => setAllServicesOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-services-title"
            className="relative max-h-[min(90dvh,40rem)] w-full max-w-lg animate-menu-sheet overflow-y-auto rounded-t-[38px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-6 shadow-[0_-24px_80px_rgba(0,0,0,0.16)] lg:rounded-[38px] lg:pb-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 lg:hidden" aria-hidden />

            <h2 id="all-services-title" className="text-[28px] font-semibold tracking-[-0.06em] text-neutral-950">
              Все услуги
            </h2>

            <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">
              Выберите услугу — мы сразу покажем подходящих мастеров.
            </p>

            <div className="mt-6 space-y-5 pb-2">
              {Object.entries(ALL_SERVICES_CATALOG).map(([category, services]) => (
                <section key={category} className="rounded-[32px] bg-[#F1EFEF] p-3">
                  <h3 className="px-2 pt-1 text-[18px] font-semibold tracking-[-0.045em] text-neutral-950">
                    {category}
                  </h3>

                  <ul className="mt-3 flex flex-col gap-2">
                    {services.map((serviceName) => (
                      <li key={serviceName}>
                        <button
                          type="button"
                          onClick={() => {
                            setApplied((current) => ({
                              ...current,
                              search: serviceName,
                              category,
                            }));
                            setAllServicesOpen(false);
                          }}
                          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[24px] bg-white px-4 py-3 text-left text-[15px] font-semibold text-neutral-900 shadow-[0_8px_22px_rgba(17,17,17,0.035)] transition active:scale-[0.99]"
                        >
                          <span>{serviceName}</span>
                          <IconArrowRight className="h-4 w-4 shrink-0 text-neutral-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}