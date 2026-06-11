import {
  profileDashboardCard,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';
import { overviewDesktopKpiTile } from '../overview/adminOverviewTheme';

/** Как ServicesDesktopHero / сводка. */
export const ADMIN_SHEET_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

export const adminSheetCanvas = PROFILE_DESKTOP_PAGE_BG;

export const adminSheetSectionCard = profileDashboardCard;

export const adminSheetKpiTile = overviewDesktopKpiTile;

export const adminSheetInsetTray =
  'rounded-[24px] bg-[#f6f7fb] p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)] lg:p-5';

/** Горизонтальные отступы контента в AdminBottomSheet (скролл-область). */
export const adminSheetScrollPad =
  'px-[18px] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-0 lg:px-8 lg:pb-8';

/** Отступы контента под степпером (без верхнего — степпер вплотную к шапке). */
export const adminSheetBodyPad = 'pb-5 lg:pb-8';

/** Полные отступы, если степпера нет. */
export const adminSheetBodyInsetPad = 'pt-5 pb-5 lg:pt-6 lg:pb-8';

export const adminSheetPinkBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[15px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const adminSheetGhostBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#EAECEF] bg-white text-[15px] font-semibold text-[#374151] transition hover:border-[#FDE8ED] hover:bg-[#FAFAFA] active:scale-[0.98]';

export const adminSheetSecondaryBtn =
  'flex min-h-12 w-full items-center justify-center rounded-[18px] border border-[#FDE8ED] bg-[#FFF1F4] text-[15px] font-bold text-[#ff5f7a] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

export const adminSheetSegmentWrap =
  'grid grid-cols-2 gap-2 rounded-[22px] bg-[#f6f7fb] p-1.5 lg:p-2';

export const adminSheetSegmentActive =
  'min-h-11 rounded-[16px] bg-white text-[14px] font-bold text-[#111827]';

export const adminSheetSegmentIdle =
  'min-h-11 rounded-[16px] text-[14px] font-semibold text-[#6B7280] transition hover:text-[#374151]';
