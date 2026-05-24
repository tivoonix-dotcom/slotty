/** Высота нижней навигации + отступ (для padding-bottom контента). */
export const CLIENT_BOTTOM_NAV_HEIGHT = '5.75rem';

export const CLIENT_CONTENT_PAD_BOTTOM =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px)+1rem)]';

export const CLIENT_HEADER_OFFSET =
  'pt-[calc(6.5rem+env(safe-area-inset-top,0px))]';

/** Высота SlottyHeader `variant="bar"` (lg), см. `lg:h-[4.25rem]` в HeaderShell. */
export const CLIENT_DESKTOP_BAR_REM = '4.25rem';

export const CLIENT_DESKTOP_BAR_PX = parseFloat(CLIENT_DESKTOP_BAR_REM) * 16;

/** Sticky-блоки каталога — сразу под bar-хедером; учитывает открытое mega-menu. */
export const CLIENT_STICKY_BELOW_HEADER = 'top-[var(--slotty-header-height)]';

/** Sticky toolbar каталога под ClientHeader (мобильный layout). */
export const CLIENT_STICKY_BELOW_MOBILE_HEADER =
  'top-[calc(6.5rem+env(safe-area-inset-top,0px))]';

/** Нижний отступ контента на странице мастера (без таб-бара, только sticky-кнопки). */
export const CLIENT_MASTER_PROFILE_PAD_BOTTOM =
  'pb-[calc(7.5rem+env(safe-area-inset-bottom,0px)+0.5rem)]';
