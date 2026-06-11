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
import {
  ADMIN_MOBILE_TAB_BAR_HEIGHT,
  adminMobileTabBarListScrollPadClass,
} from '../shared/adminMobileTabBarTheme';

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

/** Empty state вкладки «Заявки» (`public/photos/не найдены заявки/1-Photoroom.webp`). */
export const APPOINTMENTS_REQUESTS_EMPTY_ILLUSTRATION_SRC =
  `/photos/${encodeURIComponent('не найдены заявки')}/1-Photoroom.webp`;

const appointmentsHistoryPhotosDir = `/photos/${encodeURIComponent('история')}/`;

/** Фоны KPI вкладки «История» (`public/photos/история`). */
export const APPOINTMENTS_HISTORY_KPI_BG = {
  completed: `${appointmentsHistoryPhotosDir}1.png`,
  earned: `${appointmentsHistoryPhotosDir}2.png`,
  cancelled: `${appointmentsHistoryPhotosDir}3.png`,
} as const;

/** Фоны KPI вкладки «Предстоящие» (`public/photos/история`). */
export const APPOINTMENTS_UPCOMING_KPI_BG = {
  total: `${appointmentsHistoryPhotosDir}1.png`,
  today: `${appointmentsHistoryPhotosDir}2.png`,
  attention: `${appointmentsHistoryPhotosDir}3.png`,
} as const;

/** Фоны KPI вкладки «Заявки» (`public/photos/история`). */
export const APPOINTMENTS_REQUESTS_KPI_BG = {
  total: `${appointmentsHistoryPhotosDir}1.png`,
  today: `${appointmentsHistoryPhotosDir}2.png`,
  expiring: `${appointmentsHistoryPhotosDir}3.png`,
} as const;

/** Фоны hero-блока модалки записи (`public/photos/история`). */
export const APPOINTMENTS_DETAIL_HERO_BG = {
  pending: `${appointmentsHistoryPhotosDir}1.png`,
  upcoming: `${appointmentsHistoryPhotosDir}2.png`,
  active: `${appointmentsHistoryPhotosDir}2.png`,
  attention: `${appointmentsHistoryPhotosDir}3.png`,
  completed: `${appointmentsHistoryPhotosDir}${encodeURIComponent('зеленый.png')}`,
  cancelled: `${appointmentsHistoryPhotosDir}${encodeURIComponent('красный.png')}`,
  neutral: `${appointmentsHistoryPhotosDir}1.png`,
} as const;

export const APPOINTMENTS_TAB_BAR_HEIGHT = ADMIN_MOBILE_TAB_BAR_HEIGHT;

export const APPOINTMENTS_TAB_BAR_SCROLL_PAD = adminMobileTabBarListScrollPadClass;

/** Панель сортировки и кнопки фильтра. */
export const apptListToolbar =
  'w-full rounded-[16px] bg-[#F5F5F5] p-4 max-lg:shadow-none lg:rounded-[20px] lg:p-5';

export const apptTrayLabel = 'text-[14px] font-bold text-[#111827]';

export const apptFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96]';

export const apptFilterBtnActive =
  'bg-[#F47C8C] text-white';

/** Секции в шите фильтров записей — как в каталоге услуг. */
export const apptFilterSection = 'rounded-[16px] bg-white p-4 sm:p-5';

export function apptFilterSegmentClass(active: boolean): string {
  return `relative z-[1] min-h-10 shrink-0 rounded-[10px] px-3.5 text-[13px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 sm:text-[14px] ${
    active
      ? 'bg-[#F47C8C] text-white shadow-sm'
      : 'bg-white text-[#374151] ring-1 ring-[#EAECEF]'
  }`;
}

/** Переключатель список / календарь — плоские кнопки без бордеров, как кнопка фильтра. */
export function apptViewToggleBtnClass(active: boolean): string {
  return `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/35 sm:text-[14px] ${
    active ? 'bg-[#F47C8C] text-white' : 'bg-[#EBEBEB] text-[#374151]'
  }`;
}

