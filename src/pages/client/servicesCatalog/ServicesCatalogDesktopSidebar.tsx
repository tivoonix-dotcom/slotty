import { HiSquares2X2 } from 'react-icons/hi2';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { type CatalogFiltersState } from './catalogFiltersState';
import { ServicesCatalogCategoryMenu } from './ServicesCatalogCategoryMenu';
import { ServicesCatalogFiltersPanel } from './ServicesCatalogFiltersPanel';
import { FilterSection } from './catalogFilterUi';
import { catalogDesktopPanel } from './servicesCatalogTheme';

type Props = {
  categories: ServiceCategoryDto[];
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  onReset: () => void;
  activeFilterCount: number;
};

export function ServicesCatalogDesktopSidebar({
  categories,
  filters,
  onChange,
  onReset,
  activeFilterCount,
}: Props) {
  const filterSubtitle =
    activeFilterCount > 0
      ? `${activeFilterCount} ${activeFilterCount === 1 ? 'параметр' : activeFilterCount < 5 ? 'параметра' : 'параметров'}`
      : 'Категория, цена, время';

  return (
    <aside
      className={`${catalogDesktopPanel} flex h-full min-h-0 flex-col overflow-hidden`}
    >
      <header className="shrink-0 border-b border-[#EEEEEE] bg-white px-4 pb-3 pt-3 lg:px-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Фильтры</h2>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">{filterSubtitle}</p>
          </div>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="shrink-0 pb-0.5 text-[14px] font-semibold text-[#F47C8C]"
            >
              Сбросить все
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain p-4 pt-3 scrollbar-hidden">
        <FilterSection icon={HiSquares2X2} title="Категория" collapsible={false}>
          <ServicesCatalogCategoryMenu
            categories={categories}
            categoryCode={filters.categoryCode}
            onSelect={(code) => onChange({ ...filters, categoryCode: code })}
            fullWidth
          />
        </FilterSection>

        <ServicesCatalogFiltersPanel filters={filters} onChange={onChange} layout="sidebar" />
      </div>
    </aside>
  );
}
