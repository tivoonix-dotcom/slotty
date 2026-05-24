import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import { SectionHeading } from '../components/SectionHeading';
import { useCatalogData } from '../hooks/useCatalogData';
import { aggregateServicesByCategory } from '../lib/aggregateServices';
import { filterServicesForCatalog } from '../lib/filterServices';
import {
  catalogFiltersToApiParams,
  countActiveCatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  getCatalogViewTab,
  resetCatalogFilters,
  setCatalogViewTab,
  type CatalogFiltersState,
} from '../servicesCatalog/catalogFiltersState';
import { ServicesCatalogDesktop } from '../servicesCatalog/ServicesCatalogDesktop';
import { ServicesCatalogFiltersSheet } from '../servicesCatalog/ServicesCatalogFiltersSheet';
import { ServicesCatalogResults } from '../servicesCatalog/ServicesCatalogResults';
import { CatalogStickyToolbar } from '../servicesCatalog/CatalogStickyToolbar';
import { ServicesCatalogViewTabs } from '../servicesCatalog/ServicesCatalogViewTabs';
import { catalogCanvasClass, catalogDesktopPanel } from '../servicesCatalog/servicesCatalogTheme';
import { CLIENT_CONTENT_PAD_BOTTOM, CLIENT_HEADER_OFFSET } from '../clientNavConstants';

export function ServicesCatalogPage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q')?.trim() ?? '';
  const [search, setSearch] = useState(initialQ);
  const [filters, setFilters] = useState<CatalogFiltersState>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
    chips: new Set(),
  }));
  const [filterDraft, setFilterDraft] = useState<CatalogFiltersState>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
    chips: new Set(),
  }));
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCatalogFilters(filters);

  const apiParams = useMemo(
    () => catalogFiltersToApiParams(filters, search),
    [filters, search],
  );

  const { listings, categories, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Услуги');

  const services = useMemo(
    () => aggregateServicesByCategory(listings, categories),
    [listings, categories],
  );

  const filtered = useMemo(
    () =>
      filterServicesForCatalog(services, {
        search,
        chips: filters.chips,
        onlineBookingOnly: filters.onlineBookingOnly,
      }),
    [services, search, filters.chips, filters.onlineBookingOnly],
  );

  const popular = useMemo(
    () =>
      filtered.filter((s) => s.badge === 'popular' || s.badge === 'hit').slice(0, 6),
    [filtered],
  );

  const promoServices = useMemo(
    () => filtered.filter((s) => s.badge === 'sale' || s.promotionOnly).slice(0, 4),
    [filtered],
  );

  const showSections =
    filters.chips.size === 0 && !search.trim() && filters.categoryCode == null;

  const activeTab = getCatalogViewTab(filters);

  const openFilters = () => {
    setFilterDraft({ ...filters, chips: new Set(filters.chips) });
    setFilterOpen(true);
  };

  const resultsProps = {
    loading,
    error,
    onRetry: () => void reload(),
    servicesEmpty: services.length === 0,
    filteredEmpty: filtered.length === 0,
    showSections,
    filtered,
    popular,
    promoServices,
  };

  const resultsSearchProps = {
    ...resultsProps,
    search,
    onClearSearch: () => setSearch(''),
  };

  return (
    <>
      <ServicesCatalogDesktop
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={() => setFilters(resetCatalogFilters())}
        categories={categories}
        {...resultsProps}
      />

      <div className={`relative z-0 lg:hidden min-h-dvh ${catalogCanvasClass} ${CLIENT_HEADER_OFFSET}`}>
        <div className="mx-auto w-full max-w-lg px-4 pt-1 sm:px-5">
          <CatalogStickyToolbar
            compact
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Маникюр, стрижка, брови, массаж…"
            resultCount={loading || error ? null : filtered.length}
            loading={loading}
            onFilterClick={openFilters}
            activeFilterCount={activeFilterCount}
          >
            <ServicesCatalogViewTabs
              activeTab={activeTab}
              onTabChange={(tab) => setFilters((prev) => setCatalogViewTab(prev, tab))}
              compact
            />
          </CatalogStickyToolbar>

          <div className={`flex flex-col gap-4 ${CLIENT_CONTENT_PAD_BOTTOM} pb-6`}>
            {!loading && !error && services.length > 0 ? (
              <section className={`${catalogDesktopPanel} p-5`}>
                <SectionHeading title="Категории" />
                <ServiceCategoryRail categories={categories} showAllLink />
              </section>
            ) : null}

            <ServicesCatalogResults layout="mobile" {...resultsSearchProps} />
          </div>
        </div>
      </div>

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        draft={filterDraft}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters({ ...filterDraft, chips: new Set(filterDraft.chips) });
          setFilterOpen(false);
        }}
      />
    </>
  );
}
