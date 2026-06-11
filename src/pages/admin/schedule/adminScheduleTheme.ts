import { APPOINTMENTS_HERO_BG, apptHistoryKpiTileOverlay } from '../appointments/adminAppointmentsTheme';
import { SCHEDULE_QUICK_SETUP_IMAGES } from './scheduleQuickSetupAssets';
import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDesktopTabsSticky,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';
import {
  ADMIN_MOBILE_TAB_BAR_HEIGHT,
  adminMobileTabBarFabBottom,
  adminMobileTabBarListScrollPadClass,
} from '../shared/adminMobileTabBarTheme';

/** Акцент расписания — синий (только страница /admin/schedule). */
export const SCHEDULE_ACCENT = '#3B4CCA';
export const SCHEDULE_ACCENT_GRADIENT_FROM = '#4558D4';
export const SCHEDULE_ACCENT_SOFT = '#EEF0FC';
export const SCHEDULE_ACCENT_SOFT_HOVER = '#E0E4F8';
export const SCHEDULE_ACCENT_SURFACE = '#F4F5FD';
export const SCHEDULE_ACCENT_SURFACE_HOVER = '#F5F6FD';
export const SCHEDULE_ACCENT_RING = '#D8DCF5';
export const SCHEDULE_ACCENT_FOCUS = '#A8B0E8';
export const SCHEDULE_ACCENT_MUTED = '#B8BEE8';

export const scheduleAccentBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#3B4CCA] px-4 text-[14px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const scheduleAccentTextLink =
  'text-[13px] font-semibold text-[#3B4CCA] transition hover:opacity-80';

/** Кнопки шитов на странице расписания (вместо розового catalogSheet*). */
export const scheduleSheetPrimaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#3B4CCA] px-4 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const scheduleSheetSecondaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-4 text-[15px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const scheduleSheetGhostBtn =
  'rounded-[10px] bg-[#EEF0FC] px-3 py-2 text-[12px] font-semibold text-[#3B4CCA] transition hover:bg-[#E0E4F8] active:scale-[0.98] disabled:opacity-50';

export const scheduleTabFabClass =
  `fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4558D4] to-[#3B4CCA] text-white transition hover:scale-[1.04] active:scale-[0.96] max-lg:bottom-[${adminMobileTabBarFabBottom}] lg:bottom-8 lg:right-8 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100`;

