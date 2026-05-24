import { FilterSheet } from '../components/FilterSheet';
import {
  resetCatalogFilters,
  type CatalogFiltersState,
} from './catalogFiltersState';
import { ServicesCatalogFiltersPanel } from './ServicesCatalogFiltersPanel';

type Props = {
  open: boolean;
  draft: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  onClose: () => void;
  onApply: () => void;
};

export function ServicesCatalogFiltersSheet({
  open,
  draft,
  onChange,
  onClose,
  onApply,
}: Props) {
  return (
    <FilterSheet
      open={open}
      title="Фильтры услуг"
      onClose={onClose}
      onReset={() => onChange(resetCatalogFilters())}
      onApply={onApply}
    >
      <ServicesCatalogFiltersPanel filters={draft} onChange={onChange} layout="grid" />
    </FilterSheet>
  );
}
