import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { catalogDesktopPanel, catalogPrimaryBtn, catalogSecondaryBtn } from '../clientProfile/clientProfileTheme';

export const clientNotificationsCanvasClass = 'bg-[#F5F5F5]';

export const clientNotificationsDesktopShellClass = `${CLIENT_DESKTOP_SHELL_CLASS} pb-10 pt-6`;

export const clientNotificationsHeroPanel = `${catalogDesktopPanel} p-4 sm:p-5 lg:p-6`;

export const clientNotificationsToolbar = `${catalogDesktopPanel} p-4 lg:p-5`;

export const clientNotificationsTrayLabel = 'text-[14px] font-bold text-[#111827]';

export const clientNotificationsCardShell =
  'flex w-full overflow-hidden rounded-[16px] bg-white ring-1 ring-[#EEEEEE] transition hover:bg-[#FAFAFA] active:scale-[0.99] lg:rounded-[18px]';

export const clientNotificationsCardInteractive = `${clientNotificationsCardShell} cursor-pointer`;

export const clientNotificationsCardBody = 'flex min-w-0 flex-1';

export const clientNotificationsIconStrip =
  'flex w-[4.25rem] shrink-0 items-center justify-center self-stretch py-3 sm:w-[4.75rem]';

export const clientNotificationsIconStripUnread = 'bg-[#FFF1F4]';

export const clientNotificationsIconStripRead = 'bg-[#EBEBEB]';

export const clientNotificationsCardContent = 'min-w-0 flex-1 p-3.5 sm:p-4';

export const clientNotificationsBadgeNew =
  'rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]';

export const clientNotificationsIconWrap =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EBEBEB] text-[#6B7280] ring-1 ring-[#EEEEEE]';

export const clientNotificationsKpiTile =
  'flex min-h-[6.5rem] flex-col justify-between rounded-[12px] bg-[#F5F5F5] p-4';

export const clientNotificationsKpiIcon =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280] ring-1 ring-[#EEEEEE]';

export const clientNotificationsMetaAccent = 'font-semibold text-[#F47C8C]';

export const clientNotificationsErrorBox =
  'rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]';

export const clientNotificationsLoadingPanel =
  'flex min-h-[12rem] items-center justify-center rounded-[16px] bg-white py-10 ring-1 ring-[#EEEEEE]';

export const clientNotificationsBackLinkClass =
  'inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]';

export const clientNotificationsPrimaryBtn = catalogPrimaryBtn;

export const clientNotificationsSecondaryBtn = catalogSecondaryBtn;
