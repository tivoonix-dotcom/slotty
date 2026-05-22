/** Общие классы кабинета мастера: мобильная колонка + десктопный дашборд. */
export const ADMIN_SIDEBAR_WIDTH = 'w-[260px]';

/** Ширина sidebar в px (для порталов модалок на desktop). */
export const ADMIN_SIDEBAR_PX = 260;

/** Сдвиг fixed-overlay под sidebar (Tailwind, не интерполировать). */
export const ADMIN_SIDEBAR_OVERLAY_INSET = 'lg:left-[260px]';

export const ADMIN_CABINET_SHELL_MAX = 'w-full max-w-[460px] lg:max-w-none';

export const ADMIN_CABINET_MAIN =
  'mx-auto w-full min-w-0 flex-1 lg:mx-0 lg:flex lg:flex-col lg:px-8 lg:py-6';

export const ADMIN_DESKTOP_CANVAS = 'lg:bg-[#f6f7fb]';

export const ADMIN_DESKTOP_PAGE =
  'lg:rounded-[24px] lg:bg-white lg:shadow-[0_4px_24px_rgba(17,24,39,0.06)] lg:ring-1 lg:ring-[#EAECEF]';

export const adminDesktopNavItemClass = (active: boolean): string =>
  `flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3.5 text-left text-[14px] font-semibold transition active:scale-[0.99] ${
    active
      ? 'bg-[#FFF1F4] text-[#ff5f7a] shadow-[0_2px_12px_rgba(255,95,122,0.08)]'
      : 'text-[#6B7280] hover:bg-[#F7F7F8] hover:text-[#111827]'
  }`;

export const ADMIN_SEGMENT_NAV_DESKTOP =
  'flex flex-wrap gap-1 rounded-[20px] bg-white p-1.5 ring-1 ring-[#EAECEF] shadow-[0_2px_12px_rgba(17,24,39,0.04)]';

export const ADMIN_SEGMENT_NAV_MOBILE =
  'pointer-events-auto flex h-[72px] w-full max-w-[460px] items-stretch gap-1 rounded-[26px] border border-white/90 bg-white/95 px-1.5 py-1.5 shadow-[0_16px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl';
