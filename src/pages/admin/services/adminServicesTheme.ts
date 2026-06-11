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

export const SERVICES_PAGE_BG = 'bg-white';

/** Мобилка: серое полотно как в кабинете мастера. */
export const SERVICES_MOBILE_CANVAS = 'bg-[#F5F5F5]';

/** Desktop: как сводка / кабинет — серое полотно и белые карточки. */
export const SERVICES_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const servicesDesktopCard = profileDashboardCard;

export const servicesDesktopCardPad = profileDashboardCardPad;

export const SERVICES_TAB_BAR_HEIGHT = ADMIN_MOBILE_TAB_BAR_HEIGHT;

/** Нижний отступ под FAB: на мобиле — над таббаром, на десктопе FAB снаружи — минимум. */
export const servicesTabScrollBottomPad = `${adminMobileTabBarListScrollPadClass} lg:pb-6`;

/** Контент таба: мобилка — на всю ширину серого полотна; desktop — белая карточка. */
export const servicesTabPanelShell =
  'relative w-full min-w-0 max-lg:space-y-4 lg:h-fit lg:w-full lg:self-start lg:overflow-hidden lg:rounded-[16px] lg:bg-white';

export const servicesTabContentPad = 'space-y-4 max-lg:p-0 lg:space-y-5 lg:p-6';

export const servicesShellCard = 'hidden w-full min-w-0 lg:block';

export const servicesDesktopTabsSticky = profileDesktopTabsSticky;

export const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

/** Фон hero сводки услуг (`public/photos/fon.webp`). */
export const SERVICES_HERO_BG = '/photos/fon.webp';

const servicesTabPhotosDir = '/photos/services-tabs/';

/** Фон кнопки «Добавить услугу» (`public/photos/history/red.webp`). */
export const SERVICES_CATALOG_ADD_BTN_BG = '/photos/history/red.webp';

/** Фото для шапок табов «Услуги» (`public/photos/services-tabs`). */
export function servicesTabPhotoSrc(fileName: string): string {
  return `${servicesTabPhotosDir}${fileName}`;
}

/** Фон hero по вкладке (`public/photos/services-tabs`). */
export function servicesTabHeroBg(fileName: '11.webp' | '22.webp' | '33.webp' | '44.webp'): string {
  return servicesTabPhotoSrc(fileName);
}
/** Отступ контента, чтобы список доскролливался выше фиксированного таббара. */
export const SERVICES_TAB_BAR_SCROLL_PAD = adminMobileTabBarListScrollPadClass;

export const servicesCard =
  'rounded-[22px] border border-[#EAECEF] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.05)]';

/** Split-карточка услуги в каталоге — как у записей: белая панель. */
export const servicesCatalogCardShell =
  'flex w-full flex-col overflow-hidden rounded-[16px] bg-white lg:rounded-[18px]';

/** Видимая услуга без слотов в расписании — красная обводка. */
export const servicesCatalogCardNoSlotsShell =
  `${servicesCatalogCardShell} ring-2 ring-[#EF4444] ring-offset-2 ring-offset-[#F5F5F5]`;

export const servicesCatalogCardBody = 'flex min-h-[5.5rem] min-w-0 flex-1';

export const servicesCatalogDragHandle =
  'flex w-9 shrink-0 cursor-grab touch-none items-center justify-center self-stretch border-r border-[#F0F0F0] text-[#C4C9D1] transition enabled:active:cursor-grabbing enabled:active:text-[#6B7280] disabled:cursor-default disabled:opacity-40';

export const servicesCatalogCardThumbCol =
  'relative w-[4.75rem] shrink-0 self-stretch sm:w-20';

export const servicesCatalogMetaMuted = 'text-[13px] font-medium text-[#6B7280]';

