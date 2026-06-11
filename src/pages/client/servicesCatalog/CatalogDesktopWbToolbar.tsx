import type { ReactNode } from 'react';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { getServiceCategoryLabel } from '../../../features/catalog/serviceCategoryLabels';
import {
  CATALOG_SORT_OPTIONS,
  CATALOG_VIEW_TABS,
  getCatalogViewTab,
  setCatalogViewTab,
  toggleCatalogChip,
  type CatalogFiltersState,
} from './catalogFiltersState';
import { catalogServicesFilterHints } from './catalogFilterHints';
import { CatalogSortSelect } from './CatalogSortSelect';
import { ServicesCatalogCategoryMenu } from './ServicesCatalogCategoryMenu';
import {
  catalogWbFilterPillActive,
  catalogWbFilterPillIdle,
} from './servicesCatalogTheme';

type Props = {
  search: string;
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  count: number;
  onOpenFilters: () => void;
  activeFilterCount: number;
  showMeta?: boolean;
  categories?: ServiceCategoryDto[];
};

function servicesCountWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'услуга';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'услуги';
  return 'услуг';
}

function resolveCatalogPageTitle(search: string, categoryCode: string | null): string {
  const q = search.trim();
  if (q) return q.charAt(0).toUpperCase() + q.slice(1);
  if (categoryCode?.trim()) return getServiceCategoryLabel(categoryCode);
  return 'Услуги';
}

function CatalogFilterPill({
  active = false,
  onClick,
  children,
  className = '',
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${active ? catalogWbFilterPillActive : catalogWbFilterPillIdle} ${className}`}
    >
      {children}
    </button>
  );
}

const SORT_PILL_OPTIONS = CATALOG_SORT_OPTIONS.map((option) =>
  option.value === 'recommended' ? { ...option, label: 'Рекомендуем' } : option,
);

const sortPillClass =
  'shrink-0 snap-start [&_button]:!inline-flex [&_button]:!h-auto [&_button]:!min-h-0 [&_button]:!w-auto [&_button]:!rounded-full [&_button]:!border-0 [&_button]:!bg-[#F0F0F0] [&_button]:!px-3.5 [&_button]:!py-2 [&_button]:!text-[14px] [&_button]:!font-medium [&_button]:hover:!bg-[#E8E8E8] [&_button]:focus:!bg-[#E8E8E8]';

/** Строка заголовка + горизонтальные фильтры как на WB. */
export function CatalogDesktopWbToolbar({
  search,
  filters,
  onFiltersChange,
  count,
  onOpenFilters,
  activeFilterCount,
  showMeta = true,
  categories = [],
}: Props) {
  const title = resolveCatalogPageTitle(search, filters.categoryCode);
  const activeTab = getCatalogViewTab(filters);
  const hints = catalogServicesFilterHints(filters);

  const patch = (next: Partial<CatalogFiltersState>) =>
    onFiltersChange({ ...filters, ...next });

  return (
    <section className="flex flex-col gap-3">
      {showMeta ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[26px]">
            {title}
          </h1>
          <p className="text-[14px] font-medium tabular-nums text-[#8E8E93]">
            {count.toLocaleString('ru-RU')} {servicesCountWord(count)} найдено
          </p>
        </div>
      ) : null}

      <div className="scrollbar-hidden -mx-0.5 flex items-center gap-2 overflow-x-auto pb-0.5 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CatalogSortSelect
          value={filters.sortBy}
          onChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
          options={SORT_PILL_OPTIONS}
          className={sortPillClass}
        />

        <CatalogFilterPill onClick={onOpenFilters} className="relative gap-2">
          <HiAdjustmentsHorizontal className="h-4 w-4 shrink-0" aria-hidden />
          Все фильтры
          {activeFilterCount > 0 ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold text-white">
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </span>
          ) : null}
        </CatalogFilterPill>

        {categories.length > 0 ? (
          <ServicesCatalogCategoryMenu
            categories={categories}
            categoryCode={filters.categoryCode}
            onSelect={(categoryCode) => patch({ categoryCode })}
            variant="pill"
          />
        ) : null}

        {CATALOG_VIEW_TABS.map((tab) => {
          const on = activeTab === tab.id;
          return (
            <CatalogFilterPill
              key={tab.id}
              active={on}
              onClick={() => onFiltersChange(setCatalogViewTab(filters, tab.id))}
            >
              {tab.label}
            </CatalogFilterPill>
          );
        })}

        <CatalogFilterPill
          active={filters.chips.has('today') || filters.dateRange === 'today'}
          onClick={() => onFiltersChange(toggleCatalogChip(filters, 'today'))}
        >
          Сегодня
        </CatalogFilterPill>

        <CatalogFilterPill
          active={filters.promotionOnly || filters.chips.has('promo')}
          onClick={() =>
            patch({
              promotionOnly: !filters.promotionOnly,
            })
          }
        >
          Акции
        </CatalogFilterPill>

        <CatalogFilterPill
          active={filters.minRating != null && filters.minRating >= 4.5}
          onClick={() =>
            patch({
              minRating: filters.minRating != null && filters.minRating >= 4.5 ? null : 4.5,
            })
          }
        >
          ★ от 4,5
        </CatalogFilterPill>

        {hints.price ? (
          <CatalogFilterPill active onClick={onOpenFilters}>
            Цена: {hints.price}
          </CatalogFilterPill>
        ) : (
          <CatalogFilterPill onClick={onOpenFilters}>
            Цена
          </CatalogFilterPill>
        )}

        {hints.when ? (
          <CatalogFilterPill active onClick={onOpenFilters}>
            {hints.when}
          </CatalogFilterPill>
        ) : null}

        {hints.visit ? (
          <CatalogFilterPill active onClick={onOpenFilters}>
            {hints.visit}
          </CatalogFilterPill>
        ) : null}

        {filters.verifiedOnly ? (
          <CatalogFilterPill active onClick={() => patch({ verifiedOnly: false })}>
            Проверенные
          </CatalogFilterPill>
        ) : null}
      </div>
    </section>
  );
}