export const apptCalendarIconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#EBEBEB] text-[#374151] transition hover:bg-[#E4E4E4] active:scale-[0.96]';

export function apptCalendarDayChipClass(selected: boolean): string {
  return `flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-[10px] px-2.5 py-2 transition active:scale-[0.97] ${
    selected
      ? 'bg-[#F47C8C] text-white'
      : 'bg-[#F5F5F5] text-[#374151] ring-1 ring-[#EEEEEE]'
  }`;
}

export const apptFilterChip =
  'rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.98]';

export function apptFilterChipClass(active: boolean): string {
  return active
    ? 'bg-[#F47C8C] text-white'
    : 'bg-[#F5F5F5] text-[#374151] ring-1 ring-[#EEEEEE]';
}

export const apptClientContactMenuBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition hover:bg-[#E4E4E4] hover:text-[#111827] active:scale-[0.96]';

export const apptClientContactMenuBtnOpen = 'bg-[#E4E4E4] text-[#111827]';

export const apptClientContactMenuPanel =
  'absolute right-0 top-full z-50 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-[12px] bg-[#EBEBEB] p-1 shadow-[0_8px_24px_rgba(17,24,39,0.12)]';

export const apptClientContactMenuItem =
  'block rounded-[8px] px-3 py-2.5 text-[14px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.99]';

export const apptDetailPanel =
  'rounded-[12px] bg-[#F5F5F5] px-4 py-4 lg:px-5 lg:py-4';

export const apptDetailPanelLabel =
  'text-[13px] font-semibold text-[#6B7280]';

export const apptDetailInsetList = 'overflow-hidden rounded-[10px] bg-[#EBEBEB]';

export const apptDetailInsetListItem =
  'border-b border-[#E0E0E0] px-3.5 py-3 last:border-b-0';

/** Premium UI модалки деталей записи. */
export const apptDetailHeroCard =
  'relative overflow-hidden rounded-[22px] bg-white';

export const apptDetailSurfaceCard =
  'overflow-hidden rounded-[20px] bg-white';

/** Карточка с выпадающим меню — без обрезки по overflow. */
export const apptDetailSurfaceCardMenuHost =
  'relative overflow-visible rounded-[20px] bg-white';

/** Заголовки секций в модалке деталей записи — без CAPS и разреженного tracking. */
export const apptDetailSectionLabel =
  'text-[14px] font-bold tracking-[-0.02em] text-[#111827]';

export const apptDetailCloseBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[22px] font-light leading-none text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#F47C8C] active:scale-[0.96] lg:h-11 lg:w-11';

export const apptDetailActionPrimary =
  'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-[#FFF1F4] px-3 text-[13px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const apptDetailActionSecondary =
  'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-[#F5F5F5] px-3 text-[13px] font-semibold text-[#374151] transition hover:bg-[#EEEEEE] active:scale-[0.98]';

export const apptDetailNextStepsCard =
  'rounded-[20px] bg-gradient-to-br from-[#FFF4F6] to-white px-4 py-4';

export const apptDetailNextStepsToggle =
  'inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F5] px-3.5 py-2 text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#F47C8C] active:scale-[0.98]';

export const apptDetailReportToggle =
  'inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F5] px-3.5 py-2 text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#FEE2E2] hover:text-[#BE123C] active:scale-[0.98]';

export const apptDetailNextStepsMessage =
  'mt-3 rounded-[18px] rounded-tl-[6px] bg-[#F5F5F5] px-4 py-3.5';

/** Подсказка по сроку заявки — в стиле сообщений кабинета. */
export const apptPendingDeadlineHint =
  'rounded-[12px] bg-[#F5F5F5] px-3 py-2.5';

export const apptPendingDeadlineHintUrgent =
  'rounded-[12px] bg-[#FFF1F4] px-3 py-2.5';

export const apptPendingDeadlineHintCritical =
  'rounded-[12px] bg-[#FEF2F2] px-3 py-2.5';

export const apptDetailNoteCard =
  'rounded-[20px] bg-white px-4 py-4';

/** @deprecated используйте apptDetailSectionLabel */
export const apptDetailNoteHeading = apptDetailSectionLabel;

export const apptDetailReportBtn =
  'mt-4 flex min-h-11 w-full items-center justify-center rounded-[12px] bg-white/90 px-4 text-[14px] font-semibold text-[#BE123C] transition hover:bg-white active:scale-[0.98] disabled:cursor-default disabled:opacity-55';

/** Split-карточка записи — белая панель без ring/border. */
export const apptCardShell =
  'flex w-full flex-col overflow-hidden rounded-[16px] bg-white lg:rounded-[18px]';

export const apptCalendarPanel = `${apptCardShell} p-4 sm:p-5`;

export const apptCardShellInteractive =
  `${apptCardShell} transition active:scale-[0.99] hover:bg-[#FAFAFA]`;

export const apptCardBody = 'flex min-w-0 flex-1';

export const apptTimeStrip =
  'flex w-[4rem] shrink-0 flex-col items-center justify-center gap-0.5 self-stretch py-2.5 text-center sm:w-[5.25rem] sm:gap-1 sm:py-3';

export const apptTimeStripTime =
  'text-[15px] font-black tabular-nums leading-none sm:text-[18px]';

export const apptTimeStripDate =
  'max-w-full px-0.5 text-[10px] font-semibold leading-tight opacity-90 sm:px-1 sm:text-[11px]';

export const apptTimeStripNew = 'bg-[#FFF1F4] text-[#F47C8C]';

export const apptTimeStripDefault = 'bg-[#EBEBEB] text-[#111827]';

export const apptTimeStripHighlight = 'bg-[#FFF1F4] text-[#F47C8C]';

export const apptTimeStripCompleted = 'bg-[#ECFDF5] text-[#16A34A]';

export const apptTimeStripCancelled = 'bg-[#FEF2F2] text-[#EF4444]';

export const apptListGap = 'flex flex-col gap-2.5 sm:gap-3';

export const apptCardActions =
  'flex gap-2 bg-white p-3.5 sm:p-4';

export const apptCardActionsCompact =
  'flex gap-1.5 bg-white px-2.5 pb-2.5 pt-0 sm:px-3 sm:pb-3';

export const apptCompactOutlineBtn =
  'inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#EBEBEB] px-2.5 text-[13px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const apptCompactPinkBtn =
  'inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#F47C8C] px-2.5 text-[13px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const apptHighlightCard =
  `${apptCardShellInteractive} bg-[#FFF4F6] hover:bg-[#FFF0F3]`;

export const apptHistoryAttentionCard =
  `${apptCardShellInteractive} bg-[#FFF4F6] hover:bg-[#FFF0F3]`;

export const apptGroupLabel =
  'flex items-center gap-2 px-0.5 text-[13px] font-semibold text-[#6B7280] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#EBEBEB]';

export const apptMonthLabel =
  'mb-2 mt-5 text-[13px] font-semibold text-[#6B7280] first:mt-0 sm:mt-6';

export const apptHistoryGroupCard =
  'overflow-hidden rounded-[16px] bg-white';

export const apptHistoryKpiTile =
  'relative min-w-0 overflow-hidden rounded-[18px] p-5';

/** Лёгкий градиент: фото видно, цифры внизу остаются читаемыми. */
export const apptHistoryKpiTileOverlay =
  'pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/15 to-white/45';

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

export const apptCardMetricPrice =
  'text-[18px] font-black tabular-nums leading-none tracking-[-0.03em] text-[#111827]';

export const apptCardMetricDuration =
  'text-[14px] font-bold tabular-nums leading-none text-[#374151]';

export const apptCardDetailLink =
  'inline-flex shrink-0 items-center gap-0.5 pb-0.5 text-[13px] font-semibold text-[#9CA3AF] transition hover:text-[#6B7280] active:scale-[0.98]';

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
