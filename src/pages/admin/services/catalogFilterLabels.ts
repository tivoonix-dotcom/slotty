import type { CatalogFiltersState } from './ServicesCatalogFiltersSheet';

export type CatalogFilterChip = {
  key: keyof CatalogFiltersState;
  label: string;
  reset: Partial<CatalogFiltersState>;
};

const VISIBILITY_LABELS: Record<CatalogFiltersState['visibility'], string> = {
  all: 'Все',
  visible: 'Видимые',
  hidden: 'Скрытые',
};

const DURATION_LABELS: Record<CatalogFiltersState['duration'], string> = {
  all: 'Любая длительность',
  short: 'До 30 мин',
  medium: '31–90 мин',
  long: 'Больше 90 мин',
};

const SORT_LABELS: Record<CatalogFiltersState['sort'], string> = {
  catalog: 'Как в каталоге',
  title: 'По названию',
  price_asc: 'Дешевле',
  price_desc: 'Дороже',
  duration_asc: 'Короче',
  duration_desc: 'Дольше',
};

export function catalogSortTriggerLabel(sort: CatalogFiltersState['sort']): string {
  if (sort === 'catalog') return 'По умолчанию';
  return SORT_LABELS[sort];
}

export function catalogSortSelectOptions(): Array<{ value: CatalogFiltersState['sort']; label: string }> {
  return (Object.keys(SORT_LABELS) as CatalogFiltersState['sort'][]).map((value) => ({
    value,
    label: `Сортировка: ${catalogSortTriggerLabel(value)}`,
  }));
}

export function catalogFilterChipLabel(
  key: keyof CatalogFiltersState,
  value: CatalogFiltersState[keyof CatalogFiltersState],
): string {
  switch (key) {
    case 'visibility':
      return VISIBILITY_LABELS[value as CatalogFiltersState['visibility']];
    case 'price':
      if (value === 'fixed') return 'Точная цена';
      if (value === 'from') return 'Цена «от»';
      return 'Любая цена';
    case 'duration':
      return DURATION_LABELS[value as CatalogFiltersState['duration']];
    case 'sort':
      return SORT_LABELS[value as CatalogFiltersState['sort']];
    default:
      return String(value);
  }
}

export function getActiveCatalogFilterChips(filters: CatalogFiltersState): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];

  if (filters.visibility !== 'all') {
    chips.push({
      key: 'visibility',
      label: VISIBILITY_LABELS[filters.visibility],
      reset: { visibility: 'all' },
    });
  }
  if (filters.price === 'fixed') {
    chips.push({
      key: 'price',
      label: 'Точная цена',
      reset: { price: 'all', priceFromMin: null },
    });
  }
  if (filters.price === 'from' && filters.priceFromMin != null) {
    chips.push({
      key: 'priceFromMin',
      label: `От ${filters.priceFromMin} BYN`,
      reset: { price: 'all', priceFromMin: null },
    });
  }
  if (filters.duration !== 'all') {
    chips.push({
      key: 'duration',
      label: DURATION_LABELS[filters.duration],
      reset: { duration: 'all' },
    });
  }
  if (filters.sort !== 'catalog') {
    chips.push({
      key: 'sort',
      label: SORT_LABELS[filters.sort],
      reset: { sort: 'catalog' },
    });
  }

  return chips;
}
