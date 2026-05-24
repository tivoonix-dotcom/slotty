import type { CategoryMasterFilters } from '../lib/categoryMasterFilters';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSection,
  FilterSwitch,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from '../servicesCatalog/catalogFilterUi';
import {
  HiBanknotes,
  HiBuildingStorefront,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiClock,
  HiStar,
} from 'react-icons/hi2';

type Props = {
  filters: CategoryMasterFilters;
  onChange: (next: CategoryMasterFilters) => void;
};

const RATING_OPTIONS = [
  { value: null as CategoryMasterFilters['minRating'], label: 'Все' },
  { value: '45' as const, label: '4.5+' },
  { value: '48' as const, label: '4.8+' },
  { value: '49' as const, label: '4.9+' },
];

const REVIEWS_OPTIONS = [
  { value: null as CategoryMasterFilters['minReviews'], label: 'Все' },
  { value: '5' as const, label: '5+' },
  { value: '20' as const, label: '20+' },
  { value: '50' as const, label: '50+' },
];

const PRICE_OPTIONS = [
  { value: null as CategoryMasterFilters['priceTier'], label: 'Все' },
  { value: 'under30' as const, label: '≤30' },
  { value: '30_50' as const, label: '30–50' },
  { value: '50_100' as const, label: '50–100' },
  { value: 'over100' as const, label: '100+' },
];

export function MastersCatalogFiltersPanel({ filters, onChange }: Props) {
  const set = (patch: Partial<CategoryMasterFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <FilterSection icon={HiCalendarDays} title="Когда">
        <div className="flex flex-wrap gap-2">
          {DATE_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.dateRange === value}
              icon={icon}
              label={label}
              onClick={() => set({ dateRange: value === 'any' ? 'any' : value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Время">
        <div className="flex flex-wrap gap-2">
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

      <FilterSection icon={HiBuildingStorefront} title="Где">
        <div className="flex flex-wrap gap-2">
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

      <FilterSection icon={HiStar} title="Рейтинг мастера">
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              label={label}
              onClick={() =>
                set({
                  minRating: value,
                  sortBy: value ? 'rating' : filters.sortBy === 'rating' ? 'recommended' : filters.sortBy,
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiChatBubbleLeftRight} title="Отзывы">
        <div className="flex flex-wrap gap-2">
          {REVIEWS_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.minReviews === value}
              label={label}
              onClick={() => set({ minReviews: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiBanknotes} title="Цена, BYN">
        <div className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={String(value)}
              active={filters.priceTier === value}
              label={label}
              onClick={() => set({ priceTier: value })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={HiClock} title="Длительность">
        <div className="flex flex-wrap gap-2">
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
        active={filters.onlyWithSlots}
        label="Только с онлайн-записью"
        onChange={(onlyWithSlots) => set({ onlyWithSlots })}
      />
      <FilterSwitch
        active={filters.promotionOnly}
        label="Только с акциями"
        onChange={(promotionOnly) => set({ promotionOnly })}
      />
      <FilterSwitch
        active={filters.verifiedOnly}
        label="Проверенные мастера"
        onChange={(verifiedOnly) => set({ verifiedOnly })}
      />
    </div>
  );
}
