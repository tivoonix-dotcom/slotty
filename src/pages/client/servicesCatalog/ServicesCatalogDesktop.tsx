import { useLayoutEffect } from 'react';

import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';

import type { AggregatedServiceCard } from '../lib/aggregateServices';

import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';

import {

  countActiveCatalogFilters,

  getCatalogViewTab,

  setCatalogViewTab,

  type CatalogFiltersState,

} from './catalogFiltersState';

import {

  catalogCanvasClass,

  catalogDesktopShellClass,

  catalogSidebarWidth,

} from './servicesCatalogTheme';

import { ServicesCatalogDesktopHero } from './ServicesCatalogDesktopHero';

import { ServicesCatalogDesktopSidebar } from './ServicesCatalogDesktopSidebar';

import { ServicesCatalogResults } from './ServicesCatalogResults';



type Props = {

  search: string;

  onSearchChange: (value: string) => void;

  filters: CatalogFiltersState;

  onFiltersChange: (next: CatalogFiltersState) => void;

  onResetFilters: () => void;

  categories: ServiceCategoryDto[];

  loading: boolean;

  error: string | null;

  onRetry: () => void;

  servicesEmpty: boolean;

  filteredEmpty: boolean;

  showSections: boolean;

  filtered: AggregatedServiceCard[];

  popular: AggregatedServiceCard[];

  promoServices: AggregatedServiceCard[];

};



export function ServicesCatalogDesktop({

  search,

  onSearchChange,

  filters,

  onFiltersChange,

  onResetFilters,

  categories,

  loading,

  error,

  onRetry,

  servicesEmpty,

  filteredEmpty,

  showSections,

  filtered,

  popular,

  promoServices,

}: Props) {

  const activeFilterCount = countActiveCatalogFilters(filters);

  const activeTab = getCatalogViewTab(filters);

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
            <ServicesCatalogDesktopSidebar
              categories={categories}
              filters={filters}
              onChange={onFiltersChange}
              onReset={onResetFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="shrink-0 pb-3">
              <ServicesCatalogDesktopHero
                search={search}
                onSearchChange={onSearchChange}
                activeTab={activeTab}
                onTabChange={(tab) => onFiltersChange(setCatalogViewTab(filters, tab))}
                loading={loading}
              />
            </div>

            <div className="scrollbar-hidden relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">

            <ServicesCatalogResults

              layout="desktop"

              loading={loading}

              error={error}

              onRetry={onRetry}

              servicesEmpty={servicesEmpty}

              filteredEmpty={filteredEmpty}

              showSections={showSections}

              filtered={filtered}

              popular={popular}

              promoServices={promoServices}

              search={search}

              onClearSearch={() => onSearchChange('')}

              filters={filters}

              onFiltersChange={onFiltersChange}

            />

          </div>

          </div>

        </div>

      </div>

    </div>

  );

}


