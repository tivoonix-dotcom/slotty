import type { ReactNode } from 'react';
import { HiAdjustmentsHorizontal, HiMagnifyingGlass } from 'react-icons/hi2';
import {
  catalogDesktopPanel,
  catalogFieldClass,
  catalogPrimaryBtn,
  catalogSearchFieldClass,
  catalogStickyToolbarClass,
} from './servicesCatalogTheme';
import { CatalogSectionTabs } from './CatalogSectionTabs';
import { CLIENT_STICKY_BELOW_MOBILE_HEADER } from '../clientNavConstants';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  resultCount?: number | null;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  /** false на десктопе — sticky на внешней обёртке */
  sticky?: boolean;
  /** Компактнее padding — страница категории и т.п. */
  compact?: boolean;
  showResultCount?: boolean;
  showSearchButton?: boolean;
};

export function CatalogStickyToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  resultCount = null,
  loading = false,
  children,
  className = '',
  onFilterClick,
  activeFilterCount = 0,
  sticky = true,
  compact = false,
  showResultCount = true,
  showSearchButton = false,
}: Props) {
  const stickyClass = sticky
    ? `${catalogStickyToolbarClass} ${CLIENT_STICKY_BELOW_MOBILE_HEADER} z-30 ${compact ? 'pb-2 pt-0' : 'pb-3 pt-1'}`
    : compact ? 'pb-2 pt-0' : 'pb-3 pt-0';

  const panelPad = compact ? 'px-3.5 py-2.5 lg:px-4 lg:py-3' : 'px-4 py-4 lg:px-6 lg:pt-5 lg:pb-5';
  const searchH = compact ? 'h-9' : 'h-11';
  const filterBtn = compact ? 'h-9 w-9' : 'h-11 w-11';
  const iconLeft = compact ? 'left-3' : 'left-4';
  const searchText = compact ? 'text-[13px]' : 'text-[14px]';
  const searchPl = compact ? 'pl-9' : 'pl-11';

  return (
    <div className={`${stickyClass} ${className}`}>
      <header className={`${catalogDesktopPanel} ${panelPad}`}>
        <CatalogSectionTabs className="hidden lg:flex" compact={compact} />

        {children ? <div className={compact ? 'mt-1.5 lg:mt-2' : 'mt-0 lg:mt-3'}>{children}</div> : null}

        <div className={`flex w-full items-center gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Поиск</span>
            <HiMagnifyingGlass
              className={`pointer-events-none absolute ${iconLeft} top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E93]`}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`${searchH} w-full ${searchPl} ${searchText} font-medium ${catalogSearchFieldClass} ${
                showSearchButton ? 'pr-4' : 'pr-10'
              }`}
            />
            {!showSearchButton && search.trim() ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[16px] text-[#8E8E93] transition hover:bg-[#E4E4E4] hover:text-[#111827]"
              >
                ×
              </button>
            ) : null}
          </label>

          {showSearchButton ? (
            <button type="button" className={`${catalogPrimaryBtn} ${compact ? 'h-9' : 'h-11'} shrink-0 px-5`}>
              Найти
            </button>
          ) : null}

          {showResultCount && !loading && resultCount != null ? (
            <p className="hidden shrink-0 text-[13px] text-[#8E8E93] sm:block">
              <span className="font-semibold tabular-nums text-[#111827]">{resultCount}</span>
            </p>
          ) : null}

          {onFilterClick ? (
            <button
              type="button"
              onClick={onFilterClick}
              aria-label={
                activeFilterCount > 0 ? `Фильтры, выбрано ${activeFilterCount}` : 'Фильтры'
              }
              className={`relative flex ${filterBtn} shrink-0 items-center justify-center ${catalogFieldClass} text-[#6B7280] transition hover:text-[#111827]`}
            >
              <HiAdjustmentsHorizontal className="h-5 w-5" aria-hidden />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F47C8C] px-1 text-[10px] font-bold text-white">
                  {activeFilterCount > 9 ? '9+' : activeFilterCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </header>
    </div>
  );
}
