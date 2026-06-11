import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import { ServiceCategoryRail } from '../components/ServiceCategoryRail';
import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import {
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSection,
  FilterSwitch,
  HiBanknotes,
  PRICE_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';
import { CatalogFilterWhenTimeSection } from './CatalogFilterWhenTimeSection';
import { ServicesCatalogFiltersSheetPanel } from './ServicesCatalogFiltersSheetPanel';
import {
  HiAdjustmentsHorizontal,
  HiBuildingStorefront,
  HiClock,
  HiStar,
} from 'react-icons/hi2';
import { catalogFieldClass } from './servicesCatalogTheme';
import { catalogServicesFilterHints } from './catalogFilterHints';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  layout?: 'grid' | 'sidebar' | 'sheet';
  /** На десктопе категории вынесены в сайдбар; для sheet/grid передаём список. */
  categories?: ServiceCategoryDto[];
};

export function ServicesCatalogFiltersPanel({
  filters,
  onChange,
  layout = 'grid',
  categories = [],
}: Props) {
  const sidebar = layout === 'sidebar';
  const sheet = layout === 'sheet';
  const uiVariant = sheet ? 'sheet' : 'default';
  const hints = catalogServicesFilterHints(filters);
  const chipsClass = sidebar || sheet ? 'flex flex-wrap gap-2' : 'mt-3 flex flex-wrap gap-2';
  const rootClass = sidebar
    ? 'flex flex-col gap-4'
    : sheet
      ? 'flex flex-col gap-5'
      : 'grid gap-5 md:grid-cols-2 xl:grid-cols-3';

  const set = (patch: Partial<CatalogFiltersState>) => onChange({ ...filters, ...patch });

  const showCategories = categories.length > 0 && layout !== 'sidebar';
  const categoryHint =
    filters.categoryCode != null
      ? categories.find((c) => categoryCodesMatch(filters.categoryCode, c.code))?.name ?? null
      : null;

  if (sheet || sidebar) {
    return (
      <ServicesCatalogFiltersSheetPanel
        filters={filters}
        onChange={onChange}
        categories={categories}
        hidePromo={sidebar}
        hideCategory={sidebar}
      />
    );
  }

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

  return (
    <div className={rootClass}>
      <FilterSection
        icon={HiBanknotes}
        title="Цена, BYN"
        activeHint={hints.price}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {PRICE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.priceTier === value}
              label={label}
              variant={uiVariant}
              onClick={() => setPriceTier(value)}
            />
          ))}
        </div>
        <div className={`${sidebar ? 'mt-3' : 'mt-2.5'} grid grid-cols-2 gap-2`}>
          <label className="block">
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
              className={catalogFieldClass}
            />
          </label>
          <label className="block">
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
              className={catalogFieldClass}
            />
          </label>
        </div>
      </FilterSection>

      <div className="min-w-0 md:col-span-2 xl:col-span-3">
        <CatalogFilterWhenTimeSection filters={filters} onChange={onChange} />
      </div>

      {showCategories ? (
        <FilterSection
          title="Категория"
          activeHint={categoryHint}
          variant={uiVariant}
        >
          <ServiceCategoryRail
            categories={categories}
            activeCode={filters.categoryCode}
            showAllLink
            onSelectCategory={(code) => set({ categoryCode: code })}
          />
        </FilterSection>
      ) : null}

      <FilterSection
        icon={HiStar}
        title="Рейтинг мастера"
        activeHint={hints.rating}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {RATING_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ minRating: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBuildingStorefront} title="Где" activeHint={hints.visit} variant={uiVariant}>
        <div className={chipsClass}>
          {VISIT_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        icon={HiClock}
        title="Длительность"
        activeHint={hints.duration}
        variant={uiVariant}
      >
        <div className={chipsClass}>
          {DURATION_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              label={label}
              variant={uiVariant}
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiAdjustmentsHorizontal} title="Дополнительно" activeHint={hints.extra} variant={uiVariant}>
        <div className="flex flex-col gap-2.5">
          <FilterSwitch
            active={filters.onlineBookingOnly}
            label="Только с онлайн-записью"
            variant={uiVariant}
            onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
          />
        </div>
      </FilterSection>
    </div>
  );
}
