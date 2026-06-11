import {
  CATALOG_VIEW_TABS,
  type CatalogViewTab,
} from './catalogFiltersState';
import {
  catalogPhotoViewTabActive,
  catalogPhotoViewTabIdle,
  catalogViewTabActive,
  catalogViewTabIdle,
} from './servicesCatalogTheme';

type Props = {
  activeTab: CatalogViewTab;
  onTabChange: (tab: CatalogViewTab) => void;
  className?: string;
  compact?: boolean;
  dense?: boolean;
  onPhotoBg?: boolean;
};

export function ServicesCatalogViewTabs({
  activeTab,
  onTabChange,
  className = '',
  compact = false,
  dense = false,
  onPhotoBg = false,
}: Props) {
  const tabClass = dense
    ? 'shrink-0 snap-start rounded-[8px] px-3 py-1 text-[12px] font-semibold transition duration-200'
    : compact
      ? 'shrink-0 snap-start rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition duration-200'
      : 'shrink-0 snap-start rounded-[10px] px-4 py-2 text-[14px] font-semibold transition duration-200';

  return (
    <nav
      className={`-mx-0.5 flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
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
            className={`${tabClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70 ${
              on
                ? onPhotoBg
                  ? catalogPhotoViewTabActive
                  : catalogViewTabActive
                : onPhotoBg
                  ? catalogPhotoViewTabIdle
                  : catalogViewTabIdle
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