/** Счётчик окон в карточке услуги — ссылка в создание расписания. */
export const servicesCatalogSlotsLink =
  'mt-1.5 inline-flex w-fit items-center gap-1 rounded-[10px] bg-[#EEF0FC] px-2.5 py-1 text-[12px] font-bold tabular-nums leading-none text-[#3B4CCA] ring-1 ring-[#DDE2F7] transition hover:bg-[#E4E8FA] active:scale-[0.98] sm:text-[13px]';

export const servicesCatalogPriceText =
  'mt-2 inline-flex w-fit items-center rounded-[10px] bg-[#FFF1F4] px-2.5 py-1 text-[17px] font-black tabular-nums leading-none tracking-[-0.04em] text-[#ff5f7a] ring-1 ring-[#FDE8ED] sm:text-[18px]';

export const servicesCatalogMenuBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EEEEEE] active:scale-[0.96]';

export const servicesCatalogBadgeVisible =
  'rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]';

export const servicesCatalogBadgeHidden =
  'rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-bold text-[#6B7280]';

/** @deprecated Используйте servicesCatalogCardShell */
export const servicesCatalogCardMobile = servicesCatalogCardShell;

export const servicesCatalogSearchInput =
  'w-full rounded-[10px] border-0 bg-[#EBEBEB] py-3 pl-11 pr-4 text-[15px] font-medium text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4] lg:min-h-[48px] lg:rounded-[14px] lg:pl-12 lg:text-[15px]';

export const servicesCatalogFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-0 bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96] lg:h-12 lg:w-12 lg:rounded-[14px]';

export const servicesCatalogFilterBtnActive = 'bg-[#F47C8C] text-white';

/** Белая панель в модалке услуги (на сером полотне каталога). */
export const servicesFormPanelClass = 'rounded-[16px] bg-white p-4 sm:p-5';

/** Белая панель полей в шите услуги — как в «Новое окно». */
export const servicesSheetFormPanel = 'overflow-hidden rounded-[16px] bg-white p-4';

export const servicesSheetPrimaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#F47C8C] px-4 text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const servicesSheetSecondaryBtn =
  'flex min-h-11 flex-1 items-center justify-center rounded-[10px] bg-[#EBEBEB] px-4 text-[15px] font-semibold text-[#111827] transition hover:bg-[#E4E4E4] active:scale-[0.98] disabled:opacity-50';

export const servicesSheetSummaryShell = 'overflow-hidden rounded-[10px] bg-[#EBEBEB]';

export const servicesSheetSummaryHeader =
  'relative overflow-hidden px-4 pb-4 pt-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-3 after:bg-gradient-to-b after:from-transparent after:to-[#EBEBEB]';

export const servicesSheetSummaryBody = 'px-4 pb-4';

export const servicesSheetErrorBox =
  'rounded-[12px] bg-[#FFF1F4] px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-[#EF4444] break-words [overflow-wrap:anywhere]';

export const servicesSheetActionRow = 'flex items-center gap-1 rounded-[10px] bg-[#EBEBEB] pr-2';

export const servicesFormSegmentTrack =
  'grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F5F5] p-1.5';

export const servicesCardPad = 'p-4';

export const servicesIconCircle =
  'flex shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C]';

export const servicesPinkBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[15px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

/** Кнопка «Добавить услугу» в каталоге — красный фон с фото. */
export const servicesCatalogAddBtn =
  'relative inline-flex min-h-11 min-w-0 w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#EF4444] px-3 text-[12px] font-bold text-[#111827] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-45 sm:px-4 sm:text-[13px]';

/** Список действий в sheet услуги. */
export const servicesSheetMenuList = 'overflow-hidden rounded-[14px] bg-[#F5F5F5]';

export const servicesSheetMenuRow =
  'flex w-full items-center gap-3 px-3.5 py-3 text-left transition enabled:hover:bg-[#EBEBEB] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45';

export const servicesSheetOrderBtn =
  'flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#F5F5F5] text-[13px] font-semibold text-[#111827] transition enabled:hover:bg-[#EBEBEB] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45';

export const servicesChip =
  'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const servicesChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C]';

export const servicesChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';

export const servicesInput =
  'w-full rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4]';
