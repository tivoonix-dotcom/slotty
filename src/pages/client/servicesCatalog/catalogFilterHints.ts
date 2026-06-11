import type { CatalogFiltersState } from './catalogFiltersState';
import {
  formatDateOffsetLabel,
  formatSlotDateLabel,
  formatTimeRangeLabel,
  isFullTimeRange,
} from './catalogFilterDateTime';
import {
  DATE_FILTER_OPTIONS,
  DURATION_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  RATING_FILTER_OPTIONS,
  TIME_FILTER_OPTIONS,
  VISIT_FILTER_OPTIONS,
} from './catalogFilterUi';

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T,
): string | null {
  if (value === 'any') return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export function catalogServicesFilterHints(filters: CatalogFiltersState) {
  const priceHint =
    filters.priceTier !== 'any'
      ? PRICE_FILTER_OPTIONS.find((o) => o.value === filters.priceTier)?.label ?? null
      : filters.minPrice != null || filters.maxPrice != null
        ? [
            filters.minPrice != null ? `от ${filters.minPrice}` : null,
            filters.maxPrice != null ? `до ${filters.maxPrice}` : null,
          ]
            .filter(Boolean)
            .join(' ')
        : null;

  const extraHints = [
    filters.onlineBookingOnly ? 'онлайн-запись' : null,
    filters.promotionOnly ? 'акции' : null,
    filters.verifiedOnly ? 'проверенные' : null,
  ].filter(Boolean);

  return {
    when:
      filters.slotDate != null
        ? formatSlotDateLabel(filters.slotDate)
        : filters.dateDayOffset != null
          ? formatDateOffsetLabel(filters.dateDayOffset)
          : filters.dateRange !== 'any'
            ? optionLabel(DATE_FILTER_OPTIONS, filters.dateRange)
            : null,
    time: !isFullTimeRange(filters.timeStartHour, filters.timeEndHour)
      ? formatTimeRangeLabel(filters.timeStartHour, filters.timeEndHour)
      : optionLabel(TIME_FILTER_OPTIONS, filters.timeOfDay),
    price: priceHint,
    rating:
      filters.minRating != null
        ? RATING_FILTER_OPTIONS.find((o) => o.value === filters.minRating)?.label ?? null
        : null,
    visit: optionLabel(VISIT_FILTER_OPTIONS, filters.visitType),
    duration: optionLabel(DURATION_FILTER_OPTIONS, filters.duration),
    extra: extraHints.length > 0 ? extraHints.join(', ') : null,
  };
}