export function scheduleSegmentClass(active: boolean): string {
  return `min-h-11 rounded-[10px] px-3 text-[14px] font-semibold leading-snug transition active:scale-[0.98] ${
    active ? 'bg-[#3B4CCA] text-white' : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}

export function scheduleChipClass(active: boolean): string {
  return `rounded-full px-4 py-2.5 text-[14px] font-semibold transition active:scale-[0.98] ${
    active ? 'bg-[#3B4CCA] text-white' : 'bg-[#F5F5F5] text-[#111827] ring-1 ring-[#EEEEEE]'
  }`;
}

export const scheduleSheetPrimaryBtnFull =
  `${scheduleSheetPrimaryBtn} w-full min-h-12 rounded-[18px] text-[15px] font-bold`;

export const scheduleSheetDangerBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[10px] border border-[#FECACA] bg-white px-4 text-[14px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] active:scale-[0.98] disabled:opacity-50';

export const scheduleSheetSummaryPanel = 'rounded-[10px] bg-[#EBEBEB] px-4 py-3.5';

export const SCHEDULE_HERO_BG = APPOINTMENTS_HERO_BG;

/** Иконка KPI-карусели расписания (синий акцент вместо розового overview). */
export const scheduleKpiIconCircle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#EEF0FC] text-[#3B4CCA] lg:h-10 lg:w-10 lg:rounded-[14px]';

/** Точки карусели KPI на странице расписания. */
export const scheduleKpiCarouselDot = 'bg-[#3B4CCA]';

/** Фон KPI-плиток на вкладке «Создать» (`public/photos/Быстрая настройка/задний фон.webp`). */
export const SCHEDULE_KPI_TILE_BG = SCHEDULE_QUICK_SETUP_IMAGES.tabCreateActiveBg;

/** Пустой день в календаре (`public/photos/история/окон нет.png`). */
export const SCHEDULE_NO_WINDOWS_DAY_ILLUSTRATION_SRC =
  `/photos/${encodeURIComponent('история')}/${encodeURIComponent('окон нет.png')}`;

export const scheduleKpiTileOverlay = apptHistoryKpiTileOverlay;

/** Высота нижней панели раздела «Расписание». */
export const SCHEDULE_TAB_BAR_HEIGHT = ADMIN_MOBILE_TAB_BAR_HEIGHT;

export const SCHEDULE_TAB_BAR_SCROLL_PAD = adminMobileTabBarListScrollPadClass;

export const SCHEDULE_PAGE_BG = 'bg-white';

/** Мобилка: серое полотно как в кабинете / услугах. */
export const SCHEDULE_MOBILE_CANVAS = 'bg-[#F5F5F5]';

/** Desktop: как услуги / сводка. */
export const SCHEDULE_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const scheduleDesktopCard = profileDashboardCard;

export const scheduleDesktopCardPad = profileDashboardCardPad;

export const scheduleShellCard = 'hidden w-full min-w-0 lg:block';

export const scheduleDesktopTabsSticky = profileDesktopTabsSticky;

/** @deprecated Используйте фото вкладок (`scheduleTabHeroBg`). */
export const SCHEDULE_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#3B4CCA]';

export const scheduleTabPanelShell =
  'relative w-full min-w-0 max-w-none max-lg:space-y-4 max-lg:bg-transparent lg:h-fit lg:w-full lg:max-w-none lg:self-stretch lg:rounded-[16px] lg:bg-white lg:ring-1 lg:ring-[#EEEEEE]';

/** Вкладка «Создать» — без рамки, плоский белый блок. */
export const scheduleTabPanelShellCreate =
  'relative w-full min-w-0 max-w-none max-lg:space-y-4 max-lg:bg-transparent lg:h-fit lg:w-full lg:max-w-none lg:self-stretch lg:rounded-[16px] lg:bg-white';

/** Вкладка «Календарь» — как «Создать», без обводки панели. */
export const scheduleTabPanelShellCalendar = scheduleTabPanelShellCreate;

/** Ячейка шаблона на desktop: растягивается на всю ширину лотка. */
export const scheduleTemplateCellWrap = 'w-full min-w-0 lg:min-w-[9.5rem] lg:flex-1';

export const scheduleTemplatesGridFull =
  'grid w-full max-w-none grid-cols-2 gap-2.5 sm:grid-cols-3 lg:flex lg:w-full lg:flex-wrap lg:gap-4';

export const scheduleTabContentPad = 'space-y-4 max-lg:p-0 lg:space-y-5 lg:p-6';

/** Отступ под FAB на вкладке «Создать» (над нижним таббаром). */
export const scheduleTabScrollBottomPad = 'pb-24 lg:pb-6';

/** Сетка шаблонов — без обводки, только отступы. */
export const scheduleTemplatesTray = 'w-full';

export function scheduleTemplateCardClass(selected: boolean): string {
  return `relative min-h-[5.75rem] overflow-hidden rounded-[16px] bg-[#F6F7FB] transition active:scale-[0.99] lg:min-h-[8rem] lg:rounded-[18px] ${
    selected ? 'z-[1] bg-[#EEF0FC] ring-2 ring-[#3B4CCA]/35' : 'hover:bg-[#F0F1F5]'
  }`;
}

export const scheduleTemplateAddBtn =
  'flex min-h-[5.75rem] w-full flex-col items-center justify-center gap-1.5 rounded-[16px] bg-[#EBEBEB] text-[13px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] lg:min-h-[8rem] lg:min-w-[9.5rem] lg:flex-1 lg:rounded-[18px] lg:bg-[#F6F7FB] lg:text-[#3B4CCA] hover:lg:bg-[#EEF0FC]';

/** Ошибки в шитах расписания. */
export const scheduleSheetErrorBox =
  'rounded-[12px] bg-[#FFF1F4] px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-[#EF4444] break-words [overflow-wrap:anywhere]';

/** Белая панель полей в каталожных шитах расписания. */
export const scheduleSheetFormPanel = 'overflow-hidden rounded-[16px] bg-white p-4';

export const scheduleSheetSummaryShell = 'overflow-hidden rounded-[10px] bg-[#EBEBEB]';

/** @deprecated Используйте scheduleSheetSummaryShell + шапку с фото. */
export const scheduleSheetSummaryBox = 'rounded-[10px] bg-[#EBEBEB] px-4 py-4';

export const scheduleSheetSummaryHeader =
  'relative overflow-hidden px-4 pb-4 pt-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-3 after:bg-gradient-to-b after:from-transparent after:to-[#EBEBEB]';

export const scheduleSheetSummaryBody = 'px-4 pb-4';

/** Мобилка: серый лоток; desktop — прежние панели. */
export const scheduleMobileTray =
  'w-full rounded-[16px] bg-[#EBEBEB] p-4 max-lg:shadow-none lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-5 lg:shadow-[0_4px_16px_rgba(17,24,39,0.04)]';

/** Панель поиска и фильтров на вкладке «Окна». */
export const scheduleListToolbar =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[20px] lg:bg-white lg:p-5 lg:ring-1 lg:ring-[#EEEEEE]';

export const scheduleSlotsFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96]';

export const scheduleSlotsFilterBtnActive =
  'bg-[#3B4CCA] text-white ring-1 ring-[#A8B0E8]';

export const scheduleSlotsStatChip =
  'inline-flex min-w-0 items-center gap-1.5 rounded-full bg-[#EBEBEB] px-3 py-1.5 text-[12px] font-semibold text-[#111827]';

export const scheduleSlotsDayHeader =
  'flex items-center justify-between gap-3 py-2.5 max-lg:sticky max-lg:top-[calc(var(--slotty-admin-header-h,5.25rem)+0.5rem)] max-lg:z-[1] max-lg:bg-[#F5F5F5] lg:mb-3 lg:rounded-[10px] lg:bg-[#F6F7FB] lg:px-3 lg:py-2';

export const scheduleListGroupCard =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:hidden lg:block lg:ring-[#EEEEEE]';

/** Карточка окна — split layout как в каталоге услуг. */
export const scheduleWindowCardShell =
  'flex w-full overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] transition active:scale-[0.99] lg:rounded-[18px] lg:ring-[#EAECEF]';

/** Карточка окна в календаре — без обводки, на серой плашке. */
export const scheduleWindowCardShellFlat =
  'flex w-full overflow-hidden rounded-[16px] bg-white transition active:scale-[0.99] hover:bg-[#F5F6FD] lg:rounded-[18px]';

export function scheduleWindowTimeStrip(status: 'free' | 'booked' | 'blocked'): string {
  if (status === 'booked') return 'bg-[#EEF0FC] text-[#3B4CCA]';
  if (status === 'blocked') return 'bg-[#F5F5F5] text-[#9CA3AF]';
  return 'bg-[#EBEBEB] text-[#111827]';
}

export function scheduleWindowStatusPill(status: 'free' | 'booked' | 'blocked'): string {
  if (status === 'booked') return 'bg-[#EEF0FC] text-[#3B4CCA]';
  if (status === 'blocked') return 'bg-[#F5F5F5] text-[#6B7280]';
  return 'bg-[#EBEBEB] text-[#111827]';
}

/** Цвета статусов в календаре — контрастные, легко различимые. */
export const SCHEDULE_CAL_BOOKED = '#3B4CCA';
export const SCHEDULE_CAL_FREE = '#16A34A';
export const SCHEDULE_CAL_BLOCKED = '#9CA3AF';

export const scheduleCalendarCard =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[20px] lg:bg-[#F6F7FB] lg:p-6 lg:ring-0';

/** Панель выбранного дня (календарь). */
export const scheduleCalendarDayPanel = `${scheduleCalendarCard} max-lg:px-4 max-lg:pb-4 max-lg:pt-5`;

/** Кнопки навигации месяца / экспорт в календаре. */
export const scheduleCalendarIconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition hover:bg-[#E4E4E4] hover:text-[#3B4CCA] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60';

/** Горизонтальная лента дней — py даёт место рамкам чипов внутри overflow-x. */
export const scheduleBusyDaysStrip =
  'flex w-full min-w-0 gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain scroll-px-4 py-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** Белая панель полей без overflow-hidden — для блоков со горизонтальным скроллом. */
export const scheduleSheetFormPanelScrollable = 'min-w-0 overflow-visible rounded-[16px] bg-white p-4';

export function scheduleBusyDayChipClass(selected: boolean): string {
  return `flex min-w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-[12px] px-2.5 py-2.5 transition active:scale-[0.98] ${
    selected ? 'bg-[#3B4CCA] text-white' : 'bg-[#EBEBEB] text-[#111827] hover:bg-white'
  }`;
}

/** @deprecated Используйте scheduleMobileTray */
export const scheduleCalendarTray = scheduleMobileTray;

const scheduleTabPhotosDir = '/photos/' + encodeURIComponent('Расписание') + '/';

/** Фото для шапок табов (`public/photos/Расписание`). */
export function scheduleTabPhotoSrc(fileName: string): string {
  return scheduleTabPhotosDir + encodeURIComponent(fileName);
}

/** Фон hero по вкладке (`public/photos/Расписание`). */
export function scheduleTabHeroBg(fileName: '111.webp' | '222.webp' | '333.webp'): string {
  return scheduleTabPhotoSrc(fileName);
}
