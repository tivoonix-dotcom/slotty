import { useCallback, useEffect, useMemo, useState } from 'react';
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from '../../../shared/analytics/analyticsEvents';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { ClientOutletContext } from '../clientOutletContext';
import { getMasterPath } from '../../../app/paths';
import { useCatalogErrorModal } from '../hooks/useCatalogErrorModal';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import { useCatalogData } from '../hooks/useCatalogData';
import { mapListingsToServiceCards } from '../lib/aggregateServices';
import {
  catalogFiltersToApiParams,
  countActiveCatalogFilters,
  parseCatalogFiltersFromSearch,
  resetCatalogFilters,
  type CatalogFiltersState,
} from '../servicesCatalog/catalogFiltersState';
import { ServicesCatalogDesktop } from '../servicesCatalog/ServicesCatalogDesktop';
import { ServicesCatalogFiltersSheet } from '../servicesCatalog/ServicesCatalogFiltersSheet';
import { ServicesCatalogResults } from '../servicesCatalog/ServicesCatalogResults';
import { CatalogMobileServicesHeader } from '../servicesCatalog/CatalogMobileServicesHeader';
import {
  CatalogScrollFilterButton,
  CatalogScrollToTopButton,
} from '../servicesCatalog/CatalogScrollToTopButton';
import { catalogMobileContentBelowHeaderClass } from '../servicesCatalog/catalogMobileFixedLayout';
import { catalogCanvasClass, catalogMobilePadX } from '../servicesCatalog/servicesCatalogTheme';
import type { CatalogSearchSuggestSelection } from '../servicesCatalog/catalogSearchSuggestTypes';
import { CLIENT_CONTENT_PAD_BOTTOM } from '../clientNavConstants';
import { CatalogSeoIntro } from '../../../shared/seo/catalogSeoIntroUi';
import { SERVICES_CATALOG_INTRO } from '../../../shared/seo/catalogSeoIntro';
import { JsonLd } from '../../../shared/seo/JsonLd';
import { buildServicesCatalogStructuredData } from '../../../shared/seo/categoryStructuredData';

export function ServicesCatalogPage() {
  const navigate = useNavigate();
  const { userLat, userLng } = useOutletContext<ClientOutletContext>();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q')?.trim() ?? '';
  const [search, setSearch] = useState(initialQ);
  const [filters, setFilters] = useState<CatalogFiltersState>(() =>
    parseCatalogFiltersFromSearch(searchParams),
  );
  const [filterDraft, setFilterDraft] = useState<CatalogFiltersState>(() =>
    parseCatalogFiltersFromSearch(searchParams),
  );
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveCatalogFilters(filters);

  const apiParams = useMemo(
    () => catalogFiltersToApiParams(filters, search, { userLat, userLng }),
    [filters, search, userLat, userLng],
  );

  const { listings, categories, total, loading, error, reload } = useCatalogData(apiParams);
  useCatalogErrorModal(error, reload, 'Услуги');

  useEffect(() => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.catalogOpen);
  }, []);

  const services = useMemo(() => {
    const cards = mapListingsToServiceCards(listings, categories, { userLat, userLng });
    if (!filters.onlineBookingOnly) return cards;
    return cards.filter((s) => Boolean(s.nearestSlotIso));
  }, [listings, categories, userLat, userLng, filters.onlineBookingOnly]);

  const filtered = services;

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

  const showCategoryRail =
    filters.chips.size === 0 && !search.trim() && services.length > 0;

  const openFilters = () => {
    setFilterDraft({ ...filters, chips: new Set(filters.chips) });
    setFilterOpen(true);
  };

  const handleSearchSelect = useCallback(
    (selection: CatalogSearchSuggestSelection) => {
      if (selection.kind === 'master') {
        navigate(getMasterPath(selection.masterId));
        return;
      }
      if (selection.kind === 'category') {
        setSearch('');
        setFilters((prev) => ({ ...prev, categoryCode: selection.code }));
        return;
      }
      setSearch(selection.text);
    },
    [navigate],
  );

  const resultCount = total > 0 ? total : filtered.length;

  const resultsProps = {
    loading,
    error,
    onRetry: () => void reload(),
    servicesEmpty: services.length === 0 && !loading,
    filteredEmpty: filtered.length === 0 && !loading,
    showSections,
    filtered,
    catalogServices: services,
    popular,
    promoServices,
    resultCount,
  };

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setFilters(resetCatalogFilters());
  }, []);

  const resultsSearchProps = {
    ...resultsProps,
    search,
    onClearSearch: () => setSearch(''),
    onResetFilters: handleResetFilters,
  };

  return (
    <>
      <JsonLd data={buildServicesCatalogStructuredData()} />
      <h1 className="sr-only">Услуги мастеров</h1>
      <ServicesCatalogDesktop
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        onOpenFilters={openFilters}
        onSearchSelect={handleSearchSelect}
        onResetFilters={handleResetFilters}
        categories={categories}
        {...resultsProps}
      />

      <div className={`relative z-0 min-h-dvh w-full lg:hidden ${catalogCanvasClass}`}>
        <CatalogMobileServicesHeader
          title="Услуги"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Маникюр, стрижка, брови…"
          filters={filters}
          onFiltersChange={setFilters}
          onOpenFilters={openFilters}
          onSearchSelect={handleSearchSelect}
          activeFilterCount={activeFilterCount}
        />

        <div
          className={`mx-auto w-full pt-2 ${catalogMobileContentBelowHeaderClass} ${catalogMobilePadX} ${CLIENT_CONTENT_PAD_BOTTOM}`}
        >
          <CatalogSeoIntro text={SERVICES_CATALOG_INTRO} className="mb-3 px-0.5" />

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

          <ServicesCatalogResults
            layout="mobile"
            {...resultsSearchProps}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>

      <ServicesCatalogFiltersSheet
        open={filterOpen}
        draft={filterDraft}
        resultCount={filtered.length}
        categories={categories}
        onChange={setFilterDraft}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters({ ...filterDraft, chips: new Set(filterDraft.chips) });
          setFilterOpen(false);
        }}
      />

      <CatalogScrollFilterButton
        onOpenFilters={openFilters}
        activeFilterCount={activeFilterCount}
      />
      <CatalogScrollToTopButton />
    </>
  );
}
