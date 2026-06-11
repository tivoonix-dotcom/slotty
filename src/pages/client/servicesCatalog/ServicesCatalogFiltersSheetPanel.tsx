import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import {
  CATALOG_SORT_OPTIONS,
  CATALOG_VIEW_TABS,
  getCatalogViewTab,
  setCatalogViewTab,
  type CatalogViewTab,
} from './catalogFiltersState';
import { catalogFilterSheetPriceInputClass } from './catalogFilterSheetTheme';
import {
  FilterChip,
  FilterPromoBar,
  FilterSection,
  FilterSwitch,
  SHEET_DURATION_FILTER_OPTIONS,
  SHEET_PRICE_FILTER_OPTIONS,
  SHEET_RATING_FILTER_OPTIONS,
  SHEET_VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';
import { CatalogFilterWhenTimeSection } from './CatalogFilterWhenTimeSection';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  categories: ServiceCategoryDto[];
  /** Скрыть блок «Акции» (например, в десктоп-сайдбаре). */
  hidePromo?: boolean;
  /** Скрыть категории (если вынесены отдельно в сайдбар). */
  hideCategory?: boolean;
};

const PICKUP_TABS = CATALOG_VIEW_TABS.filter((tab) => tab.id !== 'all');

/** Полный набор фильтров каталога услуг — мобильный sheet и desktop-drawer. */
export function ServicesCatalogFiltersSheetPanel({
  filters,
  onChange,
  categories,
  hidePromo = false,
  hideCategory = false,
}: Props) {
  const chipsClass = 'flex flex-wrap gap-2';
  const set = (patch: Partial<CatalogFiltersState>) => onChange({ ...filters, ...patch });
  const activePickup = getCatalogViewTab(filters);

  const setPriceTier = (tier: PriceTier) => {
    const range =
      tier === 'under30'
        ? { min: null, max: 30 }
        : tier === '30_50'
          ? { min: 30, max: 50 }
          : tier === '50_100'
            ? { min: 50, max: 100 }
            : tier === 'over100'
              ? { min: 100, max: null }
              : { min: null, max: null };
    onChange({
      ...filters,
      priceTier: tier,
      minPrice: range.min,
      maxPrice: range.max,
    });
  };

  const togglePickup = (tab: CatalogViewTab) => {
    onChange(setCatalogViewTab(filters, activePickup === tab ? 'all' : tab));
  };

  return (
    <div className="flex flex-col gap-5">
      {!hidePromo ? (
        <FilterPromoBar
          active={filters.promotionOnly || activePickup === 'promo'}
          label="Акции"
          onChange={(promotionOnly) => {
            if (promotionOnly) {
              onChange(setCatalogViewTab(filters, 'promo'));
              return;
            }
            onChange(
              activePickup === 'promo'
                ? setCatalogViewTab(filters, 'all')
                : { ...filters, promotionOnly: false },
            );
          }}
        />
      ) : null}

      <FilterSection title="Подборки" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {PICKUP_TABS.map((tab) => (
            <FilterChip
              key={tab.id}
              active={activePickup === tab.id}
              label={tab.label}
              variant="sheet"
              onClick={() => togglePickup(tab.id)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Цена, BYN" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_PRICE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.priceTier === value}
              label={label}
              variant="sheet"
              onClick={() => setPriceTier(value)}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-medium text-[#8E8E93]">От</span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.minPrice != null ? String(filters.minPrice) : ''}
              onChange={(e) => {
                const v = e.target.value.trim().replace(',', '.');
                const n = v ? Number(v) : NaN;
                set({
                  priceTier: 'any',
                  minPrice: v && Number.isFinite(n) ? n : null,
                });
              }}
              placeholder="0"
              className={catalogFilterSheetPriceInputClass}
            />
          </label>
          <span className="mt-5 text-[#8E8E93]" aria-hidden>
            —
          </span>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-medium text-[#8E8E93]">До</span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
              onChange={(e) => {
                const v = e.target.value.trim().replace(',', '.');
                const n = v ? Number(v) : NaN;
                set({
                  priceTier: 'any',
                  maxPrice: v && Number.isFinite(n) ? n : null,
                });
              }}
              placeholder="∞"
              className={catalogFilterSheetPriceInputClass}
            />
          </label>
        </div>
      </FilterSection>

      <CatalogFilterWhenTimeSection filters={filters} onChange={onChange} />

      {!hideCategory && categories.length > 0 ? (
        <FilterSection title="Категория" variant="sheet" collapsible={false}>
          <div className={chipsClass}>
            <FilterChip
              active={filters.categoryCode == null}
              label="Все"
              variant="sheet"
              onClick={() => set({ categoryCode: null })}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.code}
                active={categoryCodesMatch(filters.categoryCode, cat.code)}
                label={cat.name}
                variant="sheet"
                onClick={() => set({ categoryCode: cat.code })}
              />
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Рейтинг мастера" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_RATING_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              variant="sheet"
              onClick={() => set({ minRating: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Формат" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_VISIT_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              label={label}
              variant="sheet"
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Длительность" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {SHEET_DURATION_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              label={label}
              variant="sheet"
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Сортировка" variant="sheet" collapsible={false}>
        <div className={chipsClass}>
          {CATALOG_SORT_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.sortBy === value}
              label={label}
              variant="sheet"
              onClick={() => set({ sortBy: value })}
            />
          ))}
        </div>
      </FilterSection>

      <div className="flex flex-col gap-2">
        <FilterSwitch
          active={filters.onlineBookingOnly}
          label="Только с онлайн-записью"
          variant="sheet"
          onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
        />
        <FilterSwitch
          active={filters.verifiedOnly}
          label="Проверенные мастера"
          variant="sheet"
          onChange={(verifiedOnly) => set({ verifiedOnly })}
        />
      </div>
    </div>
  );
}
