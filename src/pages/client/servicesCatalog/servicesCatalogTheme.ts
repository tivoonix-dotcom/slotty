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

/** Активная вкладка — текст поверх фоновой иллюстрации */
export const catalogSectionTabActive = 'text-white font-semibold';

export const catalogSectionTabIdle =
  'bg-white text-[#374151] font-semibold transition hover:bg-[#FAFAFA] hover:text-[#111827]';

/** Подтабы каталога — мягкий розовый, без бордеров */
export const catalogViewTabActive = 'bg-[#FFF1F4] text-[#F47C8C] font-semibold';

export const catalogViewTabIdle = catalogDesktopChipIdle;

/** Шапка каталога поверх фото-фона */
export const catalogPhotoHeaderSearchClass =
  'rounded-full border-0 bg-white text-[#111827] outline-none transition placeholder:font-medium placeholder:text-[#9CA3AF] focus:bg-[#FFF1F4] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden';

export const catalogPhotoHeaderSearchIconClass =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F47C8C]';

export const catalogPhotoHeaderFilterBtnClass =
  'rounded-[10px] border-0 bg-white text-[#F47C8C] outline-none transition hover:bg-[#FFF1F4] active:scale-[0.98]';

export const catalogPhotoViewTabActive =
  'bg-white font-bold text-[#F47C8C] shadow-[0_2px_8px_rgba(17,24,39,0.08)]';

export const catalogPhotoViewTabIdle =
  'bg-white/25 font-semibold text-white transition hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60';

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
  'rounded-full border-0 bg-[#EBEBEB] text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden';

/** Десктоп-каталог: фиксированная область под bar-хедером, скролл только в колонках */
export const catalogDesktopShellClass =
  'fixed inset-x-0 bottom-0 z-30 flex flex-col top-[var(--slotty-header-height)]';

/** Десктоп-каталог услуг — обычный скролл; bar-хедер sticky в потоке, без дублирующего pt. */
export const catalogDesktopPageClass = 'hidden w-full min-w-0 lg:block';

/** Обёртка toolbar на десктопе (внутри fixed-shell, sticky не нужен) */
export const catalogDesktopToolbarStickyClass = 'shrink-0 bg-[#F5F5F5]';

/** Мобильный sticky: липнет только белая карточка внутри, без серой подложки. */
export const catalogStickyToolbarClass = 'sticky z-40';

/** @deprecated Используйте CatalogMobileServicesHeader — единый sticky-блок без зазора сверху. */
export const catalogMobilePageToolbarSticky =
  'sticky top-0 z-50 max-lg:block lg:static lg:z-auto';

/** Горизонтальные отступы мобильного каталога — единые для шапки, контента и sheet. */
export const catalogMobilePadX = 'px-3';

/** Розовая шапка каталога на мобилке */
export const catalogMobileHeaderBarClass =
  'w-full shrink-0 bg-[#F47C8C] pt-[env(safe-area-inset-top,0px)]';

/** Симметричная строка: колонки 2.25rem слева/справа — заголовок строго по центру */
export const catalogMobileHeaderRowGridClass =
  'grid min-h-11 grid-cols-[2.25rem_1fr_2.25rem] items-center pb-3 pt-1';

/** Круглая кнопка в розовой шапке */
export const catalogMobileHeaderIconBtnClass =
  'flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition active:scale-95 active:bg-white/30';

/** Заголовок по центру при кнопках слева/справа (flex-строка) */
export const catalogMobileHeaderTitleClass =
  'pointer-events-none absolute inset-x-0 truncate px-14 text-center text-[16px] font-bold text-white';

/** Сайдбар фильтров (lg): sticky под toolbar, скролл только внутри body */
export const catalogSidebarStickyClass = 'sticky z-40 self-start';

/** gap-4 между toolbar и сайдбаром в сетке */
export const catalogDesktopStickyGapRem = '1rem';

/** Отдельная карточка (mobile / isolated) */
export const catalogListCardClass =
  'overflow-hidden rounded-[16px] bg-white';

/** Карточка услуги — без hover-анимации */
export const catalogServiceCardClass =
  'overflow-hidden rounded-[16px] bg-white shadow-[0_1px_8px_rgba(17,24,39,0.05)] ring-1 ring-[#EEEEEE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C8C]/40';

/** Плитка каталога — Kwork-style: тонкая обводка, без тени */
export const catalogGridCardClass =
  'overflow-hidden rounded-[12px] bg-white ring-1 ring-[#E8E8E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C8C]/40';

/** Hero каталога — edge-to-edge на viewport */
export const catalogHeroShellClass =
  'relative overflow-hidden bg-[#F8F4F2] shadow-[0_4px_24px_rgba(17,24,39,0.06)]';

/** Блок записи в карточке услуги — без бордеров, только мягкий фон */
export const catalogBookingAsideClass =
  'flex shrink-0 flex-col justify-center bg-[#FFFBFC] p-4 lg:min-w-[200px] lg:px-5 lg:py-4';

export const catalogBookingAsideLabelClass =
  'text-[12px] font-medium leading-none text-[#8E8E93]';

export const catalogBookingAsideSlotClass =
  'rounded-[12px] bg-white/70 px-3.5 py-2.5';

export const catalogBookingAsideSlotActiveClass =
  'rounded-[12px] bg-white px-3.5 py-2.5 shadow-[0_2px_12px_rgba(244,124,140,0.1)]';

export const catalogWbFilterPillIdle =
  'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full bg-[#F0F0F0] px-3.5 py-2 text-[14px] font-medium text-[#111827] hover:bg-[#E8E8E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F47C8C]/30';

export const catalogWbFilterPillActive =
  'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3.5 py-2 text-[14px] font-semibold text-[#F47C8C] hover:bg-[#FFE8EE]';

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

/** CTA каталога */
export const catalogPrimaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F47C8C] px-5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(244,124,140,0.28)] hover:bg-[#F36B85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C8C]/50';

export const catalogSecondaryBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-5 text-[14px] font-semibold text-[#111827] hover:bg-[#E4E4E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]/20';
