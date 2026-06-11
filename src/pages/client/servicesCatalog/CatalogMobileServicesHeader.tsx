import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiAdjustmentsHorizontal, HiXMark } from 'react-icons/hi2';
import { CatalogSearchSuggestField } from './CatalogSearchSuggestField';
import type { CatalogSearchSuggestSelection } from './catalogSearchSuggestTypes';
import { HUB_PATH } from '../../../app/paths';
import type { CatalogFiltersState } from './catalogFiltersState';
import { CatalogMobileQuickFilters } from './CatalogMobileQuickFilters';
import { CATALOG_MOBILE_HEADER_HEIGHT_VAR } from './catalogMobileFixedLayout';
import { catalogMobilePadX } from './servicesCatalogTheme';

type Props = {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  onOpenFilters: () => void;
  onSearchSelect: (selection: CatalogSearchSuggestSelection) => void;
  activeFilterCount: number;
  backTo?: string;
};

const iconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:scale-95';

function syncCatalogMobileHeaderHeight(el: HTMLElement | null) {
  const h = el?.offsetHeight ?? 0;
  document.documentElement.style.setProperty(
    CATALOG_MOBILE_HEADER_HEIGHT_VAR,
    h > 0 ? `${h}px` : '10.75rem',
  );
}

export function CatalogMobileServicesHeader({
  title,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFiltersChange,
  onOpenFilters,
  onSearchSelect,
  activeFilterCount,
  backTo = HUB_PATH,
}: Props) {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;

    const update = () => syncCatalogMobileHeaderHeight(el);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      document.documentElement.style.removeProperty(CATALOG_MOBILE_HEADER_HEIGHT_VAR);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 w-full bg-[#F5F5F5] lg:hidden"
    >
      <div className="bg-[#F47C8C] pt-[env(safe-area-inset-top,0px)]">
        <div
          className={`grid min-h-11 grid-cols-[2.25rem_1fr_2.25rem] items-center pb-2 pt-1 ${catalogMobilePadX}`}
        >
          <span className="h-9 w-9" aria-hidden />
          <p className="truncate text-center text-[16px] font-bold text-white">{title}</p>
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Закрыть"
            className={`${iconBtn} justify-self-end`}
          >
            <HiXMark className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className={`relative z-50 pb-3 ${catalogMobilePadX}`}>
          <CatalogSearchSuggestField
            value={search}
            onChange={onSearchChange}
            onSelect={onSearchSelect}
            placeholder={searchPlaceholder}
            inputClassName="h-10 w-full rounded-[12px] border-0 bg-white pl-9 pr-9 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#8E8E93]"
            iconClassName="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]"
            trailing={
              search.trim() ? (
                <button
                  type="button"
                  aria-label="Очистить поиск"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[16px] text-[#8E8E93] transition hover:bg-[#F5F5F5] hover:text-[#111827]"
                >
                  ×
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenFilters}
                  aria-label={
                    activeFilterCount > 0 ? `Фильтры, выбрано ${activeFilterCount}` : 'Фильтры'
                  }
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8E8E93] transition hover:bg-[#F5F5F5] hover:text-[#111827]"
                >
                  <HiAdjustmentsHorizontal className="h-4 w-4" aria-hidden />
                </button>
              )
            }
          />
        </div>
      </div>

      <div className={`border-b border-[#EAEAEA] bg-[#F5F5F5] pb-2.5 pt-2 ${catalogMobilePadX}`}>
        <CatalogMobileQuickFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onOpenFilters={onOpenFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>
    </header>
  );
}
