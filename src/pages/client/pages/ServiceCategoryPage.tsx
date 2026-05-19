import { useMemo, useState } from 'react';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import type { ClientOutletContext } from '../clientOutletContext';
import { ClientPageShell } from '../components/ClientPageShell';
import { MasterCard } from '../components/MasterCard';
import { QuickChips } from '../components/QuickChips';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { FilterOpenButton } from '../components/FilterOpenButton';
import { CategoryMasterFilterSheet } from '../components/CategoryMasterFilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { SERVICES_PATH } from '../../../app/paths';
import { groupListingsByMaster, sortMastersByDistance } from '../lib/groupMasters';
import { formatDurationMinutes, formatMastersCountLabel, formatPriceFrom } from '../lib/catalogFormat';
import {
  categoryFiltersToApiParams,
  countActiveCategoryFilters,
  DEFAULT_CATEGORY_MASTER_FILTERS,
  filtersToQuickChips,
  toggleQuickChip,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';

const FILTER_CHIPS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'near', label: 'Рядом' },
  { id: 'rating', label: 'Рейтинг' },
  { id: 'price', label: 'Дешевле' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
  { id: 'promo', label: 'С акциями' },
] as const;

export function ServiceCategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const { userLat, userLng, hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [filters, setFilters] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterDraft, setFilterDraft] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCategoryFilters(filters);
  const quickChipIds = useMemo(() => filtersToQuickChips(filters), [filters]);

  const apiParams = useMemo(
    () =>
      categoryFiltersToApiParams(
        filters,
        { limit: 80, category: categoryCode },
        hasGeo,
      ),
    [filters, categoryCode, hasGeo],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Категория');

  const categoryName =
    categories.find((c) => c.code === categoryCode)?.name ?? categoryCode ?? 'Услуга';

  const masters = useMemo(() => {
    let list = groupListingsByMaster(listings);
    list = sortMastersByDistance(list, userLat, userLng);
    if (filters.sortBy === 'rating' || filters.minRating) {
      list = [...list].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    }
    if (filters.sortBy === 'price_asc' || filters.priceTier) {
      list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    }
    return list;
  }, [listings, userLat, userLng, filters.sortBy, filters.minRating, filters.priceTier]);

  const stats = useMemo(() => {
    const prices = listings.map((l) => l.priceFrom).filter((p) => p > 0);
    const durations = listings
      .map((l) => {
        const m = l.serviceName.match(/(\d+)\s*мин/);
        return m ? Number(m[1]) : null;
      })
      .filter((d): d is number => d != null);
    return {
      minPrice: prices.length ? Math.min(...prices) : null,
      duration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 90,
      masterCount: masters.length,
    };
  }, [listings, masters.length]);

  const toggleChip = (id: string) => {
    const turningOnNear = id === 'near' && !quickChipIds.has('near');
    setFilters((prev) => toggleQuickChip(prev, id));
    if (turningOnNear && !hasGeo) void requestGeo();
  };

  const openFilters = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const todayFilterNoSlots =
    filters.dateRange === 'today' &&
    !loading &&
    masters.length > 0 &&
    masters.every((m) => !m.nextSlotStartsAt);

  return (
    <ClientPageShell>
      <Link
        to={SERVICES_PATH}
        className="mb-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#6B7280]"
      >
        <HiArrowLeft className="h-4 w-4" aria-hidden />
        Услуги
      </Link>

      <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#111827]">
        {categoryName}
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-[#6B7280]">
        Выберите мастера и удобное время
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-medium text-[#374151]">
        {stats.minPrice != null ? (
          <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">{formatPriceFrom(stats.minPrice)}</span>
        ) : null}
        <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">
          {formatDurationMinutes(stats.duration)}
        </span>
        <span className="rounded-full bg-[#F1EFEF] px-3 py-1.5">
          {formatMastersCountLabel(stats.masterCount)}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <QuickChips chips={[...FILTER_CHIPS]} activeIds={quickChipIds} onToggle={toggleChip} />
          </div>
          <FilterOpenButton activeCount={activeFilterCount} onClick={openFilters} className="mt-2" />
        </div>
        {quickChipIds.has('near') && !hasGeo ? (
          <div className="mt-2">
            <GeoPromptCard onAllow={requestGeo} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : masters.length === 0 ? (
          <EmptyState
            title="Пока нет мастеров по этой услуге"
            description="Попробуйте снять фильтры или выберите другую услугу"
            actionLabel="Сбросить фильтры"
            onAction={() => setFilters({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
          />
        ) : todayFilterNoSlots ? (
          <EmptyState
            title="Свободных окон на сегодня нет"
            description="Попробуйте выбрать другую дату"
            actionLabel="Смотреть завтра"
            onAction={() =>
              setFilters((prev) => ({ ...prev, dateRange: 'tomorrow' }))
            }
          />
        ) : (
          masters.map((m) => (
            <MasterCard key={m.masterId} listing={m} userLat={userLat} userLng={userLng} />
          ))
        )}
      </div>

      <CategoryMasterFilterSheet
        open={filterOpen}
        title={`Фильтры · ${categoryName}`}
        draft={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters(filterDraft);
          setFilterOpen(false);
          void reload();
        }}
      />
    </ClientPageShell>
  );
}
