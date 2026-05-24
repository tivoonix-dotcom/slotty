import { useMemo, useState } from 'react';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import type { ClientOutletContext } from '../clientOutletContext';
import { MasterCard } from '../components/MasterCard';
import { QuickChips } from '../components/QuickChips';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { CategoryMasterFilterSheet } from '../components/CategoryMasterFilterSheet';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { useCatalogData } from '../hooks/useCatalogData';
import { getServiceCategoryPath, SERVICES_PATH } from '../../../app/paths';
import {
  getServiceCategoryLabel,
  normalizeCategoryCode,
} from '../../../features/catalog/serviceCategoryLabels';
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
import { ServiceCategoryDesktop } from '../serviceCategory/ServiceCategoryDesktop';
import { CatalogStickyToolbar } from '../servicesCatalog/CatalogStickyToolbar';
import { catalogCanvasClass, catalogMetaChipClass } from '../servicesCatalog/servicesCatalogTheme';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../clientNavConstants';

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
  const navigate = useNavigate();
  const { userLat, userLng, hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterDraft, setFilterDraft] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCategoryFilters(filters);
  const quickChipIds = useMemo(() => filtersToQuickChips(filters), [filters]);

  const normalizedCategoryCode = categoryCode ? normalizeCategoryCode(categoryCode) : undefined;

  const apiParams = useMemo(
    () =>
      categoryFiltersToApiParams(
        filters,
        { limit: 80, category: normalizedCategoryCode },
        hasGeo,
      ),
    [filters, normalizedCategoryCode, hasGeo],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Категория');

  const categoryName = getServiceCategoryLabel(categoryCode, categories);

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

  const filteredMasters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return masters;
    return masters.filter(
      (m) =>
        m.masterName.toLowerCase().includes(q) ||
        m.serviceName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [masters, search]);

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

  const handleCategorySelect = (code: string | null) => {
    if (code == null) {
      navigate(SERVICES_PATH);
      return;
    }
    if (code !== categoryCode) {
      navigate(getServiceCategoryPath(code));
    }
  };

  const todayFilterNoSlots =
    filters.dateRange === 'today' &&
    !loading &&
    filteredMasters.length > 0 &&
    filteredMasters.every((m) => !m.nextSlotStartsAt);

  const mobileResults = (
    <>
      {quickChipIds.has('near') && !hasGeo ? (
        <div className="mb-3">
          <GeoPromptCard onAllow={requestGeo} />
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonMasterCard />
            <SkeletonMasterCard />
          </>
        ) : error ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : filteredMasters.length === 0 ? (
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
          filteredMasters.map((m) => (
            <MasterCard key={m.masterId} listing={m} userLat={userLat} userLng={userLng} />
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      <ServiceCategoryDesktop
        categoryCode={categoryCode ?? ''}
        categoryName={categoryName}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
        onCategorySelect={handleCategorySelect}
        categories={categories}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        masters={filteredMasters}
        stats={stats}
        quickChipIds={quickChipIds}
        onToggleChip={toggleChip}
        todayFilterNoSlots={todayFilterNoSlots}
        userLat={userLat}
        userLng={userLng}
        hasGeo={hasGeo}
        onRequestGeo={requestGeo}
        showGeoPrompt={quickChipIds.has('near')}
      />

      <div className={`relative z-0 lg:hidden min-h-dvh ${catalogCanvasClass} ${CLIENT_HEADER_OFFSET}`}>
        <div className="mx-auto w-full max-w-lg px-4 pt-1 sm:px-5">
          <CatalogStickyToolbar
            compact
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Имя мастера, услуга, район…"
            loading={loading}
            showResultCount={false}
            onFilterClick={openFilters}
            activeFilterCount={activeFilterCount}
          >
            <div className="min-w-0">
              <Link
                to={SERVICES_PATH}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B7280] transition hover:text-[#111827]"
              >
                <HiArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Услуги
              </Link>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h1 className="text-[18px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
                  {categoryName}
                </h1>
                <div className="flex flex-wrap gap-1.5">
                  {stats.minPrice != null ? (
                    <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
                      {formatPriceFrom(stats.minPrice)}
                    </span>
                  ) : null}
                  <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
                    {formatDurationMinutes(stats.duration)}
                  </span>
                  <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
                    {formatMastersCountLabel(stats.masterCount)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5">
                <QuickChips chips={[...FILTER_CHIPS]} activeIds={quickChipIds} onToggle={toggleChip} />
              </div>
            </div>
          </CatalogStickyToolbar>

          <div className={`${CLIENT_CONTENT_PAD_BOTTOM} pb-6 pt-4`}>{mobileResults}</div>
        </div>
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
    </>
  );
}
