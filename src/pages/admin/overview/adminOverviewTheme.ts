/** Палитра «Сводка»: mobile — белые карточки; desktop — как кабинет мастера (#f6f7fb + белые блоки). */
import { SERVICES_PAGE_BG } from '../services/adminServicesTheme';
import {
  PROFILE_DESKTOP_PAGE_BG,
  profileDashboardCard,
  profileDashboardCardPad,
} from '../profile/adminProfileDashboardTheme';

export const OVERVIEW_CANVAS_HEX = '#F6F7FB';

export const overviewPageBg = SERVICES_PAGE_BG;

export const overviewDesktopCanvas = PROFILE_DESKTOP_PAGE_BG;

export const OVERVIEW_TAB_BAR_HEIGHT = '5.75rem';

export const ADMIN_CABINET_SHELL_MAX = 'w-full max-w-[460px] lg:max-w-none';

/** Desktop: контент на сером полотне, без обёртки-белой «коробки». */
export const overviewShellCard = 'hidden w-full min-w-0 lg:block';

/** Липкие табы сразу под AdminDesktopTopBar (см. --slotty-admin-desktop-topbar-h). */
export const overviewDesktopTabsSticky =
  'sticky z-20 overflow-hidden bg-white top-[var(--slotty-admin-desktop-topbar-h,4.75rem)]';

/** Mobile: белая карточка с тенью. Desktop: как profileDashboardCard. */
export const overviewCard =
  'rounded-[24px] border border-white/80 bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)] lg:rounded-[28px] lg:border-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]';

export const overviewDesktopCard = profileDashboardCard;

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
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C] shadow-[0_8px_20px_rgba(244,124,140,0.10)] lg:h-10 lg:w-10 lg:rounded-[14px] lg:text-[#ff5f7a] lg:shadow-none';

export const overviewPinkBtn =
  'rounded-[18px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-white shadow-[0_10px_26px_rgba(244,124,140,0.30)] transition hover:brightness-[0.98] active:scale-[0.98] lg:rounded-[14px] lg:from-[#ff6f88] lg:to-[#ff5f7a] lg:shadow-[0_8px_24px_rgba(255,95,122,0.28)] lg:hover:opacity-95';

export const overviewPinkOutline =
  'shrink-0 rounded-[18px] border border-[#FDE8ED] bg-white px-4 py-2.5 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.98] lg:rounded-[14px] lg:border-0 lg:bg-[#FFF1F4] lg:font-semibold lg:text-[#ff5f7a] lg:hover:bg-[#FFE4EA]';

export const overviewMutedSurface = 'rounded-[16px] bg-[#f6f7fb]';

/** Кнопки-фильтры периода (Сегодня / Неделя / …). */
export const overviewFilterChip =
  'inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-2.5 text-[13px] font-semibold transition active:scale-[0.96]';

export const overviewFilterChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#ff5f7a] shadow-[inset_0_0_0_1px_rgba(255,95,122,0.12)]';

export const overviewFilterChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:bg-[#FAFAFA] hover:text-[#374151] lg:bg-white';

export const overviewEmptyIllustrationSrc =
  '/photos/' + encodeURIComponent('ничего не нашли.webp');

const overviewSvodkaDir = '/photos/' + encodeURIComponent('сводка') + '/';

export function overviewSvodkaPhotoSrc(fileName: string): string {
  return overviewSvodkaDir + encodeURIComponent(fileName);
}

export const OVERVIEW_WELCOME_IMAGE_SRC = overviewSvodkaPhotoSrc('обзор.webp');

export const OVERVIEW_CLIENTS_FOOTER_SRC = '/photos/KLIENT.webp';
