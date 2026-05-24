import {
  CATALOG_VIEW_TABS,
  type CatalogViewTab,
} from './catalogFiltersState';
import {
  catalogViewTabActive,
  catalogViewTabIdle,
} from './servicesCatalogTheme';

type Props = {
  activeTab: CatalogViewTab;
  onTabChange: (tab: CatalogViewTab) => void;
  className?: string;
  compact?: boolean;
};

export function ServicesCatalogViewTabs({ activeTab, onTabChange, className = '', compact = false }: Props) {
  const tabClass = compact
    ? 'rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition'
    : 'rounded-[10px] px-4 py-2 text-[14px] font-semibold transition';

  return (
    <nav
      className={`flex flex-wrap items-center gap-1 ${className}`}
      aria-label="Разделы каталога"
    >
      {CATALOG_VIEW_TABS.map((tab) => {
        const on = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onTabChange(tab.id)}
            className={`${tabClass} ${on ? catalogViewTabActive : catalogViewTabIdle}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
