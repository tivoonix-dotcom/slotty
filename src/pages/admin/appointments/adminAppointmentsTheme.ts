import {
  catalogSheetPrimaryBtn,
  catalogSheetSecondaryBtn,
} from '../shared/adminCatalogSheetTheme';
import { overviewDesktopKpiTile } from '../overview/adminOverviewTheme';
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

export const APPOINTMENTS_TAB_BAR_HEIGHT = '5.75rem';

export const APPOINTMENTS_TAB_BAR_SCROLL_PAD = `calc(${APPOINTMENTS_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

/** Панель сортировки и кнопки фильтра. */
export const apptListToolbar =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[20px] lg:p-5';

export const apptTrayLabel = 'text-[14px] font-bold text-[#111827]';

export const apptFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96]';

export const apptFilterBtnActive =
  'bg-[#F47C8C] text-white ring-1 ring-[#F9A8B4]';

/** Split-карточка записи (как окна в расписании). */
export const apptCardShell =
  'flex w-full flex-col overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] lg:rounded-[18px] lg:ring-[#EAECEF]';

export const apptCardShellInteractive =
  `${apptCardShell} transition active:scale-[0.99]`;

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
  'flex gap-2 border-t border-[#EEEEEE] bg-white p-3.5 sm:p-4';

export const apptHighlightCard =
  `${apptCardShellInteractive} ring-2 ring-[#F9A8B4]/60`;

export const apptGroupLabel =
  'flex items-center gap-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#EBEBEB]';

export const apptMonthLabel =
  'mb-2 mt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] first:mt-0';

export const apptHistoryGroupCard =
  'overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE]';

/** Desktop: панель таблицы истории (чистая «биржевая» сетка). */
export const apptHistoryDesktopPanel =
  'hidden overflow-hidden rounded-[20px] bg-white shadow-[0_2px_24px_rgba(17,24,39,0.05)] ring-1 ring-[#F0F0F0] lg:block';

export const apptHistoryKpiTile = overviewDesktopKpiTile;

/** Колонки: клиент · услуга · дата · сумма · статус */
export const apptHistoryTableGrid =
  'lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(0,0.65fr)_minmax(0,0.8fr)] lg:items-center lg:gap-x-8';

export const apptHistoryTableHead =
  `hidden ${apptHistoryTableGrid} border-b border-[#F0F0F0] px-8 py-4 text-[12px] font-medium text-[#9CA3AF] lg:grid`;

export const apptHistoryTableHeadCell = 'min-w-0';

export const apptHistoryTableHeadCellEnd = 'min-w-0 text-right';

export const apptHistoryMonthDivider =
  'border-t border-[#F0F0F0] px-8 pb-2 pt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] first:border-t-0 first:pt-5';

export const apptHistoryRow =
  `group hidden w-full border-b border-[#F0F0F0] bg-transparent text-left transition-colors last:border-b-0 hover:bg-[#FAFAFA] active:bg-[#F5F5F5] lg:grid ${apptHistoryTableGrid} lg:px-8 lg:py-[1.125rem]`;

export const apptHistoryCellMuted = 'min-w-0 truncate text-[14px] font-medium text-[#6B7280]';

export const apptHistoryCellDate = 'min-w-0 text-[14px] font-medium tabular-nums text-[#9CA3AF]';

export const apptHistoryCellPrice = 'min-w-0 text-right text-[15px] font-semibold tabular-nums text-[#111827]';

export const apptHistoryClientName =
  'truncate text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[#111827]';

export const apptPinkBtn = catalogSheetPrimaryBtn;

export const apptOutlineBtn = catalogSheetSecondaryBtn;

export const apptBadgeNew =
  'rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]';

export const apptBadgeConfirmed =
  'rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A] ring-1 ring-[#BBF7D0]/80';

export const apptBadgeHighlight =
  'rounded-full bg-[#F47C8C] px-2.5 py-1 text-[11px] font-bold text-white';

export const apptBadgeCancelled =
  'rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-bold text-[#EF4444] ring-1 ring-[#FECACA]';

export const apptBadgeCompleted =
  'rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A] ring-1 ring-[#BBF7D0]/80';

export const apptPriceText = 'font-bold tabular-nums text-[#111827]';

export const apptMetaMuted = 'font-semibold text-[#6B7280]';

export const apptChevron =
  'h-5 w-5 shrink-0 text-[#D1D5DB] transition group-hover:text-[#9CA3AF]';

export const apptAvatarFallback =
  'flex shrink-0 items-center justify-center rounded-full bg-[#EBEBEB] font-bold text-[#111827]';

export const apptKpiIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#EBEBEB] text-[#6B7280]';

export const apptBillingBanner =
  'rounded-[16px] bg-white px-4 py-3.5 ring-1 ring-[#EEEEEE]';

export const apptEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EBEBEB] text-[#6B7280]';

export const apptHistorySummaryTray =
  'rounded-[16px] bg-white px-4 py-4 ring-1 ring-[#EEEEEE] lg:px-5 lg:py-5';

export const apptListTray = apptListToolbar;
