import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDesktopTabsSticky,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const APPOINTMENTS_PAGE_BG = 'max-lg:bg-transparent';

export const APPOINTMENTS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const appointmentsDesktopCard = profileDashboardCard;

export const appointmentsDesktopCardPad = profileDashboardCardPad;

export const appointmentsTabPanelShell = `${appointmentsDesktopCard} max-lg:!rounded-none max-lg:!bg-transparent max-lg:!shadow-none lg:h-fit lg:w-full lg:self-start`;

export const appointmentsShellCard = 'hidden w-full min-w-0 lg:block';

export const appointmentsDesktopTabsSticky = profileDesktopTabsSticky;

/** Фон шапок вкладок записей (`public/photos/fon.webp`). */
export const APPOINTMENTS_HERO_BG = '/photos/fon.webp';

export { NOTHING_FOUND_ILLUSTRATION_SRC as APPOINTMENTS_EMPTY_ILLUSTRATION_SRC } from '../../../shared/ui/nothingFoundIllustrationSrc';

/** Empty state вкладки «Заявки» (`public/photos/не найдены заявки/1-Photoroom.png`). */
export const APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC =
  `/photos/${encodeURIComponent('не найдены заявки')}/1-Photoroom.png`;

export const APPOINTMENTS_TAB_BAR_HEIGHT = '5.75rem';

export const APPOINTMENTS_TAB_BAR_SCROLL_PAD = `calc(${APPOINTMENTS_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

/** Панель сортировки и кнопки фильтра. */
export const apptListToolbar =
  'w-full rounded-[16px] bg-[#F5F5F5] p-4 max-lg:shadow-none lg:rounded-[20px] lg:p-5';

export const apptTrayLabel = 'text-[14px] font-bold text-[#111827]';

export const apptFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96]';

export const apptFilterBtnActive =
  'bg-[#F47C8C] text-white';

/** Split-карточка записи — белая панель без ring/border. */
export const apptCardShell =
  'flex w-full flex-col overflow-hidden rounded-[16px] bg-white lg:rounded-[18px]';

export const apptCardShellInteractive =
  `${apptCardShell} transition active:scale-[0.99] hover:bg-[#FAFAFA]`;

export const apptCardBody = 'flex min-w-0 flex-1';

export const apptTimeStrip =
  'flex w-[4.75rem] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch py-3 text-center sm:w-20';

export const apptTimeStripNew = 'bg-[#FFF1F4] text-[#F47C8C]';

export const apptTimeStripDefault = 'bg-[#EBEBEB] text-[#111827]';

export const apptTimeStripHighlight = 'bg-[#FFF1F4] text-[#F47C8C]';

export const apptTimeStripCompleted = 'bg-[#ECFDF5] text-[#16A34A]';

export const apptTimeStripCancelled = 'bg-[#FEF2F2] text-[#EF4444]';

export const apptListGap = 'flex flex-col gap-2.5 sm:gap-3';

export const apptCardActions =
  'flex gap-2 bg-white p-3.5 sm:p-4';

export const apptHighlightCard =
  `${apptCardShellInteractive} bg-[#FFF4F6] hover:bg-[#FFF0F3]`;

export const apptHistoryAttentionCard =
  `${apptCardShellInteractive} bg-[#FFF4F6] hover:bg-[#FFF0F3]`;

export const apptGroupLabel =
  'flex items-center gap-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#EBEBEB]';

export const apptMonthLabel =
  'mb-2 mt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] first:mt-0';

export const apptHistoryGroupCard =
  'overflow-hidden rounded-[16px] bg-white';

export const apptHistoryKpiTile =
  'min-w-0 rounded-[18px] bg-[#F5F5F5] p-5';

export const apptHistorySummaryTray =
  'rounded-[16px] bg-[#F5F5F5] px-4 py-4 lg:px-5 lg:py-5';

export const apptOutlineBtn = catalogSheetSecondaryBtn;

export const apptPinkBtn = catalogSheetPrimaryBtn;

export const apptBadgeNew =
  'rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C]';

export const apptBadgeConfirmed =
  'rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A]';

export const apptBadgeHighlight =
  'rounded-full bg-[#F47C8C] px-2.5 py-1 text-[11px] font-bold text-white';

export const apptBadgeCancelled =
  'rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-bold text-[#EF4444]';

export const apptBadgeCompleted =
  'rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A]';

export const apptPriceText = 'font-bold tabular-nums text-[#111827]';

export const apptMetaMuted = 'font-semibold text-[#6B7280]';

export const apptChevron =
  'h-5 w-5 shrink-0 text-[#D1D5DB] transition group-hover:text-[#9CA3AF]';

export const apptAvatarFallback =
  'flex shrink-0 items-center justify-center rounded-full bg-[#EBEBEB] font-bold text-[#111827]';

export const apptKpiIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]';

export const apptBillingBanner =
  'rounded-[16px] bg-[#F5F5F5] px-4 py-3.5';

export const apptEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EBEBEB] text-[#6B7280]';

export const apptListTray = apptListToolbar;

export const apptSkeletonBar = 'rounded-[8px] bg-[#EBEBEB]';

export const apptSkeletonShimmer =
  'animate-pulse bg-white';
