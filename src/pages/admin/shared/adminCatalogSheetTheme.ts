/** Модалки кабинета в стиле OKX-каталога: #F5F5F5 + белые панели без теней. */

export const catalogSheetCanvas = 'bg-[#F5F5F5]';

export const catalogSheetHeader =
  'shrink-0 border-b border-[#EEEEEE] bg-white px-[18px] pb-4 pt-4 lg:px-8 lg:pb-5 lg:pt-6';

export const catalogSheetTitle =
  'text-[20px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[22px]';

export const catalogSheetCloseBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[20px] font-semibold leading-none text-[#6B7280] transition hover:bg-[#E4E4E4] hover:text-[#111827] active:scale-[0.97] lg:h-11 lg:w-11';

export const catalogSheetScrollPad =
  'px-[18px] pb-6 pt-4 lg:px-8 lg:pb-8 lg:pt-5';

/** Степпер в шапке: отступ только под ним, перед серым контентом. */
export const catalogSheetScrollPadFlush =
  'px-[18px] pb-6 pt-4 lg:px-8 lg:pb-8 lg:pt-5';

export const catalogSheetFooter =
  'shrink-0 border-t border-[#eef0f5] bg-white px-[18px] py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:px-8 lg:py-5';

export const catalogSheetField =
  'mt-1.5 w-full rounded-[10px] border-0 bg-[#EBEBEB] px-4 py-3 text-[15px] font-medium text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4]';

export const catalogSheetLabel = 'text-[13px] font-medium text-[#6B7280]';

export const catalogSheetPrimaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#F47C8C] px-4 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const catalogSheetSecondaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-4 text-[15px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const catalogSheetGhostBtn =
  'rounded-[10px] bg-[#FFF1F4] px-3 py-2 text-[12px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98] disabled:opacity-50';

/** Белая секция фильтров — без overflow-hidden, чтобы не обрезать чипы. */
export const catalogFilterSectionClass = 'rounded-[16px] bg-white p-4 sm:p-5';

export function catalogFilterChipClass(active: boolean): string {
  return `rounded-[12px] px-3.5 py-2 text-[14px] transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] font-semibold text-white'
      : 'bg-[#F0F0F2] font-medium text-[#111827]'
  }`;
}

export function catalogFilterSegmentClass(active: boolean): string {
  return `relative z-[1] min-h-10 shrink-0 rounded-[10px] px-3.5 text-[13px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 sm:text-[14px] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-white text-[#374151] ring-1 ring-[#EAECEF]'
  }`;
}
