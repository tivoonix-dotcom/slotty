import {
  profileDashboardCard,
  PROFILE_DESKTOP_PAGE_BG,
} from '../profile/adminProfileDashboardTheme';

export const NOTIFICATIONS_PAGE_BG = 'bg-white';

export const NOTIFICATIONS_DESKTOP_CANVAS = PROFILE_DESKTOP_PAGE_BG;

export const notificationsDesktopCard = profileDashboardCard;

export const notificationsShellCard = 'hidden w-full min-w-0 lg:block';

export const NOTIFICATIONS_GRADIENT =
  'bg-gradient-to-br from-[#111827] via-[#2b2430] to-[#ff5f7a]';

export const notifCard =
  'rounded-[20px] border border-[#FDE8ED] bg-white shadow-[0_8px_28px_rgba(255,95,122,0.08)]';

export const notifCardUnread =
  `${notifCard} relative overflow-hidden border-[#F9A8B4] shadow-[0_12px_36px_rgba(255,95,122,0.14)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-gradient-to-b before:from-[#ff6f88] before:to-[#ff5f7a]`;

export const notifCardRead =
  `${notifCard} border-[#EAECEF]/90 shadow-[0_6px_22px_rgba(17,24,39,0.04)] opacity-[0.92]`;

export const notifListTray =
  'rounded-[22px] border border-[#FDE8ED]/90 bg-[#f6f7fb] p-4 shadow-[0_4px_20px_rgba(255,95,122,0.07)] lg:p-5';

export const notifTrayLabel =
  'mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]';

export const notifChip =
  'inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.96]';

export const notifChipActive =
  'border-[#F9A8B4] bg-gradient-to-r from-[#FFF9FB] to-[#FFF1F4] text-[#ff5f7a] shadow-[0_4px_14px_rgba(255,95,122,0.12)]';

export const notifChipIdle =
  'border-[#EAECEF] bg-white text-[#6B7280] hover:border-[#FDE8ED] hover:text-[#374151]';

export const notifBadgeNew =
  'rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(255,95,122,0.28)]';

export const notifAccentIcon =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_6px_16px_rgba(255,95,122,0.28)]';

export const notifAccentIconSoft =
  'flex shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED]';

export const notifPinkBtn =
  'flex min-h-11 w-full items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,95,122,0.32)] transition hover:opacity-95 active:scale-[0.98]';

export const notifEmptyIcon =
  'flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white shadow-[0_10px_28px_rgba(255,95,122,0.32)]';

export const notifMetaAccent = 'font-semibold text-[#ff5f7a]';
