/** Палитра «Сводка»: mobile — белые карточки; desktop — как кабинет мастера (#f6f7fb + белые блоки). */
import { SERVICES_PAGE_BG } from '../services/adminServicesTheme';
import {
  PROFILE_DESKTOP_PAGE_BG,
  profileDashboardCard,
  profileDashboardCardPad,
  profileDesktopTabsSticky,
} from '../profile/adminProfileDashboardTheme';
import { MINI_PICTURE } from '../../../shared/ui/miniPictureSrc';
import { ADMIN_MOBILE_TAB_BAR_HEIGHT } from '../shared/adminMobileTabBarTheme';

export const OVERVIEW_CANVAS_HEX = '#F6F7FB';

export const overviewPageBg = SERVICES_PAGE_BG;

export const overviewDesktopCanvas = PROFILE_DESKTOP_PAGE_BG;

export const OVERVIEW_TAB_BAR_HEIGHT = ADMIN_MOBILE_TAB_BAR_HEIGHT;

export const ADMIN_CABINET_SHELL_MAX = 'w-full lg:max-w-none';

/** Desktop: контент на сером полотне, без обёртки-белой «коробки». */
export const overviewShellCard = 'hidden w-full min-w-0 lg:block';

/** Липкие табы сразу под AdminDesktopTopBar (см. --slotty-admin-desktop-topbar-h). */
export const overviewDesktopTabsSticky = profileDesktopTabsSticky;

/** Mobile: белая карточка на сером полотне. Desktop: лёгкая тень. */
export const overviewCard =
  'overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[28px] lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)] lg:ring-0';

/** Секции сводки: на мобилке с обводкой, на desktop — плоская белая панель. */
export const overviewDesktopCard = `${profileDashboardCard} ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:ring-0`;

/** Лоток под график (светло-серый, как Binance). */
export const overviewChartWell =
  'relative w-full min-w-0 overflow-hidden rounded-[12px] bg-[#F6F7FB] ring-1 ring-[#EEEEEE]/80 lg:rounded-[16px] lg:ring-0';

export const overviewDesktopCardPad = profileDashboardCardPad;

/** KPI-плитки: серый фон, лёгкая тень, без ring/border (как в кабинете). */
export const overviewDesktopKpiTile =
  'min-w-0 rounded-[22px] bg-[#f6f7fb] p-5 shadow-[0_4px_16px_rgba(17,24,39,0.04)]';

/** KPI в карусели сводки: на белой подложке hero-блока, без отдельной «коробки». */
export const overviewDesktopKpiCarouselCard =
  'min-w-0 rounded-[20px] bg-transparent p-4 shadow-none';

/** @deprecated используйте overviewDesktopKpiTile через OverviewKpiStatCard */
export const overviewMetricTile = overviewDesktopKpiTile;

export const overviewDesktopPanel = 'min-w-0';

export const overviewCardPad = 'p-[18px] lg:p-6';

export const overviewIconCircle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C] lg:h-10 lg:w-10 lg:rounded-[14px] lg:text-[#ff5f7a]';

export const overviewPinkBtn =
  'rounded-[18px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-white transition hover:brightness-[0.98] active:scale-[0.98] lg:rounded-[14px] lg:from-[#ff6f88] lg:to-[#ff5f7a] lg:hover:opacity-95';

export const overviewPinkOutline =
  'shrink-0 rounded-[18px] border border-[#FDE8ED] bg-white px-4 py-2.5 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.98] lg:rounded-[14px] lg:border-0 lg:bg-[#FFF1F4] lg:font-semibold lg:text-[#ff5f7a] lg:hover:bg-[#FFE4EA]';

export const overviewMutedSurface = 'rounded-[16px] bg-[#f6f7fb]';

/** Сегментный переключатель периода (мобильная сводка). */
export const overviewPeriodTrack =
  'grid grid-cols-4 gap-1 overflow-hidden rounded-[12px] bg-[#EBEBEB] p-1';

export function overviewPeriodSegmentClass(active: boolean): string {
  return `flex min-h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-[10px] px-1 text-[11px] font-semibold leading-none transition active:scale-[0.98] sm:min-h-11 sm:px-2 sm:text-[13px] ${
    active
      ? 'bg-[#F47C8C] text-white'
      : 'bg-transparent text-[#6B7280] hover:text-[#111827]'
  }`;
}

/** Кнопки-фильтры (меню источников и т.п.). */
export const overviewFilterChip =
  'inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-2.5 text-[13px] font-semibold transition active:scale-[0.96]';

export const overviewFilterChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#ff5f7a]';

export const overviewFilterChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:bg-[#FAFAFA] hover:text-[#374151] lg:bg-white';

export const overviewEmptyIllustrationSrc = MINI_PICTURE.searchEmpty;

const overviewSvodkaDir = '/photos/summary/';

export function overviewSvodkaPhotoSrc(fileName: string): string {
  return `${overviewSvodkaDir}${fileName}`;
}

/** Тот же фон, что у hero «Расписание → Окна» (`public/photos/fon.webp`). */
export const OVERVIEW_WELCOME_IMAGE_SRC = '/photos/fon.webp';

/** @deprecated use MINI_PICTURE.clientsEmpty */
export const OVERVIEW_CLIENTS_FOOTER_SRC = MINI_PICTURE.clientsEmpty;

const overviewHistoryPhotosDir = `/photos/history/`;

/** Фон KPI-блоков «Сегодня» (`public/photos/history/красно-синий.png`). */
export const OVERVIEW_OPS_KPI_BG = `${overviewHistoryPhotosDir}red-blue.webp`;

export const overviewOpsKpiTileOverlay =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/15 to-white/45';

export { MINI_PICTURE } from '../../../shared/ui/miniPictureSrc';
