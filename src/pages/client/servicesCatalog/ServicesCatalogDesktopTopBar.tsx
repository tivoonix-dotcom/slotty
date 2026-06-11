import { CATALOG_HERO_FULL_BLEED_CLASS, CLIENT_CATALOG_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { CatalogSearchSuggestField } from './CatalogSearchSuggestField';
import type { CatalogSearchSuggestSelection } from './catalogSearchSuggestTypes';
import { CatalogHistoryPhotoBackdrop } from './CatalogHistoryPhotoBackdrop';
import {
  catalogHeroShellClass,
  catalogPhotoHeaderSearchClass,
  catalogPhotoHeaderSearchIconClass,
} from './servicesCatalogTheme';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSelect: (selection: CatalogSearchSuggestSelection) => void;
};

/** Розовый блок на всю ширину — поиск внутри shell как у хедера. */
export function ServicesCatalogDesktopTopBar({
  search,
  onSearchChange,
  onSearchSelect,
}: Props) {
  return (
    <header className={`${catalogHeroShellClass} ${CATALOG_HERO_FULL_BLEED_CLASS}`}>
      <div className="pointer-events-none absolute inset-0">
        <CatalogHistoryPhotoBackdrop />
      </div>
      <div className={`${CLIENT_CATALOG_DESKTOP_SHELL_CLASS} relative z-10 py-3 lg:py-3.5`}>
        <CatalogSearchSuggestField
          value={search}
          onChange={onSearchChange}
          onSelect={onSearchSelect}
          placeholder="Маникюр, стрижка, брови, массаж…"
          inputClassName={`h-11 w-full pl-9 pr-9 text-[15px] font-semibold shadow-[0_4px_18px_rgba(17,24,39,0.08)] ${catalogPhotoHeaderSearchClass}`}
          iconClassName={catalogPhotoHeaderSearchIconClass}
          trailing={
            search.trim() ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5F5F5] text-[15px] font-bold text-[#6B7280] hover:bg-[#EBEBEB] hover:text-[#111827]"
              >
                ×
              </button>
            ) : null
          }
        />
      </div>
    </header>
  );
}
