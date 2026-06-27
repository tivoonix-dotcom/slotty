import { useMemo, useState } from 'react';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { useNavigate, useOutletContext, useParams, useLocation } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { MasterCard } from '../components/MasterCard';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
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
import {
  categoryFiltersToApiParams,
  countActiveCategoryFilters,
  DEFAULT_CATEGORY_MASTER_FILTERS,
  filtersToQuickChips,
  toggleQuickChip,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import { CatalogMobileCategoryHeader } from '../serviceCategory/CatalogMobileCategoryHeader';
import { ServiceCategoryDesktop } from '../serviceCategory/ServiceCategoryDesktop';
import { MastersCatalogFiltersSheet } from '../mastersCatalog/MastersCatalogFiltersSheet';
import { catalogMobileContentBelowHeaderClass } from '../servicesCatalog/catalogMobileFixedLayout';
import {
  catalogCanvasClass,
  catalogMetaChipClass,
  catalogMobilePadX,
} from '../servicesCatalog/servicesCatalogTheme';
import { formatDurationMinutes, formatMastersCountLabel, formatPriceFrom } from '../lib/catalogFormat';
import { CLIENT_CONTENT_PAD_BOTTOM } from '../clientNavConstants';
import { JsonLd } from '../../../shared/seo/JsonLd';
import { buildCategoryStructuredData } from '../../../shared/seo/categoryStructuredData';
import { useScrollCatalogToTopOnChange } from '../servicesCatalog/scrollCatalogPageToTop';

export function ServiceCategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { userLat, userLng, hasGeo, requestGeo } = useOutletContext<ClientOutletContext>();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterDraft, setFilterDraft] = useState<CategoryMasterFilters>(DEFAULT_CATEGORY_MASTER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCategoryFilters(filters);
  const quickChipIds = useMemo(() => filtersToQuickChips(filters), [filters]);

  const normalizedCategoryCode = categoryCode ? normalizeCategoryCode(categoryCode) : undefined;

  const categoryScrollKey = useMemo(
    () =>
      JSON.stringify(
        categoryFiltersToApiParams(
          filters,
          {
            limit: 80,
            category: normalizedCategoryCode,
            search: search.trim() || undefined,
          },
          hasGeo,
        ),
      ),
    [filters, normalizedCategoryCode, hasGeo, search],
  );

  useScrollCatalogToTopOnChange(`${location.pathname}|${categoryScrollKey}`, {
    scrollOnMount: true,
  });

  const apiParams = useMemo(
    () =>
      categoryFiltersToApiParams(
        filters,
        {
          limit: 80,
          category: normalizedCategoryCode,
          search: search.trim() || undefined,
        },
        hasGeo,
        { userLat, userLng },
      ),
    [filters, normalizedCategoryCode, hasGeo, search, userLat, userLng],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Категория');

  const categoryName = getServiceCategoryLabel(categoryCode, categories);

  const filteredMasters = useMemo(() => {
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
      masterCount: filteredMasters.length,
    };
  }, [listings, filteredMasters.length]);

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

  const geoPromptMobile =
    quickChipIds.has('near') && !hasGeo ? <GeoPromptCard onAllow={requestGeo} /> : null;

  const mobileResults = (
    <>
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

  const categoryStructuredData = normalizedCategoryCode
    ? buildCategoryStructuredData(normalizedCategoryCode)
    : null;

  return (
    <>
      {categoryStructuredData ? <JsonLd data={categoryStructuredData} /> : null}
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

      <div className={`relative z-0 min-h-dvh w-full lg:hidden ${catalogCanvasClass}`}>
        <h1 className="sr-only">{categoryName}</h1>
        <CatalogMobileCategoryHeader
          title={categoryName}
          closeTo={SERVICES_PATH}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Имя мастера, услуга, район…"
          filters={filters}
          onToggleChip={toggleChip}
          onOpenFilters={openFilters}
          activeFilterCount={activeFilterCount}
        />

        <div
          className={`mx-auto w-full pt-2 ${catalogMobileContentBelowHeaderClass} ${catalogMobilePadX} ${CLIENT_CONTENT_PAD_BOTTOM}`}
        >
          {geoPromptMobile}

          {!loading && !error && categories.length > 0 ? (
            <div className="scrollbar-hidden -mx-0.5 mb-3 flex gap-2 overflow-x-auto px-0.5">
              <ServiceCategoryRail
                categories={categories}
                activeCode={normalizedCategoryCode ?? null}
                showAllLink
                onSelectCategory={handleCategorySelect}
              />
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
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
          ) : null}

          <div className="pb-6">{mobileResults}</div>
        </div>
      </div>

      <MastersCatalogFiltersSheet
        open={filterOpen}
        draft={filterDraft}
        resultCount={filteredMasters.length}
        categories={categories}
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
