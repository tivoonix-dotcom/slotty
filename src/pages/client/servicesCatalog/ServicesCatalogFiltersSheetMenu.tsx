import { useState } from 'react';
import type { ServiceCategoryDto } from '../../../features/master-onboarding/api/becomeMasterApi';
import { categoryCodesMatch } from '../../../features/catalog/serviceCategoryLabels';
import type { CatalogFiltersState, PriceTier } from './catalogFiltersState';
import { CatalogFilterSubSheet } from './CatalogFilterSubSheet';
import { CatalogFilterWhenTimeSection } from './CatalogFilterWhenTimeSection';
import {
  FilterMenuCard,
  FilterMenuRow,
  FilterMenuSection,
} from './catalogFilterMenuUi';
import {
  DURATION_FILTER_OPTIONS,
  FilterChip,
  FilterSwitch,
  PRICE_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';
import { catalogServicesFilterHints } from './catalogFilterHints';

type SubSheetId = 'category' | 'when' | 'rating' | 'visit' | 'duration';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  categories: ServiceCategoryDto[];
};

export function ServicesCatalogFiltersSheetMenu({ filters, onChange, categories }: Props) {
  const [subSheet, setSubSheet] = useState<SubSheetId | null>(null);
  const hints = catalogServicesFilterHints(filters);
  const whenTimeHint = [hints.when, hints.time].filter(Boolean).join(' · ') || null;

  const set = (patch: Partial<CatalogFiltersState>) => onChange({ ...filters, ...patch });

  const categoryHint =
    filters.categoryCode != null
      ? categories.find((c) => categoryCodesMatch(filters.categoryCode, c.code))?.name ?? null
      : null;

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

  const pickAndClose = (patch: Partial<CatalogFiltersState>) => {
    set(patch);
    setSubSheet(null);
  };

  const chipGrid = 'flex flex-wrap gap-2';

  return (
    <>
      <FilterMenuCard>
        <div className="divide-y divide-[#F0F0F0]">
          {categories.length > 0 ? (
            <FilterMenuRow
              label="Категория"
              value={categoryHint}
              onClick={() => setSubSheet('category')}
            />
          ) : null}
          <FilterMenuRow label="Когда и время" value={whenTimeHint} onClick={() => setSubSheet('when')} />
          <FilterMenuRow label="Рейтинг" value={hints.rating} onClick={() => setSubSheet('rating')} />
          <FilterMenuRow label="Где" value={hints.visit} onClick={() => setSubSheet('visit')} />
          <FilterMenuRow
            label="Длительность"
            value={hints.duration}
            onClick={() => setSubSheet('duration')}
          />
        </div>
      </FilterMenuCard>

      <FilterMenuCard className="mt-3">
        <FilterMenuSection title="Цена, BYN">
          <div className={`${chipGrid} mb-3`}>
            {PRICE_FILTER_OPTIONS.map(({ value, label }) => (
              <FilterChip
                key={value}
                active={filters.priceTier === value}
                label={label}
                variant="sheet"
                onClick={() => setPriceTier(value)}
              />
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
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
                className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F47C8C]/40"
              />
            </label>
            <span className="mt-5 text-[#8E8E93]" aria-hidden>
              —
            </span>
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
                className="h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F47C8C]/40"
              />
            </label>
          </div>
        </FilterMenuSection>
      </FilterMenuCard>

      <FilterMenuCard className="mt-3 px-4 py-1">
        <FilterSwitch
          active={filters.onlineBookingOnly}
          label="Только с онлайн-записью"
          variant="sheet"
          onChange={(onlineBookingOnly) => set({ onlineBookingOnly })}
        />
      </FilterMenuCard>

      <CatalogFilterSubSheet
        open={subSheet === 'category'}
        title="Категория"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          <FilterChip
            active={filters.categoryCode == null}
            label="Все категории"
            variant="sheet"
            onClick={() => pickAndClose({ categoryCode: null })}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.code}
              active={categoryCodesMatch(filters.categoryCode, cat.code)}
              label={cat.name}
              variant="sheet"
              onClick={() => pickAndClose({ categoryCode: cat.code })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'when'} title="Когда и время" onBack={() => setSubSheet(null)}>
        <CatalogFilterWhenTimeSection filters={filters} onChange={onChange} />
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet
        open={subSheet === 'rating'}
        title="Рейтинг мастера"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {RATING_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={String(value)}
              active={filters.minRating === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ minRating: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet open={subSheet === 'visit'} title="Где" onBack={() => setSubSheet(null)}>
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {VISIT_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.visitType === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ visitType: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>

      <CatalogFilterSubSheet
        open={subSheet === 'duration'}
        title="Длительность"
        onBack={() => setSubSheet(null)}
      >
        <div className={`${chipGrid} rounded-[16px] bg-white p-4`}>
          {DURATION_FILTER_OPTIONS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              active={filters.duration === value}
              icon={icon}
              label={label}
              variant="sheet"
              onClick={() => pickAndClose({ duration: value })}
            />
          ))}
        </div>
      </CatalogFilterSubSheet>
    </>
  );
}
