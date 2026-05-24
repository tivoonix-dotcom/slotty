import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSection,
  FilterSwitch,
  HiBanknotes,
  PRICE_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';
import { HiBuildingStorefront, HiCalendarDays, HiClock, HiStar } from 'react-icons/hi2';
import { catalogFieldClass } from './servicesCatalogTheme';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  layout?: 'grid' | 'sidebar';
};

export function ServicesCatalogFiltersPanel({ filters, onChange, layout = 'grid' }: Props) {
  const sidebar = layout === 'sidebar';
  const chipsClass = sidebar ? 'flex flex-wrap gap-2' : 'mt-3 flex flex-wrap gap-2';
  const rootClass = sidebar ? 'flex flex-col gap-4' : 'grid gap-5 md:grid-cols-2 xl:grid-cols-3';

  const set = (patch: Partial<CatalogFiltersState>) => onChange({ ...filters, ...patch });

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
      <FilterSection icon={HiCalendarDays} title="Когда">
        <div className={chipsClass}>
          {DATE_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              icon={icon}
              label={label}
              onClick={() => set({ dateRange: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Время">
        <div className={chipsClass}>
          {TIME_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.timeOfDay === value}
              icon={icon}
              label={label}
              onClick={() => set({ timeOfDay: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBanknotes} title="Цена, BYN">
        <div className={chipsClass}>
          {PRICE_FILTER_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={filters.priceTier === value}
              label={label}
              onClick={() => setPriceTier(value)}
            />
          ))}
        </div>
        <div className={`${sidebar ? 'mt-2' : 'mt-2.5'} grid grid-cols-2 gap-1.5`}>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[#6B7280]">от</span>
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
              className={`h-9 w-full px-2.5 text-[13px] font-medium ${catalogFieldClass}`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[#6B7280]">до</span>
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
              className={`h-9 w-full px-2.5 text-[13px] font-medium ${catalogFieldClass}`}
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection icon={HiStar} title="Рейтинг мастера">
        <div className={chipsClass}>
          {RATING_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              icon={icon}
              label={label}
              onClick={() => set({ minRating: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBuildingStorefront} title="Где">
        <div className={chipsClass}>
          {VISIT_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              icon={icon}
              label={label}
              onClick={() => set({ visitType: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Длительность">
        <div className={chipsClass}>
          {DURATION_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              icon={icon}
              label={label}
              onClick={() => set({ duration: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSwitch
        active={filters.onlineBookingOnly}
        label="Только с онлайн-записью"
        onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
      />
    </div>
  );
}
