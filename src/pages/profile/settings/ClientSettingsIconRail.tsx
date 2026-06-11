import { Link, NavLink } from 'react-router-dom';
import {
  HiBell,
  HiCalendarDays,
  HiCog6Tooth,
  HiHeart,
  HiUser,
} from 'react-icons/hi2';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import {
  getProfilePath,
  HUB_PATH,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_PATH,
  PROFILE_SETTINGS_PATH,
} from '../../../app/paths';
import { optimizeAvatarUrl } from '../../../shared/lib/optimizeAvatarUrl';
import { ImageReveal } from '../../../shared/ui/ImageReveal';
import { settingsRailItemClass, SETTINGS_RAIL_WIDTH } from '../../admin/settings/workspace/settingsWorkspaceTheme';
import { useClientCabinetShellData } from '../clientProfile/useClientCabinetShellData';

function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition group-hover/rail:opacity-100 lg:group-hover/rail:opacity-100"
    >
      {label}
    </span>
  );
}

const RAIL_ITEMS = [
  { to: getProfilePath('appointments'), label: 'Мои записи', icon: HiCalendarDays, end: false },
  { to: getProfilePath('favorites'), label: 'Избранное', icon: HiHeart, end: false },
  { to: getProfilePath('profile'), label: 'Профиль', icon: HiUser, end: true },
  {
    to: PROFILE_NOTIFICATIONS_PATH,
    label: 'Уведомления',
    icon: HiBell,
    end: true,
    showBadge: true,
  },
  { to: PROFILE_SETTINGS_PATH, label: 'Настройки', icon: HiCog6Tooth, end: false },
] as const;

export function ClientSettingsIconRail() {
  const shell = useClientCabinetShellData();
  const avatarSrc =
    (shell.profileAvatarUrl ? optimizeAvatarUrl(shell.profileAvatarUrl, 80) : null) ??
    (shell.telegramPhotoUrl ? optimizeAvatarUrl(shell.telegramPhotoUrl, 80) : null);

  return (
    <aside
      className={`${SETTINGS_RAIL_WIDTH} flex h-full max-h-full max-w-[72px] shrink-0 flex-col overflow-x-hidden overflow-y-hidden border-r border-[#eef0f5] bg-white`}
      aria-label="Разделы кабинета клиента"
    >
      <div className="flex h-[4.5rem] shrink-0 items-center justify-center overflow-hidden border-b border-[#eef0f5]">
        <Link
          to={HUB_PATH}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] transition hover:bg-[#F7F7F8]"
          aria-label="SLOTTY"
        >
          <img
            src={HEADER_LOGO_SRC}
            alt=""
            decoding="async"
            className="h-9 w-auto max-w-[52px] origin-center object-contain [transform:scale(1.65)]"
          />
        </Link>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-x-hidden overflow-y-auto px-2 py-4"
        aria-label="Кабинет клиента"
      >
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const showBadge = 'showBadge' in item && item.showBadge && shell.hasNewNotifications;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group/rail relative max-w-full ${settingsRailItemClass(isActive)}`
              }
              title={item.label}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {showBadge ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[9px] font-bold text-white">
                  {shell.notificationCount > 9 ? '9+' : shell.notificationCount}
                </span>
              ) : null}
              <RailTooltip label={item.label} />
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 overflow-hidden border-t border-[#EEEEEE] p-2">
        <Link
          to={PROFILE_PATH}
          className="group/rail relative flex w-full max-w-full justify-center rounded-[14px] p-1 transition hover:bg-[#F7F7F8]"
          title={shell.displayName}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F47C8C] text-[12px] font-semibold text-white ring-2 ring-white">
            {avatarSrc ? (
              <ImageReveal src={avatarSrc} alt="" className="h-full w-full object-cover" loading="eager" />
            ) : (
              shell.profileInitials
            )}
          </span>
          <RailTooltip label={shell.displayName} />
        </Link>
      </div>
    </aside>
  );
}
