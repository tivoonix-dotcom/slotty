import {
  profileDashboardCard,
  profileDashboardCardPad,
  profileDesktopTabsSticky,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const SERVICES_PAGE_BG = 'bg-white';

/** Мобилка: серое полотно как в кабинете мастера. */
export const SERVICES_MOBILE_CANVAS = 'bg-[#F5F5F5]';

/** Desktop: как сводка / кабинет — серое полотно и белые карточки. */
export const SERVICES_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const servicesDesktopCard = profileDashboardCard;

export const servicesDesktopCardPad = profileDashboardCardPad;

/** Высота плавающего таббара (72px + нижний отступ контейнера). */
export const SERVICES_TAB_BAR_HEIGHT = '5.75rem';

/** Нижний отступ под FAB: на мобиле — над таббаром, на десктопе FAB снаружи — минимум. */
export const servicesTabScrollBottomPad = `pb-[calc(${SERVICES_TAB_BAR_HEIGHT}+1rem+env(safe-area-inset-bottom,0px))] lg:pb-6`;

/** Контент таба: мобилка — на всю ширину серого полотна; desktop — белая карточка. */
export const servicesTabPanelShell =
  'relative w-full min-w-0 max-lg:space-y-4 lg:h-fit lg:w-full lg:self-start lg:overflow-hidden lg:rounded-[16px] lg:bg-white';

export const servicesTabContentPad = 'space-y-4 max-lg:p-0 lg:space-y-5 lg:p-6';

export const servicesShellCard = 'hidden w-full min-w-0 lg:block';

export const servicesDesktopTabsSticky = profileDesktopTabsSticky;

export const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

const servicesTabPhotosDir = '/photos/' + encodeURIComponent('услуги') + '/';

/** Фото для шапок табов «Услуги» (`public/photos/услуги`). */
export function servicesTabPhotoSrc(fileName: string): string {
  return servicesTabPhotosDir + encodeURIComponent(fileName);
}

/** Фон hero по вкладке (`public/photos/услуги`). */
export function servicesTabHeroBg(fileName: '11.webp' | '22.webp' | '33.webp' | '44.webp'): string {
  return servicesTabPhotoSrc(fileName);
}
/** Отступ контента, чтобы список доскролливался выше фиксированного таббара. */
export const SERVICES_TAB_BAR_SCROLL_PAD = `calc(${SERVICES_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const servicesCard =
  'rounded-[22px] border border-[#EAECEF] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.05)]';

/** Карточка услуги в каталоге — без рамок, мягкая серая плашка. */
export const servicesCatalogCardMobile =
  'w-full overflow-hidden rounded-[16px] bg-[#F6F7FB] p-4 lg:rounded-[18px] lg:px-5 lg:py-4';

export const servicesCatalogSearchInput =
  'w-full rounded-[10px] border-0 bg-[#EBEBEB] py-3 pl-11 pr-4 text-[15px] font-medium text-[#111827] outline-none transition placeholder:text-[#8E8E93] focus:bg-[#E4E4E4] lg:min-h-[48px] lg:rounded-[14px] lg:pl-12 lg:text-[15px]';

export const servicesCatalogFilterBtn =
  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-0 bg-[#EBEBEB] text-[#6B7280] transition active:scale-[0.96] lg:h-12 lg:w-12 lg:rounded-[14px]';

export const servicesCatalogFilterBtnActive = 'bg-[#F47C8C] text-white';

export const servicesCardPad = 'p-4';

export const servicesIconCircle =
  'flex shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C]';

export const servicesPinkBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const servicesChip =
  'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const servicesChipActive =
  'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]';

export const servicesChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';

export const servicesInput =
  'w-full rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-[15px] font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4]';
