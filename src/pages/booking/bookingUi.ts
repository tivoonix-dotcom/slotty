import {
  catalogFilterChipActive,
  catalogFilterChipIdle,
  catalogListCardClass,
} from '../client/servicesCatalog/servicesCatalogTheme';

export const bookingCard = `${catalogListCardClass} ring-1 ring-[#EEEEEE]`;

export const bookingMutedPanel = 'rounded-[10px] bg-[#F5F5F5]';

export const bookingChipActive = catalogFilterChipActive;

export const bookingChipIdle = catalogFilterChipIdle;

export {
  bookingTimeSlotActive as bookingSlotActive,
  bookingTimeSlotIdle as bookingSlotIdle,
} from './bookingDateTimeUi';

export const bookingSectionLabel =
  'text-[15px] font-bold tracking-[-0.02em] text-[#111827]';

export const bookingBackLink =
  'inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] transition hover:text-[#111827]';
