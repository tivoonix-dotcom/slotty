import type { CatalogSortBy } from './catalogFiltersState';
import { CATALOG_SORT_OPTIONS } from './catalogFiltersState';
import { CatalogSortSelect } from './CatalogSortSelect';

type Props = {
  count: number;
  sortBy: CatalogSortBy;
  onSortChange: (value: CatalogSortBy) => void;
};

function servicesCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'услуга'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'услуги'
        : 'услуг';
  return `Найдено ${count} ${word}`;
}

export function CatalogResultsHeader({ count, sortBy, onSortChange }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
          Услуги в каталоге
        </h2>
        <p className="mt-0.5 text-[14px] text-[#6B7280]">{servicesCountLabel(count)}</p>
      </div>
      <CatalogSortSelect
        value={sortBy}
        onChange={onSortChange}
        options={CATALOG_SORT_OPTIONS}
      />
    </div>
  );
}
