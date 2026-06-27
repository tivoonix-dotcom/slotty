/** Визуальные токены шапки лендинга (редизайн 2026, Figma Rectangle 11). */

/** Ширина/высота капсулы: W 894 · H 74 · radius 25 · fill #FBEDEC */
export const LANDING_HEADER_MAX_WIDTH_CLASS = 'mx-auto w-full max-w-[894px]';

/** Колонка текста лендинга и legal — совпадает с pill-хедером. */
export const LANDING_PAGE_COLUMN_CLASS = LANDING_HEADER_MAX_WIDTH_CLASS;

/** Pill-хедер в каталоге — на всю ширину shell (max-w 1320px). */
export const CATALOG_LANDING_HEADER_WIDTH_CLASS = 'w-full';

export const LANDING_HEADER_SLOT_H = 'h-10';

export const LANDING_HEADER_PILL_CLASS =
  'overflow-visible rounded-[25px] bg-[#FBEDEC] transition-all duration-300';

/** Каталог desktop: шапка вплотную к верху экрана — без скругления сверху. */
export const CATALOG_LANDING_HEADER_PILL_CLASS =
  'overflow-visible rounded-none bg-[#FBEDEC] transition-all duration-300';

export const LANDING_HEADER_ROW_CLASS =
  'relative grid min-h-[74px] grid-cols-[1fr_auto] items-center gap-4 py-2 pl-3 pr-6 sm:pl-4 sm:pr-8 lg:grid-cols-[1fr_auto_1fr] lg:pl-5 lg:pr-10';

export const LANDING_HEADER_LOGO_LINK_CLASS =
  'inline-flex w-auto shrink-0 items-center justify-start !h-auto min-h-0 -ml-1 p-0 leading-none opacity-100 hover:opacity-100 max-lg:translate-y-[5px] sm:-ml-1.5 lg:translate-y-0';

export const LANDING_HEADER_LOGO_IMG_CLASS =
  'block h-12 w-auto max-w-none shrink-0 object-contain object-left opacity-100 sm:h-14';

export const LANDING_HEADER_LOGO_CELL_CLASS = 'col-start-1 row-start-1 justify-self-start';

export const LANDING_HEADER_NAV_CELL_CLASS =
  'col-start-2 row-start-1 hidden justify-self-center lg:flex';

export const LANDING_HEADER_ACTIONS_CELL_CLASS =
  'col-start-2 row-start-1 flex shrink-0 flex-nowrap items-center justify-self-end gap-2 lg:col-start-3 lg:gap-3';

export const LANDING_NAV_LINK_CLASS =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap px-0 text-[15px] font-semibold leading-none lowercase tracking-[-0.01em] text-[#1A1A1A] transition hover:text-[#C97B7B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E29595]/35';

export const LANDING_ICON_BTN_CLASS =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EFEF] text-[#1A1A1A] transition hover:bg-[#E9E6E6] active:scale-[0.97]';

/** Панель аккаунта — белая двухколоночная (OKX-style). */
export const LANDING_ACCOUNT_PANEL_CLASS =
  'overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]';
