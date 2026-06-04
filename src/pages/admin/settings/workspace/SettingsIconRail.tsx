import { NavLink } from 'react-router-dom';
import { ADMIN_DESKTOP_LOGO_SRC } from '../../../../app/headerLogo';
import {
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_PATH,
  HUB_PATH,
  MASTER_SETTINGS_PATH,
} from '../../../../app/paths';
import { useAuth } from '../../../../features/auth/AuthProvider';
import { useAdminNotifications } from '../../notifications/AdminNotificationsContext';
import { useAdminMasterCabinet } from '../../AdminMasterCabinetContext';
import {
  ADMIN_BILLING_NAV,
  ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  IconNavSettings,
} from '../../adminCabinetNav';
import { MasterCabinetAvatar } from '../../profile/adminProfilePortrait';
import { settingsRailItemClass } from './settingsWorkspaceTheme';

const RAIL_ITEMS = [
  ...ADMIN_MAIN_NAV,
  ADMIN_NOTIFICATIONS_NAV,
  ADMIN_BILLING_NAV,
  { to: MASTER_SETTINGS_PATH, label: 'Настройки', end: false, icon: IconNavSettings },
];

function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition group-hover/rail:opacity-100 lg:block"
    >
      {label}
    </span>
  );
}

export function SettingsIconRail() {
  const { profile } = useAuth();
  const { draft } = useAdminMasterCabinet();
  const { hasUnread, unreadCount } = useAdminNotifications();
  const displayName = draft.name?.trim() || profile?.full_name?.trim() || 'Мастер';

  return (
    <aside
      className="flex h-dvh w-[72px] shrink-0 flex-col border-r border-[#eef0f5] bg-white"
      aria-label="Разделы кабинета"
    >
      <div className="flex h-[4.5rem] shrink-0 items-center justify-center border-b border-[#eef0f5]">
        <NavLink to={HUB_PATH} className="flex h-10 w-10 items-center justify-center rounded-[12px] transition hover:bg-[#F7F7F8]" aria-label="SLOTTY">
          <img src={ADMIN_DESKTOP_LOGO_SRC} alt="" className="h-8 w-8 object-contain" />
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-4">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.to === ADMIN_NOTIFICATIONS_PATH;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : undefined}
              className={({ isActive }) => `group/rail relative ${settingsRailItemClass(isActive)}`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {isNotifications && hasUnread ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5f7a] px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
              <RailTooltip label={item.label} />
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#EEEEEE] p-2">
        <NavLink
          to={ADMIN_PATH}
          className="group/rail relative flex w-full justify-center rounded-[14px] p-1 transition hover:bg-[#F7F7F8]"
          title={displayName}
        >
          <MasterCabinetAvatar
            name={displayName}
            photoUrl={draft.photoUrl}
            accountProfile={profile}
            sizeClass="h-10 w-10"
            ringClassName="ring-2 ring-white"
            initialsClassName="text-[12px]"
          />
          <RailTooltip label={displayName} />
        </NavLink>
      </div>
    </aside>
  );
}
