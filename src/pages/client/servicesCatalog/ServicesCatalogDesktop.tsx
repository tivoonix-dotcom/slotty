import type { AggregatedServiceCard } from '../lib/aggregateServices';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { CLIENT_CATALOG_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { countActiveCatalogFilters, type CatalogFiltersState } from './catalogFiltersState';
import { catalogCanvasClass, catalogDesktopPageClass } from './servicesCatalogTheme';
import { CatalogDesktopHeroPhoto } from './CatalogDesktopHeroPhoto';
import { CatalogDesktopWbToolbar } from './CatalogDesktopWbToolbar';
import { ServicesCatalogDesktopTopBar } from './ServicesCatalogDesktopTopBar';
import type { CatalogSearchSuggestSelection } from './catalogSearchSuggestTypes';
import { ServicesCatalogResults } from './ServicesCatalogResults';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  servicesEmpty: boolean;
  filteredEmpty: boolean;
  showSections: boolean;
  filtered: AggregatedServiceCard[];
  catalogServices: AggregatedServiceCard[];
  popular: AggregatedServiceCard[];
  promoServices: AggregatedServiceCard[];
  resultCount: number;
  onOpenFilters: () => void;
  onSearchSelect: (selection: CatalogSearchSuggestSelection) => void;
  onResetFilters?: () => void;
  categories?: ServiceCategoryDto[];
};

export function ServicesCatalogDesktop({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  servicesEmpty,
  filteredEmpty,
  showSections,
  filtered,
  catalogServices,
  popular,
  promoServices,
  resultCount,
  onOpenFilters,
  onSearchSelect,
  onResetFilters,
  categories = [],
}: Props) {
  const activeFilterCount = countActiveCatalogFilters(filters);

  return (
    <div
      className={`${catalogDesktopPageClass} ${catalogCanvasClass} relative min-h-[calc(100dvh-var(--slotty-header-height,4.25rem))]`}
    >
      <CatalogDesktopHeroPhoto />
      <ServicesCatalogDesktopTopBar
        search={search}
        onSearchChange={onSearchChange}
        onSearchSelect={onSearchSelect}
      />

      <div className={`${CLIENT_CATALOG_DESKTOP_SHELL_CLASS} relative z-10 flex flex-col gap-4 pb-10 pt-4`}>
        {!error ? (
          <CatalogDesktopWbToolbar
            search={search}
            filters={filters}
            onFiltersChange={onFiltersChange}
            count={resultCount}
            onOpenFilters={onOpenFilters}
            activeFilterCount={activeFilterCount}
            showMeta={!loading}
            categories={categories}
          />
        ) : null}

        <ServicesCatalogResults
          layout="desktop"
          loading={loading}
          error={error}
          onRetry={onRetry}
          servicesEmpty={servicesEmpty}
          filteredEmpty={filteredEmpty}
          showSections={showSections}
          filtered={filtered}
          catalogServices={catalogServices}
          popular={popular}
          promoServices={promoServices}
          search={search}
          onClearSearch={() => onSearchChange('')}
          onResetFilters={onResetFilters}
          onOpenFilters={onOpenFilters}
          filters={filters}
          onFiltersChange={onFiltersChange}
          hideResultsHeader
        />
      </div>
    </div>
  );
}
