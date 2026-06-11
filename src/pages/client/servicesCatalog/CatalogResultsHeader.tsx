import type { CatalogSortBy } from './catalogFiltersState';
import { CATALOG_SORT_OPTIONS } from './catalogFiltersState';
import { CatalogSortSelect } from './CatalogSortSelect';

type Props = {
  count: number;
  sortBy: CatalogSortBy;
  onSortChange: (value: CatalogSortBy) => void;
  /** Встроенный вариант для общей шапки каталога */
  compact?: boolean;
  /** Текст поверх фото-фона шапки */
  onPhotoBg?: boolean;
};

function servicesCountWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'услуга';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'услуги';
  return 'услуг';
}

export function CatalogResultsHeader({
  count,
  sortBy,
  onSortChange,
  compact = false,
  onPhotoBg = false,
}: Props) {
  if (compact) {
    return (
      <div
        className={`relative z-10 mt-1.5 flex items-center justify-between gap-2 border-t border-white/15 pt-2 ${
          onPhotoBg ? '' : 'border-[#EEEEEE]'
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-[13px] font-semibold tracking-[-0.01em] ${
              onPhotoBg ? 'text-white/90' : 'text-[#8E8E93]'
            }`}
          >
            Услуги в каталоге
          </p>
          <p
            className={`mt-0.5 text-[15px] font-bold tabular-nums tracking-[-0.02em] ${
              onPhotoBg ? 'text-white drop-shadow-sm' : 'text-[#111827]'
            }`}
          >
            {count} {servicesCountWord(count)}
          </p>
        </div>
        <CatalogSortSelect
          value={sortBy}
          onChange={onSortChange}
          options={CATALOG_SORT_OPTIONS}
          compact
          onPhotoBg={onPhotoBg}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]">
          Услуги в каталоге
        </h2>
        <p className="mt-0.5 text-[14px] text-[#6B7280]">
          Найдено {count} {servicesCountWord(count)}
        </p>
      </div>
      <CatalogSortSelect
        value={sortBy}
        onChange={onSortChange}
        options={CATALOG_SORT_OPTIONS}
      />
    </div>
  );
}
