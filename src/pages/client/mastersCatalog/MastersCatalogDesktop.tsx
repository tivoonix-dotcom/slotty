import { useLayoutEffect } from 'react';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import type { ServiceListingRecord } from '../../../features/services/model/demoMasters';
import { CLIENT_CATALOG_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import {
  countActiveCategoryFilters,
  getMastersViewTab,
  setMastersViewTab,
  type CategoryMasterFilters,
} from '../lib/categoryMasterFilters';
import {
  catalogCanvasClass,
  catalogDesktopShellClass,
  catalogSidebarWidth,
} from '../servicesCatalog/servicesCatalogTheme';
import { MastersCatalogDesktopHero } from './MastersCatalogDesktopHero';
import { MastersCatalogDesktopSidebar } from './MastersCatalogDesktopSidebar';
import { MastersCatalogResults } from './MastersCatalogResults';
import { MastersCatalogTopRankView } from './MastersCatalogTopRankView';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CategoryMasterFilters;
  onFiltersChange: (next: CategoryMasterFilters) => void;
  onResetFilters: () => void;
  categories: ServiceCategoryDto[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  masters: ServiceListingRecord[];
  userLat: number | null;
  userLng: number | null;
  hasGeo: boolean;
  onRequestGeo: () => void;
  showGeoPrompt: boolean;
};

export function MastersCatalogDesktop({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onResetFilters,
  categories,
  loading,
  error,
  onRetry,
  masters,
  userLat,
  userLng,
  hasGeo,
  onRequestGeo,
  showGeoPrompt,
}: Props) {
  const activeFilterCount = countActiveCategoryFilters(filters);
  const activeTab = getMastersViewTab(filters);
  const isTopRankView = activeTab === 'top';

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
      <div className={`${CLIENT_CATALOG_DESKTOP_SHELL_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden pt-0`}>
        <div className={`grid min-h-0 flex-1 gap-4 overflow-hidden ${catalogSidebarWidth}`}>
          <div className="min-h-0 h-full">
            <MastersCatalogDesktopSidebar
              categories={categories}
              filters={filters}
              onChange={onFiltersChange}
              onReset={onResetFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="scrollbar-hidden relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">
            <div className="sticky top-0 z-20 mb-3">
              <MastersCatalogDesktopHero
                search={search}
                onSearchChange={onSearchChange}
                activeTab={activeTab}
                onTabChange={(tab) => onFiltersChange(setMastersViewTab(filters, tab))}
                loading={loading}
              />
            </div>
            {isTopRankView ? (
              <MastersCatalogTopRankView
                masters={masters}
                loading={loading}
                error={error}
                onRetry={onRetry}
                userLat={userLat}
                userLng={userLng}
                variant="desktop"
              />
            ) : (
            <MastersCatalogResults
              loading={loading}
              error={error}
              onRetry={onRetry}
              masters={masters}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onResetFilters={onResetFilters}
              userLat={userLat}
              userLng={userLng}
              hasGeo={hasGeo}
              onRequestGeo={onRequestGeo}
              showGeoPrompt={showGeoPrompt}
            />
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
