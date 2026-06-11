import { HiFunnel, HiXMark } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { ADMIN_SEGMENT_NAV_DESKTOP } from '../adminCabinetLayout';
import {
  catalogSheetField,
  catalogSheetLabel,
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import {
  sheetHintClass,
  sheetSectionTitleClass,
} from '../profile/adminProfileCabinetTheme';
import { getActiveCatalogFilterChips } from './catalogFilterLabels';

/** Белая секция без overflow-hidden — иначе обрезаются чипы и подписи. */
const catalogFilterSectionClass = 'rounded-[16px] bg-white p-4 sm:p-5';

function catalogFilterSegmentClass(active: boolean): string {
  return `relative z-[1] min-h-10 shrink-0 rounded-[10px] px-3.5 text-[13px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 sm:text-[14px] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-white text-[#374151] ring-1 ring-[#EAECEF]'
  }`;
}

export type CatalogVisibilityFilter = 'all' | 'visible' | 'hidden';
export type CatalogPriceFilter = 'all' | 'fixed' | 'from';
export type CatalogDurationFilter = 'all' | 'short' | 'medium' | 'long';
export type CatalogSort = 'catalog' | 'title' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export type CatalogFiltersState = {
  visibility: CatalogVisibilityFilter;
  price: CatalogPriceFilter;
  /** Минимальная цена (BYN), когда выбрано «От…». */
  priceFromMin: number | null;
  duration: CatalogDurationFilter;
  sort: CatalogSort;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFiltersState = {
  visibility: 'all',
  price: 'all',
  priceFromMin: null,
  duration: 'all',
  sort: 'catalog',
};

const VISIBILITY: Array<{ id: CatalogVisibilityFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'visible', label: 'Видимые' },
  { id: 'hidden', label: 'Скрытые' },
];

const PRICE: Array<{ id: CatalogPriceFilter; label: string }> = [
  { id: 'all', label: 'Любая' },
  { id: 'fixed', label: 'Точная' },
  { id: 'from', label: 'От…' },
];

const DURATION: Array<{ id: CatalogDurationFilter; label: string }> = [
  { id: 'all', label: 'Любая' },
  { id: 'short', label: '≤30 мин' },
  { id: 'medium', label: '31–90' },
  { id: 'long', label: '90+ мин' },
];

const SORT: Array<{ id: CatalogSort; label: string }> = [
  { id: 'catalog', label: 'Как в каталоге' },
  { id: 'title', label: 'По названию' },
  { id: 'price_asc', label: 'Дешевле' },
  { id: 'price_desc', label: 'Дороже' },
  { id: 'duration_asc', label: 'Короче' },
  { id: 'duration_desc', label: 'Дольше' },
];

function PriceFilterSection({
  filters,
  priceSuggestions,
  onChange,
}: {
  filters: CatalogFiltersState;
  priceSuggestions: number[];
  onChange: (patch: Partial<CatalogFiltersState>) => void;
}) {
  const setPriceMode = (price: CatalogPriceFilter) => {
    onChange({
      price,
      priceFromMin: price === 'from' ? filters.priceFromMin : null,
    });
  };

  const setMinPrice = (raw: string) => {
    const normalized = raw.trim().replace(',', '.');
    if (!normalized) {
      onChange({ price: 'from', priceFromMin: null });
      return;
    }
    const n = Number(normalized);
    onChange({
      price: 'from',
      priceFromMin: Number.isFinite(n) && n >= 0 ? n : null,
    });
  };

  return (
    <section className={catalogFilterSectionClass}>
      <p className={sheetSectionTitleClass}>Цена</p>
      <p className={`mt-1 ${sheetHintClass}`}>
        Точная — фиксированная цена. От — показать услуги от выбранной суммы.
      </p>
      <div
        className={`${ADMIN_SEGMENT_NAV_DESKTOP} relative mt-3`}
        role="group"
        aria-label="Тип цены"
      >
        {PRICE.map((option) => {
          const selected = filters.price === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPriceMode(option.id)}
              aria-pressed={selected}
              className={catalogFilterSegmentClass(selected)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filters.price === 'from' ? (
        <div className="mt-3 space-y-3 rounded-[12px] bg-[#F6F7FB] p-3.5">
          <label className="block">
            <span className={catalogSheetLabel}>Минимальная цена, BYN</span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.priceFromMin != null ? String(filters.priceFromMin) : ''}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Например, 50"
              className={`${catalogSheetField} mt-1.5 bg-white`}
              aria-label="Минимальная цена в BYN"
            />
          </label>
          {priceSuggestions.length > 0 ? (
            <div>
              <p className="text-[12px] font-medium text-[#6B7280]">Быстрый выбор</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {priceSuggestions.map((price) => {
                  const selected = filters.priceFromMin === price;
                  return (
                    <button
                      key={price}
                      type="button"
                      onClick={() => onChange({ price: 'from', priceFromMin: price })}
                      className={catalogFilterSegmentClass(selected)}
                    >
                      от {price} BYN
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FilterSegmentGroup<T extends string>({
  title,
  hint,
  options,
  value,
  onChange,
}: {
  title: string;
  hint?: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <section className={catalogFilterSectionClass}>
      <p className={sheetSectionTitleClass}>{title}</p>
      {hint ? <p className={`mt-1 ${sheetHintClass}`}>{hint}</p> : null}
      <div
        className={`${ADMIN_SEGMENT_NAV_DESKTOP} relative mt-3`}
        role="group"
        aria-label={title}
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={catalogFilterSegmentClass(selected)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function catalogFiltersAreActive(filters: CatalogFiltersState): boolean {
  return getActiveCatalogFilterChips(filters).length > 0;
}

type Props = {
  open: boolean;
  filters: CatalogFiltersState;
  resultCount: number;
  totalCount: number;
  priceSuggestions?: number[];
  onChange: (patch: Partial<CatalogFiltersState>) => void;
  onReset: () => void;
  onClose: () => void;
};

export function ServicesCatalogFiltersSheet({
  open,
  filters,
  resultCount,
  totalCount,
  priceSuggestions = [],
  onChange,
  onReset,
  onClose,
}: Props) {
  const activeChips = getActiveCatalogFilterChips(filters);
  const hasActive = activeChips.length > 0;

  return (
    <AdminBottomSheet
      variant="catalog"
      open={open}
      onClose={onClose}
      title="Фильтры каталога"
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="button" className={catalogSheetPrimaryBtn} onClick={onClose}>
            {resultCount === totalCount ? 'Готово' : `Показать ${resultCount}`}
          </button>
          {hasActive ? (
            <button type="button" className={catalogSheetSecondaryBtn} onClick={onReset}>
              Сбросить все фильтры
            </button>
          ) : null}
        </div>
      }
    >
      <div className="max-h-[min(62dvh,32rem)] space-y-3 overflow-y-auto overscroll-contain pb-1">
        <section className={`${catalogFilterSectionClass} flex items-start gap-3`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#F47C8C]">
            <HiFunnel className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
              Результат
            </p>
            <p className="mt-1 text-[22px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#111827]">
              {resultCount}
              <span className="text-[15px] font-bold text-[#9CA3AF]"> / {totalCount}</span>
            </p>
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-[#6B7280]">
              {hasActive
                ? `Применено фильтров: ${activeChips.length}`
                : 'Показаны все услуги каталога'}
            </p>
          </div>
        </section>

        {hasActive ? (
          <section className={catalogFilterSectionClass}>
            <p className={sheetSectionTitleClass}>Активные фильтры</p>
            <p className={`mt-1 ${sheetHintClass}`}>Нажмите на чип, чтобы убрать условие</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => onChange(chip.reset)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] py-2 pl-3.5 pr-2.5 text-[13px] font-semibold text-[#F47C8C] ring-1 ring-[#FDE8ED] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
                >
                  {chip.label}
                  <HiXMark className="h-4 w-4 opacity-80" aria-hidden />
                  <span className="sr-only">Сбросить</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <FilterSegmentGroup
          title="Видимость"
          hint="Показывать видимые, скрытые или все услуги"
          options={VISIBILITY}
          value={filters.visibility}
          onChange={(visibility) => onChange({ visibility })}
        />
        <PriceFilterSection
          filters={filters}
          priceSuggestions={priceSuggestions}
          onChange={onChange}
        />
        <FilterSegmentGroup
          title="Длительность"
          hint="Диапазон длительности услуги"
          options={DURATION}
          value={filters.duration}
          onChange={(duration) => onChange({ duration })}
        />
        <FilterSegmentGroup
          title="Сортировка"
          hint="Порядок списка в каталоге"
          options={SORT}
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
        />
      </div>
    </AdminBottomSheet>
  );
}
