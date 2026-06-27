import { useEffect, useMemo, useState } from 'react';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { MasterCard } from '../components/MasterCard';
import { MasterSectionRail } from '../components/MasterSectionRail';
import { GeoPromptCard } from '../components/GeoPromptCard';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import { SkeletonMasterCard } from '../components/SkeletonCards';
import { EmptyState } from '../components/EmptyState';
import { CatalogError } from '../components/CatalogError';
import { SectionHeading } from '../components/SectionHeading';
import { useCatalogData } from '../hooks/useCatalogData';
import { groupListingsByMaster } from '../lib/groupMasters';
import { buildMasterFeed } from '../lib/partitionMasters';
import {
  categoryFiltersToApiParams,
  countActiveCategoryFilters,
  DEFAULT_CATEGORY_MASTER_FILTERS,
  filtersToMastersQuickChips,
  hasActiveCatalogFilters,
  filtersForTopRankCatalog,
  getMastersViewTab,
  parseMastersCatalogFiltersFromSearch,
  toggleMastersQuickChip,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import { CatalogMobileMastersHeader } from '../mastersCatalog/CatalogMobileMastersHeader';
import { MastersCatalogDesktop } from '../mastersCatalog/MastersCatalogDesktop';
import { MastersCatalogFiltersSheet } from '../mastersCatalog/MastersCatalogFiltersSheet';
import { MastersCatalogTopRankView } from '../mastersCatalog/MastersCatalogTopRankView';
import { catalogMobileContentBelowHeaderClass } from '../servicesCatalog/catalogMobileFixedLayout';
import { catalogCanvasClass, catalogMobilePadX } from '../servicesCatalog/servicesCatalogTheme';
import { CLIENT_CONTENT_PAD_BOTTOM } from '../clientNavConstants';

export function MastersCatalogPage() {
  const { hasGeo, requestGeo, userLat, userLng } = useOutletContext<ClientOutletContext>();
  const [searchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => parseMastersCatalogFiltersFromSearch(searchParams),
    [searchParams],
  );
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CategoryMasterFilters>(initialFilters);
  const [filterDraft, setFilterDraft] = useState<CategoryMasterFilters>(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setFilters(initialFilters);
    setFilterDraft(initialFilters);
  }, [initialFilters]);

  const activeFilterCount = countActiveCategoryFilters(filters);
  const quickChipIds = useMemo(() => filtersToMastersQuickChips(filters), [filters]);

  const flatMode =
    search.trim().length > 0 || hasActiveCatalogFilters(filters);

  const mastersViewTab = getMastersViewTab(filters);
  const isTopRankView = mastersViewTab === 'top';

  const apiFilters = isTopRankView ? filtersForTopRankCatalog(filters) : filters;

  const apiParams = useMemo(
    () =>
      categoryFiltersToApiParams(
        apiFilters,
        { limit: 80, search: search.trim() || undefined },
        hasGeo,
        { userLat, userLng },
      ),
    [apiFilters, search, hasGeo, userLat, userLng],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Мастера');

  const masters = useMemo(() => groupListingsByMaster(listings), [listings]);

  const feed = useMemo(
    () =>
      buildMasterFeed(masters, {
        hasGeo,
        userLat,
        userLng,
        flatMode,
      }),
    [masters, hasGeo, userLat, userLng, flatMode],
  );

  const toggleChip = (id: string) => {
    const turningOnNear = id === 'near' && !quickChipIds.has('near');
    setFilters((prev) => toggleMastersQuickChip(prev, id));
    if (turningOnNear && !hasGeo) void requestGeo();
  };

  const openFilters = () => {
    setFilterDraft(filters);
    setFilterOpen(true);
  };

  const filterResultCount = feed.total ?? masters.length;

  const showCategoryRail =
    !search.trim() && !isTopRankView && categories.length > 0;

  const showGeoPromptMobile = !hasGeo && (quickChipIds.has('near') || !flatMode);

  const geoPromptMobile = showGeoPromptMobile ? (
    <GeoPromptCard onAllow={requestGeo} />
  ) : null;

  const catalogBody = (
    <>
      {loading ? (
        <div className="space-y-3">
          <SkeletonMasterCard />
          <SkeletonMasterCard />
        </div>
      ) : error ? (
        <CatalogError message={error} onRetry={() => void reload()} />
      ) : feed.total === 0 ? (
        <EmptyState
          title="Мастеров пока нет"
          description="Попробуйте изменить фильтры или зайдите позже"
          actionLabel="Сбросить фильтры"
          onAction={() => setFilters({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
        />
      ) : feed.singleMaster ? (
        <MasterCard
          listing={feed.singleMaster}
          userLat={userLat}
          userLng={userLng}
          layout="featured"
        />
      ) : (
        <div className="space-y-8">
          {feed.sections.map((section) => {
            if (section.id === 'top') {
              return null;
            }

            if (section.layout === 'carousel') {
              return (
                <MasterSectionRail
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.items}
                  userLat={userLat}
                  userLng={userLng}
                />
              );
            }

            return (
              <section key={section.id}>
                <SectionHeading title={section.title} subtitle={section.subtitle} />
                <div className="space-y-2.5">
                  {section.items.map((m) => (
                    <MasterCard
                      key={m.masterId}
                      listing={m}
                      userLat={userLat}
                      userLng={userLng}
                      layout="list"
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <>
      <h1 className="sr-only">Мастера</h1>
      <MastersCatalogDesktop
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters({ ...DEFAULT_CATEGORY_MASTER_FILTERS })}
        categories={categories}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        masters={masters}
        userLat={userLat}
        userLng={userLng}
        hasGeo={hasGeo}
        onRequestGeo={requestGeo}
        showGeoPrompt={quickChipIds.has('near')}
      />

      <div className={`relative z-0 min-h-dvh w-full lg:hidden ${catalogCanvasClass}`}>
        <CatalogMobileMastersHeader
          title="Мастера"
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

          {!loading && !error && showCategoryRail ? (
            <div className="scrollbar-hidden -mx-0.5 mb-3 flex gap-2 overflow-x-auto px-0.5">
              <ServiceCategoryRail
                categories={categories}
                activeCode={filters.categoryCode}
                showAllLink
                onSelectCategory={(code) => setFilters({ ...filters, categoryCode: code })}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-6 pb-6">
            {isTopRankView ? (
              <MastersCatalogTopRankView
                masters={masters}
                loading={loading}
                error={error}
                onRetry={() => void reload()}
                userLat={userLat}
                userLng={userLng}
                variant="mobile"
              />
            ) : (
              catalogBody
            )}
          </div>
        </div>
      </div>

      <MastersCatalogFiltersSheet
        open={filterOpen}
        draft={filterDraft}
        resultCount={filterResultCount}
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
