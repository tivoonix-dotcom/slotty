/** Палитра экрана «Сводка»: mobile — карточки как в разделе «Услуги», desktop — SaaS dashboard. */
import { SERVICES_PAGE_BG } from '../services/adminServicesTheme';
import {
  profileDashboardCard,
  profileDashboardCardPad,
} from '../profile/adminProfileDashboardTheme';

export const OVERVIEW_CANVAS_HEX = '#F7F7F8';

/** Фон страницы на mobile (как услуги/расписание). */
export const overviewPageBg = SERVICES_PAGE_BG;

export const overviewDesktopCanvas = 'lg:bg-white';

/** Нижний таббар аналитики (только mobile). */
export const OVERVIEW_TAB_BAR_HEIGHT = '5.75rem';

export const ADMIN_CABINET_SHELL_MAX = 'w-full max-w-[460px] lg:max-w-none';

/** Desktop: единая оболочка с табами внутри карточки. */
export const overviewShellCard =
  'hidden overflow-hidden rounded-[28px] bg-white shadow-[0_2px_16px_rgba(17,24,39,0.04)] lg:block';

export const overviewCard =
  'rounded-[24px] border border-white/80 bg-white shadow-[0_10px_36px_rgba(17,24,39,0.07)] lg:rounded-[28px] lg:border-0 lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]';

export const overviewCardPad = 'p-[18px] lg:p-6';

export const overviewIconCircle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C] shadow-[0_8px_20px_rgba(244,124,140,0.10)] lg:h-10 lg:w-10 lg:rounded-[14px] lg:text-[#ff5f7a] lg:shadow-none';

export const overviewPinkBtn =
  'rounded-[18px] bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-white shadow-[0_10px_26px_rgba(244,124,140,0.30)] transition hover:brightness-[0.98] active:scale-[0.98] lg:rounded-[14px] lg:from-[#ff6f88] lg:to-[#ff5f7a] lg:shadow-[0_8px_24px_rgba(255,95,122,0.28)] lg:hover:opacity-95';

export const overviewPinkOutline =
  'shrink-0 rounded-[18px] border border-[#FDE8ED] bg-white px-4 py-2.5 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFF1F4] active:scale-[0.98] lg:rounded-[14px] lg:border-0 lg:bg-[#FFF1F4] lg:font-semibold lg:text-[#ff5f7a] lg:hover:bg-[#FFE4EA]';

export const overviewMutedSurface =
  'rounded-[20px] border border-[#EAECEF] bg-[#F3F4F6] lg:rounded-[16px] lg:border-0 lg:bg-[#f6f7fb]';

export const overviewEmptyIllustrationSrc =
  '/photos/' + encodeURIComponent('ничего не нашли.webp');

const overviewSvodkaDir = '/photos/' + encodeURIComponent('сводка') + '/';

export function overviewSvodkaPhotoSrc(fileName: string): string {
  return overviewSvodkaDir + encodeURIComponent(fileName);
}

export const OVERVIEW_WELCOME_IMAGE_SRC = overviewSvodkaPhotoSrc('обзор.webp');

export const OVERVIEW_CLIENTS_FOOTER_SRC = '/photos/KLIENT.webp';

/** @deprecated use overviewCard on desktop */
export const overviewDesktopCard = profileDashboardCard;

/** @deprecated use overviewCardPad on desktop */
export const overviewDesktopCardPad = profileDashboardCardPad;
