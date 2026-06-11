/** Визуальные токены шапки лендинга (редизайн 2026, Figma Rectangle 11). */

/** Ширина/высота капсулы: W 894 · H 74 · radius 25 · fill #FBEDEC */
export const LANDING_HEADER_MAX_WIDTH_CLASS = 'mx-auto w-full max-w-[894px]';

/** Pill-хедер в каталоге — на всю ширину shell (max-w 1320px). */
export const CATALOG_LANDING_HEADER_WIDTH_CLASS = 'w-full';

export const LANDING_HEADER_SLOT_H = 'h-10';

export const LANDING_HEADER_PILL_CLASS =
  'overflow-visible rounded-[25px] bg-[#FBEDEC] transition-all duration-300';

export const LANDING_HEADER_ROW_CLASS =
  'relative grid h-[74px] grid-cols-[1fr_auto] items-center gap-4 pl-3 pr-6 sm:pl-4 sm:pr-8 lg:grid-cols-[1fr_auto_1fr] lg:pl-5 lg:pr-10';

export const LANDING_HEADER_LOGO_LINK_CLASS =
  'inline-flex w-auto shrink-0 items-center justify-start !h-auto min-h-0 -ml-1 p-0 leading-none opacity-100 hover:opacity-100 sm:-ml-1.5';

export const LANDING_HEADER_LOGO_IMG_CLASS =
  'block h-14 w-auto max-w-none shrink-0 translate-y-[5px] object-contain object-left opacity-100 sm:h-16 sm:translate-y-[6px]';

export const LANDING_HEADER_LOGO_CELL_CLASS = 'col-start-1 row-start-1 justify-self-start';

export const LANDING_HEADER_NAV_CELL_CLASS =
  'col-start-2 row-start-1 hidden justify-self-center lg:flex';

export const LANDING_HEADER_ACTIONS_CELL_CLASS =
  'col-start-2 row-start-1 flex shrink-0 flex-nowrap items-center justify-self-end gap-2 lg:col-start-3 lg:gap-3';

export const LANDING_NAV_LINK_CLASS =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap px-0 text-[15px] font-semibold leading-none lowercase tracking-[-0.01em] text-[#1A1A1A] transition hover:text-[#C97B7B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E29595]/35';

export const LANDING_ICON_BTN_CLASS =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#1A1A1A] transition hover:bg-[#E9E6E6] active:scale-[0.97]';

/** Панель аккаунта при hover на аватар — как pill-хедер, без бордеров. */
export const LANDING_ACCOUNT_PANEL_CLASS =
  'overflow-hidden rounded-[25px] bg-[#FBEDEC] py-2 shadow-[0_12px_40px_rgba(17,24,39,0.1)]';

export const LANDING_ACCOUNT_PANEL_TITLE_CLASS =
  'px-4 pb-0.5 pt-2.5 text-[11px] font-semibold lowercase tracking-wide text-[#8E8E93]';

export const LANDING_ACCOUNT_ROW_CLASS =
  'group mx-2 flex w-[calc(100%-1rem)] items-start gap-3 rounded-[18px] px-2.5 py-2.5 text-left transition hover:bg-[#F1EFEF] focus:outline-none focus-visible:bg-[#F1EFEF]';

export const LANDING_ACCOUNT_ROW_ICON_CLASS =
  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#1A1A1A] transition group-hover:bg-[#E9E6E6]';
