import {
  profileDashboardCard,
  profileDashboardCardPad,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const APPOINTMENTS_PAGE_BG = 'bg-white';

export const APPOINTMENTS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const appointmentsDesktopCard = profileDashboardCard;

export const appointmentsDesktopCardPad = profileDashboardCardPad;

export const appointmentsShellCard = 'hidden w-full min-w-0 lg:block';

export const appointmentsDesktopTabsSticky =
  'sticky z-20 overflow-hidden bg-white top-[var(--slotty-admin-desktop-topbar-h,4.75rem)]';

export const APPOINTMENTS_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

export const APPOINTMENTS_TAB_BAR_HEIGHT = '5.75rem';

export const APPOINTMENTS_TAB_BAR_SCROLL_PAD = `calc(${APPOINTMENTS_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

const appointmentsTabPhotosDir = '/photos/' + encodeURIComponent('заявки') + '/';

export function appointmentsTabPhotoSrc(fileName: string): string {
  return appointmentsTabPhotosDir + encodeURIComponent(fileName);
}

export const apptCard =
  'rounded-[20px] border border-[#FDE8ED] bg-white shadow-[0_8px_28px_rgba(255,95,122,0.08)]';

export const apptCardInteractive =
  `${apptCard} group transition hover:border-[#F9A8B4] hover:shadow-[0_12px_36px_rgba(255,95,122,0.14)] active:scale-[0.99]`;

/** Новая заявка — розовая полоса слева. */
export const apptRequestCard =
  `${apptCard} relative overflow-hidden before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-r-full before:bg-gradient-to-b before:from-[#ff6f88] before:to-[#ff5f7a]`;

export const apptHighlightCard =
  'rounded-[22px] border-2 border-[#F9A8B4] bg-gradient-to-br from-[#FFF9FB] via-white to-[#FFF1F4] shadow-[0_14px_40px_rgba(255,95,122,0.16)]';

export const apptListTray =
  'rounded-[22px] border border-[#FDE8ED]/90 bg-[#f6f7fb] p-4 shadow-[0_4px_20px_rgba(255,95,122,0.07)] lg:p-5';

export const apptTrayLabel =
  'mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]';

export const apptGroupLabel =
  'flex items-center gap-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#ff5f7a]';

export const apptMonthLabel =
  'mb-2 flex items-center gap-2 px-0.5 text-[15px] font-black text-[#111827] after:mt-0.5 after:h-px after:min-w-[2rem] after:flex-1 after:bg-gradient-to-r after:from-[#FDE8ED] after:to-transparent';

export const apptPinkBtn =
  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const apptOutlineBtn =
  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[16px] border border-[#EAECEF] bg-white text-[14px] font-semibold text-[#374151] transition hover:border-[#F9A8B4] hover:bg-[#FFF9FB] hover:text-[#ff5f7a] active:scale-[0.98]';

export const apptChip =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const apptChipActive =
  'border-[#F9A8B4] bg-gradient-to-r from-[#FFF9FB] to-[#FFF1F4] text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.12),inset_0_0_0_1px_rgba(255,95,122,0.1)]';

export const apptChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';

export const apptFilterBtnActive =
  'border-[#F9A8B4] bg-[#FFF1F4] text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.14)]';

export const apptFilterBtnIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#ff5f7a]';

export const apptBadgeNew =
  'rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(255,95,122,0.28)]';

export const apptBadgeConfirmed =
  'rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#16A34A] ring-1 ring-[#BBF7D0]/80';

export const apptPriceAccent = 'font-bold tabular-nums text-[#ff5f7a]';

export const apptMetaAccent = 'font-semibold text-[#ff5f7a]';

export const apptChevron =
  'h-5 w-5 shrink-0 text-[#E5E7EB] transition group-hover:text-[#ff5f7a]';

export const apptAccentIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)]';

export const apptAccentIconSoft =
  'flex shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] font-bold text-[#ff5f7a] ring-2 ring-[#FDE8ED] shadow-[0_4px_12px_rgba(255,95,122,0.1)]';

export const apptBillingBanner =
  'rounded-[20px] border border-[#FDE8ED] bg-gradient-to-r from-white via-white to-[#FFF9FB] px-4 py-3.5 shadow-[0_6px_24px_rgba(255,95,122,0.08)] ring-1 ring-[#FDE8ED]/60';

export const apptEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)]';
