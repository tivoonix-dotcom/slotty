import type { CatalogFiltersState } from './catalogFiltersState';
import {
  applyDateDayOffset,
  applyTimeRange,
  dateRangeToDateOffset,
  formatDateOffsetLabel,
  formatSlotDateLabel,
  offsetFromIso,
} from './catalogFilterDateTime';
import { CatalogFilterDateStrip } from './CatalogFilterDateStrip';
import { CatalogFilterTimeRangeSlider } from './CatalogFilterTimeRangeSlider';
import { catalogFilterSheetSectionTitleClass } from './catalogFilterSheetTheme';

type Props = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
};

/** Выбор дня (карусель) + диапазон времени (слайдер) — как в киноафише. */
export function CatalogFilterWhenTimeSection({ filters, onChange }: Props) {
  const selectedOffset =
    filters.dateDayOffset ??
    (filters.slotDate ? offsetFromIso(filters.slotDate) : null) ??
    (filters.dateRange === 'any' ? null : dateRangeToDateOffset(filters.dateRange));

  const whenLabel =
    filters.slotDate != null
      ? formatSlotDateLabel(filters.slotDate)
      : selectedOffset != null
        ? formatDateOffsetLabel(selectedOffset)
        : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="min-w-0">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className={catalogFilterSheetSectionTitleClass}>Когда</h3>
          {whenLabel ? (
            <span className="truncate text-[13px] font-medium text-[#F47C8C]">{whenLabel}</span>
          ) : null}
        </div>
        <CatalogFilterDateStrip
          selectedOffset={selectedOffset}
          onChange={(offset) => onChange(applyDateDayOffset(filters, offset))}
        />
      </section>

      <section className="min-w-0 rounded-[16px] bg-white px-4 py-4">
        <CatalogFilterTimeRangeSlider
          startHour={filters.timeStartHour}
          endHour={filters.timeEndHour}
          onChange={(startHour, endHour) => onChange(applyTimeRange(filters, startHour, endHour))}
        />
      </section>
    </div>
  );
}
