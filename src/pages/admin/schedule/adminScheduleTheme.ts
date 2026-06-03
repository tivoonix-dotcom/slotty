import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDesktopTabsSticky,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

/** Высота нижней панели раздела «Расписание». */
export const SCHEDULE_TAB_BAR_HEIGHT = '5.75rem';

export const SCHEDULE_TAB_BAR_SCROLL_PAD = `calc(${SCHEDULE_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

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
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

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
    selected ? 'z-[1] bg-[#FFF1F4] ring-2 ring-[#ff5f7a]/35' : 'hover:bg-[#F0F1F5]'
  }`;
}

export const scheduleTemplateAddBtn =
  'flex min-h-[5.75rem] w-full flex-col items-center justify-center gap-1.5 rounded-[16px] bg-[#EBEBEB] text-[13px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] lg:min-h-[8rem] lg:min-w-[9.5rem] lg:flex-1 lg:rounded-[18px] lg:bg-[#F6F7FB] lg:text-[#ff5f7a] hover:lg:bg-[#FFF1F4]';

/** Ошибки в шитах расписания. */
export const scheduleSheetErrorBox =
  'rounded-[10px] bg-[#FFF4E8] px-4 py-3 text-[13px] font-medium leading-snug text-[#B45309] break-words [overflow-wrap:anywhere]';

export const scheduleSheetSummaryBox = 'rounded-[10px] bg-[#EBEBEB] px-4 py-4';

/** Мобилка: серый лоток; desktop — прежние панели. */
export const scheduleMobileTray =
  'w-full rounded-[16px] bg-[#EBEBEB] p-4 max-lg:shadow-none lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-5 lg:shadow-[0_4px_16px_rgba(17,24,39,0.04)]';

/** Панель поиска и фильтров на вкладке «Окна». */
export const scheduleListToolbar =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[20px] lg:bg-white lg:p-5 lg:ring-1 lg:ring-[#EEEEEE]';

export const scheduleSlotsFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96]';

export const scheduleSlotsFilterBtnActive =
  'bg-[#F47C8C] text-white ring-1 ring-[#F9A8B4]';

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
  'flex w-full overflow-hidden rounded-[16px] bg-white transition active:scale-[0.99] hover:bg-[#FFF9FB] lg:rounded-[18px]';

export function scheduleWindowTimeStrip(status: 'free' | 'booked' | 'blocked'): string {
  if (status === 'booked') return 'bg-[#FFF1F4] text-[#F47C8C]';
  if (status === 'blocked') return 'bg-[#F5F5F5] text-[#9CA3AF]';
  return 'bg-[#EBEBEB] text-[#111827]';
}

export function scheduleWindowStatusPill(status: 'free' | 'booked' | 'blocked'): string {
  if (status === 'booked') return 'bg-[#FFF1F4] text-[#F47C8C]';
  if (status === 'blocked') return 'bg-[#F5F5F5] text-[#6B7280]';
  return 'bg-[#EBEBEB] text-[#111827]';
}

export const scheduleCalendarCard =
  'w-full rounded-[16px] bg-white p-4 ring-1 ring-[#EEEEEE] max-lg:shadow-none lg:rounded-[18px] lg:bg-[#F6F7FB] lg:p-5 lg:ring-0';

/** Панель выбранного дня (календарь). */
export const scheduleCalendarDayPanel = `${scheduleCalendarCard} max-lg:px-4 max-lg:pb-4 max-lg:pt-5`;

/** Кнопки навигации месяца / экспорт в календаре. */
export const scheduleCalendarIconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#FFF1F4] hover:text-[#ff5f7a] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60';

/** Горизонтальная лента «Дни с окнами» на мобиле (без роста вниз). */
export const scheduleBusyDaysStrip =
  'mt-2 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function scheduleBusyDayChipClass(selected: boolean): string {
  return `flex min-w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-[12px] px-2.5 py-2.5 transition active:scale-[0.98] ${
    selected ? 'bg-[#ff5f7a] text-white' : 'bg-[#EBEBEB] text-[#111827] hover:bg-white'
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
