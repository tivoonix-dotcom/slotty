import type { MastersViewTab } from '../lib/categoryMasterFilters';
import { CatalogStickyToolbar } from '../servicesCatalog/CatalogStickyToolbar';
import { MastersCatalogViewTabs } from './MastersCatalogViewTabs';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: MastersViewTab;
  onTabChange: (tab: MastersViewTab) => void;
  loading: boolean;
};

export function MastersCatalogDesktopHero({
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
      searchPlaceholder="Имя мастера, услуга, район…"
      showResultCount={false}
      loading={loading}
    >
      <MastersCatalogViewTabs activeTab={activeTab} onTabChange={onTabChange} compact />
    </CatalogStickyToolbar>
  );
}
