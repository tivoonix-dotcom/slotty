/** Палитра экрана «Сводка» — в стиле desktop-профиля (SaaS dashboard). */
import {
  profileDashboardCard,
  profileDashboardCardPad,
} from '../profile/adminProfileDashboardTheme';

export const OVERVIEW_CANVAS_HEX = '#ffffff';

export const overviewPageBg = 'bg-white';

export const overviewDesktopCanvas = 'lg:bg-white';

/** @deprecated нижний таббар встроен в карточку */
export const OVERVIEW_TAB_BAR_HEIGHT = '0px';

export const ADMIN_CABINET_SHELL_MAX = 'w-full max-w-[460px] lg:max-w-none';

export const overviewShellCard =
  'rounded-[28px] bg-white shadow-[0_2px_16px_rgba(17,24,39,0.04)]';

export const overviewCard = profileDashboardCard;

export const overviewCardPad = profileDashboardCardPad;

export const overviewIconCircle =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#ff5f7a]';

export const overviewPinkBtn =
  'rounded-[14px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_8px_24px_rgba(255,95,122,0.28)] transition hover:opacity-95 active:scale-[0.98]';

export const overviewPinkOutline =
  'shrink-0 rounded-[14px] bg-[#FFF1F4] px-4 py-2.5 text-[13px] font-semibold text-[#ff5f7a] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const overviewMutedSurface = 'rounded-[16px] bg-[#f6f7fb]';

export const overviewEmptyIllustrationSrc =
  '/photos/' + encodeURIComponent('ничего не нашли.webp');

const overviewSvodkaDir = '/photos/' + encodeURIComponent('сводка') + '/';

export function overviewSvodkaPhotoSrc(fileName: string): string {
  return overviewSvodkaDir + encodeURIComponent(fileName);
}

export const OVERVIEW_WELCOME_IMAGE_SRC = overviewSvodkaPhotoSrc('обзор.webp');

export const OVERVIEW_CLIENTS_FOOTER_SRC = '/photos/KLIENT.webp';
