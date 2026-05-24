import {
  profileDashboardCard,
  profileDashboardCardPad,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

/** Высота нижней панели раздела «Расписание». */
export const SCHEDULE_TAB_BAR_HEIGHT = '5.75rem';

export const SCHEDULE_TAB_BAR_SCROLL_PAD = `calc(${SCHEDULE_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const SCHEDULE_PAGE_BG = 'bg-white';

/** Desktop: как услуги / сводка. */
export const SCHEDULE_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const scheduleDesktopCard = profileDashboardCard;

export const scheduleDesktopCardPad = profileDashboardCardPad;

export const scheduleShellCard = 'hidden w-full min-w-0 lg:block';

export const scheduleDesktopTabsSticky =
  'sticky z-20 overflow-hidden bg-white top-[var(--slotty-admin-desktop-topbar-h,4.75rem)]';

export const SCHEDULE_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

export const scheduleTabPanelShell = `${scheduleDesktopCard} max-lg:!rounded-none max-lg:!bg-transparent max-lg:!shadow-none lg:h-fit lg:w-full lg:self-start`;

/** Отступ под FAB на вкладке «Создать». */
export const scheduleTabScrollBottomPad = `pb-[calc(${SCHEDULE_TAB_BAR_HEIGHT}+1rem+env(safe-area-inset-bottom,0px))] lg:pb-6`;

export const scheduleTemplatesTray =
  'rounded-[24px] bg-[#f6f7fb] p-4 lg:rounded-[24px] lg:p-5';

/** Панель поиска и фильтров на вкладке «Окна». */
export const scheduleListToolbar =
  'rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] lg:p-5';

export const scheduleListGroupCard =
  'rounded-[24px] border border-[#FDE8ED] bg-white p-4 shadow-[0_8px_28px_rgba(255,95,122,0.06)] lg:p-5';

export const scheduleCalendarCard =
  'rounded-[24px] border border-[#FDE8ED] bg-white p-4 shadow-[0_8px_28px_rgba(255,95,122,0.06)] lg:p-5';

export const scheduleCalendarTray =
  'rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] lg:p-5';

const scheduleTabPhotosDir = '/photos/' + encodeURIComponent('Расписание') + '/';

/** Фото для шапок табов (`public/photos/Расписание`). */
export function scheduleTabPhotoSrc(fileName: string): string {
  return scheduleTabPhotosDir + encodeURIComponent(fileName);
}
