import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';

export {
  settingsCanvasClass as notificationsCanvasClass,
  settingsCardClass as notificationsCardClass,
  settingsCardInnerDivider as notificationsCardDivider,
  settingsRowClass as notificationsRowClass,
  settingsRowIconClass as notificationsRowIconClass,
} from '../settings/clientSettingsTheme';

export const notificationsDesktopShellClass = `${CLIENT_DESKTOP_SHELL_CLASS} pb-10 pt-6`;

export const notificationsPageTitleClass =
  'text-[26px] font-bold tracking-[-0.04em] text-[#111827] sm:text-[28px]';

export const notificationsBackLinkClass =
  'inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]';
