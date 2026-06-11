import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { SERVICES_PATH } from '../../../app/paths';
import { formatDurationMinutes, formatMastersCountLabel, formatPriceFrom } from '../lib/catalogFormat';
import { FilterChip } from '../servicesCatalog/catalogFilterUi';
import { CatalogStickyToolbar } from '../servicesCatalog/CatalogStickyToolbar';
import { catalogMetaChipClass } from '../servicesCatalog/servicesCatalogTheme';

const QUICK_CHIPS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'near', label: 'Рядом' },
  { id: 'rating', label: 'Рейтинг' },
  { id: 'price', label: 'Дешевле' },
  { id: 'home', label: 'На дому' },
  { id: 'studio', label: 'В студии' },
  { id: 'promo', label: 'С акциями' },
] as const;

type Props = {
  categoryName: string;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  stats: {
    minPrice: number | null;
    duration: number;
    masterCount: number;
  };
  quickChipIds: Set<string>;
  onToggleChip: (id: string) => void;
};

export function ServiceCategoryDesktopHero({
  categoryName,
  search,
  onSearchChange,
  loading,
  stats,
  quickChipIds,
  onToggleChip,
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
      <div className="min-w-0">
        <Link
          to={SERVICES_PATH}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B7280] transition hover:text-[#111827]"
        >
          <HiArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Услуги
        </Link>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="text-[18px] font-bold leading-tight tracking-[-0.03em] text-[#111827]">
            {categoryName}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {stats.minPrice != null ? (
              <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
                {formatPriceFrom(stats.minPrice)}
              </span>
            ) : null}
            <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
              {formatDurationMinutes(stats.duration)}
            </span>
            <span className={`${catalogMetaChipClass} !py-1 !text-[12px]`}>
              {formatMastersCountLabel(stats.masterCount)}
            </span>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {QUICK_CHIPS.map(({ id, label }) => (
            <FilterChip
              key={id}
              active={quickChipIds.has(id)}
              label={label}
              onClick={() => onToggleChip(id)}
            />
          ))}
        </div>
      </div>
    </CatalogStickyToolbar>
  );
}
