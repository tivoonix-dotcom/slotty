import type { CatalogViewTab } from './catalogFiltersState';
import { CatalogStickyToolbar } from './CatalogStickyToolbar';
import { ServicesCatalogViewTabs } from './ServicesCatalogViewTabs';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: CatalogViewTab;
  onTabChange: (tab: CatalogViewTab) => void;
  loading: boolean;
};

export function ServicesCatalogDesktopHero({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  loading,
}: Props) {
  return (
    <CatalogStickyToolbar
      sticky={false}
      compact
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Маникюр, стрижка, брови, массаж…"
      showResultCount={false}
      loading={loading}
    >
      <ServicesCatalogViewTabs activeTab={activeTab} onTabChange={onTabChange} compact />
    </CatalogStickyToolbar>
  );
}
