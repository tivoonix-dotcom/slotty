import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { CLIENT_STICKY_BELOW_HEADER } from '../../../pages/client/clientNavConstants';
import {
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  catalogDesktopPanel,
} from '../../../pages/client/servicesCatalog/servicesCatalogTheme';

export const clientBookingCanvasClass = 'bg-[#F5F5F5]';

export const clientBookingDesktopShellClass = `${CLIENT_DESKTOP_SHELL_CLASS} pb-10 pt-6`;

/** Плоская белая панель без ring — как в каталоге */
export const clientBookingPanel = catalogDesktopPanel;

export const clientBookingPrimaryBtnClass = `${catalogPrimaryBtn} w-full min-h-11`;

export const clientBookingSecondaryBtnClass = `${catalogSecondaryBtn} w-full min-h-11`;

export const clientBookingGhostBtnClass =
  'flex min-h-10 w-full items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[14px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB]';

export const clientBookingOutlineBtn =
  'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#F5F5F5] px-4 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB]';

export const clientBookingProfileLinkBtn =
  'mt-3 flex min-h-11 w-full items-center justify-between rounded-[10px] bg-[#F5F5F5] px-4 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB]';

export const clientBookingHeroReviewBtn =
  'inline-flex min-h-10 shrink-0 items-center justify-center rounded-[10px] bg-white/95 px-5 text-[14px] font-semibold text-[#111827] shadow-[0_2px_12px_rgba(17,24,39,0.08)] backdrop-blur-sm transition hover:bg-white';

export const clientBookingField =
  'w-full rounded-[10px] border-0 bg-[#F5F5F5] px-4 py-3 text-[15px] font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:bg-[#EBEBEB]';

export const clientBookingBackLink =
  'inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]';

export const clientBookingPageGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6';

export const clientBookingAsideSticky = `mt-4 flex flex-col gap-4 lg:sticky ${CLIENT_STICKY_BELOW_HEADER} lg:mt-0`;

export const clientBookingStatusBadge =
  'inline-flex rounded-[10px] px-3 py-1 text-[12px] font-bold leading-none';
