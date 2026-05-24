import { useLayoutEffect } from 'react';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { countActiveCategoryFilters, type CategoryMasterFilters } from '../lib/categoryMasterFilters';
import {
  catalogCanvasClass,
  catalogDesktopShellClass,
  catalogSidebarWidth,
} from '../servicesCatalog/servicesCatalogTheme';
import { ServiceCategoryDesktopHero } from './ServiceCategoryDesktopHero';
import { ServiceCategoryDesktopSidebar } from './ServiceCategoryDesktopSidebar';
import { ServiceCategoryResults } from './ServiceCategoryResults';

type Props = {
  categoryCode: string;
  categoryName: string;
  search: string;
  onSearchChange: (value: string) => void;
  filters: CategoryMasterFilters;
  onFiltersChange: (next: CategoryMasterFilters) => void;
  onResetFilters: () => void;
  onCategorySelect: (code: string | null) => void;
  categories: ServiceCategoryDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  masters: ServiceListingRecord[];
  stats: {
    minPrice: number | null;
    duration: number;
    masterCount: number;
  };
  quickChipIds: Set<string>;
  onToggleChip: (id: string) => void;
  todayFilterNoSlots: boolean;
  userLat: number | null;
  userLng: number | null;
  hasGeo: boolean;
  onRequestGeo: () => void;
  showGeoPrompt: boolean;
};

export function ServiceCategoryDesktop({
  categoryCode,
  categoryName,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onResetFilters,
  onCategorySelect,
  categories,
  loading,
  error,
  onRetry,
  masters,
  stats,
  quickChipIds,
  onToggleChip,
  todayFilterNoSlots,
  userLat,
  userLng,
  hasGeo,
  onRequestGeo,
  showGeoPrompt,
}: Props) {
  const activeFilterCount = countActiveCategoryFilters(filters);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      document.documentElement.classList.toggle('catalog-desktop-scroll-lock', mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      document.documentElement.classList.remove('catalog-desktop-scroll-lock');
      mq.removeEventListener('change', sync);
    };
  }, []);

  return (
    <div className={`${catalogDesktopShellClass} hidden lg:flex ${catalogCanvasClass}`}>
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden pt-2`}>
        <div className={`grid min-h-0 flex-1 gap-4 overflow-hidden ${catalogSidebarWidth}`}>
          <div className="min-h-0 h-full">
            <ServiceCategoryDesktopSidebar
              categories={categories}
              categoryCode={categoryCode}
              filters={filters}
              onChange={onFiltersChange}
              onReset={onResetFilters}
              onCategorySelect={onCategorySelect}
              activeFilterCount={activeFilterCount}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="shrink-0 pb-3">
              <ServiceCategoryDesktopHero
                categoryName={categoryName}
                search={search}
                onSearchChange={onSearchChange}
                loading={loading}
                stats={stats}
                quickChipIds={quickChipIds}
                onToggleChip={onToggleChip}
              />
            </div>

            <div className="scrollbar-hidden relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">
            <ServiceCategoryResults
              categoryName={categoryName}
              loading={loading}
              error={error}
              onRetry={onRetry}
              masters={masters}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onResetFilters={onResetFilters}
              onShowTomorrow={() => onFiltersChange({ ...filters, dateRange: 'tomorrow' })}
              todayFilterNoSlots={todayFilterNoSlots}
              userLat={userLat}
              userLng={userLng}
              hasGeo={hasGeo}
              onRequestGeo={onRequestGeo}
              showGeoPrompt={showGeoPrompt}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
