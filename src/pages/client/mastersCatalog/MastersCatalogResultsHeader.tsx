import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import { MASTER_SORT_OPTIONS } from '../lib/categoryMasterFilters';
import { CatalogSortSelect } from '../servicesCatalog/CatalogSortSelect';

type Props = {
  count: number;
  sortBy: CategoryMasterFilters['sortBy'];
  onSortChange: (value: CategoryMasterFilters['sortBy']) => void;
};

function mastersCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'мастер'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'мастера'
        : 'мастеров';
  return `Найдено ${count} ${word}`;
}

export function MastersCatalogResultsHeader({ count, sortBy, onSortChange }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
          Мастера в каталоге
        </h2>
        <p className="mt-0.5 text-[14px] text-[#6B7280]">{mastersCountLabel(count)}</p>
      </div>
      <CatalogSortSelect
        value={sortBy}
        onChange={onSortChange}
        options={MASTER_SORT_OPTIONS}
      />
    </div>
  );
}
