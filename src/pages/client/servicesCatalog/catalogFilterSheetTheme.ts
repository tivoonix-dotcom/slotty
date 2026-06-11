/** Bottom sheet фильтров — стиль WB, цвета Slotty */

export const catalogFilterSheetCanvas = 'bg-[#F5F5F5]';

/** Шапка sheet фильтров — сплошной розовый `#F47C8C` */
export const catalogFilterSheetHeaderBarClass =
  'relative box-border w-full min-w-full shrink-0 overflow-hidden pt-[env(safe-area-inset-top,0px)]';

export const catalogFilterSheetHeaderRowClass =
  'relative z-10 grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 lg:min-h-[3.25rem] lg:px-5';

export const catalogFilterSheetHeaderRowGridClass =
  'relative z-10 grid min-h-12 grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 lg:px-5';

export const catalogFilterSheetTitleClass =
  'm-0 min-w-0 truncate text-[17px] font-bold leading-none tracking-[-0.01em] text-white lg:text-[18px]';

export const catalogFilterSheetTitleCenterClass =
  'm-0 min-w-0 truncate text-center text-[17px] font-bold leading-none tracking-[-0.01em] text-white';

export const catalogFilterSheetCloseBtnClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-white transition active:scale-95 active:bg-black/25';

export const catalogFilterSheetBackBtnClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/15 text-white transition active:scale-95 active:bg-black/25';

export const catalogFilterSheetCardClass = 'rounded-[20px] bg-white px-4 py-4';

/** Ширина desktop-drawer фильтров каталога. */
export const catalogFilterSheetDesktopAsideClass =
  'fixed inset-y-0 right-0 z-10 hidden w-full max-w-[min(100vw-1.5rem,560px)] flex-col overflow-hidden shadow-[-16px_0_48px_rgba(17,24,39,0.14)] xl:max-w-[600px] lg:flex';

export const catalogFilterSheetSectionTitleClass =
  'mb-3 text-[15px] font-bold text-[#111827]';

export const catalogFilterSheetSectionLabel =
  'text-[15px] font-bold text-[#111827]';

export const catalogFilterSheetPriceInputClass =
  'h-11 w-full rounded-[12px] bg-[#F0F0F2] px-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:bg-[#E8E8EA]';

/** Фон hero каталога — `public/photos/landing/background.webp` */
export const catalogHeroPhotoBg = '/photos/landing/background.webp';

/** Красный фон акций — `public/photos/history/red.webp` */
export const catalogFilterPromoBg = '/photos/history/red.webp';

export const catalogFilterSheetPromoBarClass =
  'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-[14px] px-4 py-3.5';

export const catalogFilterSheetPrimaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[14px] bg-[#F47C8C] px-4 text-[15px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const catalogFilterSheetSecondaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#FFF1F4] px-4 text-[15px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export function catalogFilterSheetChipClass(active: boolean): string {
  return `rounded-[12px] px-3.5 py-2 text-[14px] transition active:scale-[0.98] ${
    active
      ? 'bg-[#F47C8C] font-semibold text-white'
      : 'bg-[#F0F0F2] font-medium text-[#111827]'
  }`;
}

export const catalogFilterSheetToggleRow =
  'flex cursor-pointer items-center justify-between gap-3 rounded-[12px] bg-[#F0F0F2] px-4 py-3.5';
