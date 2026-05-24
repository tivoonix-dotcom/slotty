import {
  profileDashboardCard,
  profileDashboardCardPad,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const SERVICES_PAGE_BG = 'bg-white';

/** Desktop: как сводка / кабинет — серое полотно и белые карточки. */
export const SERVICES_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const servicesDesktopCard = profileDashboardCard;

export const servicesDesktopCardPad = profileDashboardCardPad;

/** Высота плавающего таббара (72px + нижний отступ контейнера). */
export const SERVICES_TAB_BAR_HEIGHT = '5.75rem';

/** Нижний отступ под FAB: на мобиле — над таббаром, на десктопе FAB снаружи — минимум. */
export const servicesTabScrollBottomPad = `pb-[calc(${SERVICES_TAB_BAR_HEIGHT}+1rem+env(safe-area-inset-bottom,0px))] lg:pb-6`;

/** Белая карточка контента таба только на lg+ (на мобиле — прозрачная обёртка). */
export const servicesTabPanelShell = `${servicesDesktopCard} max-lg:!rounded-none max-lg:!bg-transparent max-lg:!shadow-none lg:h-fit lg:w-full lg:self-start`;

export const servicesShellCard = 'hidden w-full min-w-0 lg:block';

export const servicesDesktopTabsSticky =
  'sticky z-20 overflow-hidden bg-white top-[var(--slotty-admin-desktop-topbar-h,4.75rem)]';

export const SLOTTY_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

const servicesTabPhotosDir = '/photos/' + encodeURIComponent('услуги') + '/';

/** Фото для шапок табов «Услуги» (`public/photos/услуги`). */
export function servicesTabPhotoSrc(fileName: string): string {
  return servicesTabPhotosDir + encodeURIComponent(fileName);
}
/** Отступ контента, чтобы список доскролливался выше фиксированного таббара. */
export const SERVICES_TAB_BAR_SCROLL_PAD = `calc(${SERVICES_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const servicesCard =
  'rounded-[22px] border border-[#EAECEF] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.05)]';

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
