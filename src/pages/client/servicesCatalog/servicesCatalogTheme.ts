/** OKX-style: серое полотно, белые блоки без теней и бордеров */

export const catalogCanvasClass = 'bg-[#F5F5F5]';

/** Белая панель — плоская, скругление 16px, без shadow */
export const catalogDesktopPanel = 'rounded-[16px] bg-white';

export const catalogDesktopSectionLabel =
  'text-[13px] font-medium text-[#8E8E93]';

export const catalogDesktopChipActive =
  'bg-[#EBEBEB] text-[#111827] font-semibold';

export const catalogDesktopChipIdle =
  'bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB] hover:text-[#111827]';

/** Главные табы Услуги | Мастера — розовая pill */
export const catalogSectionTabActive =
  'bg-[#F47C8C] text-white font-semibold shadow-[0_4px_14px_rgba(244,124,140,0.28)]';

export const catalogSectionTabIdle =
  'bg-[#F5F5F5] text-[#374151] font-semibold transition hover:bg-[#EBEBEB] hover:text-[#111827]';

/** Подтабы каталога — мягкий розовый */
export const catalogViewTabActive =
  'bg-[#FFF1F4] text-[#F47C8C] font-semibold ring-1 ring-[#F47C8C]/15';

export const catalogViewTabIdle = catalogDesktopChipIdle;

/** Активные фильтры в сайдбаре */
export const catalogFilterChipActive =
  'bg-[#FFF1F4] text-[#F47C8C] font-semibold ring-1 ring-[#F47C8C]/20';

export const catalogFilterChipIdle = catalogDesktopChipIdle;

export const catalogSortSelectClass =
  'h-10 min-w-[200px] cursor-pointer appearance-none rounded-[10px] border-0 bg-[#F5F5F5] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-9 text-[13px] font-semibold text-[#111827] outline-none transition hover:bg-[#EBEBEB] focus:bg-[#EBEBEB]';

export const catalogFilterSectionIconClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#111827]';

export const catalogFilterSectionTitleClass =
  'text-[15px] font-bold tracking-[-0.02em] text-[#111827]';

export const catalogFieldClass =
  'rounded-[10px] border-0 bg-[#EBEBEB] text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4]';

/** Поле поиска в шапке каталога — шире, скругление «капсула» */
export const catalogSearchFieldClass =
  'rounded-full border-0 bg-[#EBEBEB] text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4]';

/** Десктоп-каталог: фиксированная область под bar-хедером, скролл только в колонках */
export const catalogDesktopShellClass =
  'fixed inset-x-0 bottom-0 z-30 flex flex-col top-[var(--slotty-header-height)]';

/** Обёртка toolbar на десктопе (внутри fixed-shell, sticky не нужен) */
export const catalogDesktopToolbarStickyClass = 'shrink-0 bg-[#F5F5F5]';

/** Мобильный toolbar — свой sticky внутри компонента */
export const catalogStickyToolbarClass =
  'sticky z-40 bg-[#F5F5F5]/95 backdrop-blur-sm';

/** Сайдбар фильтров (lg): sticky под toolbar, скролл только внутри body */
export const catalogSidebarStickyClass = 'sticky z-40 self-start';

/** gap-4 между toolbar и сайдбаром в сетке */
export const catalogDesktopStickyGapRem = '1rem';

/** Отдельная карточка (mobile / isolated) */
export const catalogListCardClass =
  'overflow-hidden rounded-[16px] bg-white transition hover:bg-[#FAFAFA]';

export const catalogMetaChipClass =
  'rounded-[8px] bg-[#F0F0F0] px-2.5 py-1 text-[13px] font-medium text-[#374151]';

export const catalogResetBtnClass =
  'w-full rounded-[10px] bg-[#F0F0F0] py-3 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB]';

/** Разделитель внутри панели */
export const catalogInnerDivider = 'border-t border-[#EEEEEE]';

export const catalogSidebarWidth =
  'lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]';

export const catalogListGap = 'flex flex-col';

export const catalogPanelListClass = 'divide-y divide-[#EEEEEE]';

export const catalogPanelRowClass =
  'block w-full transition hover:bg-[#FAFAFA] active:bg-[#F5F5F5]';

export const catalogPanelRowPad = 'px-6 py-5';

/** CTA каталога — плоские, без теней */
export const catalogPrimaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]';

export const catalogSecondaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98]';
