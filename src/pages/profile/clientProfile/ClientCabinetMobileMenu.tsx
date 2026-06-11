import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  HiBell,
  HiCalendarDays,
  HiCog6Tooth,
  HiHeart,
  HiSparkles,
  HiUser,
} from 'react-icons/hi2';
import {
  BECOME_MASTER_PATH,
  getProfilePath,
  PROFILE_NOTIFICATIONS_PATH,
  PROFILE_PATH,
  PROFILE_SETTINGS_PATH,
} from '../../../app/paths';
import { AdminBottomSheet } from '../../admin/shared/AdminBottomSheet';
import {
  resolveClientCabinetMobileTab,
  type ClientProfileMainTab,
} from './clientCabinetMobileTabs';

function resolveActiveMainTab(pathname: string, search: string): ClientProfileMainTab | null {
  if (pathname !== PROFILE_PATH && pathname !== PROFILE_NOTIFICATIONS_PATH) return null;
  return resolveClientCabinetMobileTab(pathname, search);
}

function navClass(active: boolean): string {
  return `flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left transition active:scale-[0.99] ${
    active ? 'bg-[#E29595] text-white shadow-[0_8px_22px_rgba(226,149,149,0.25)]' : 'bg-[#F1EFEF] text-neutral-900'
  }`;
}

const MAIN_ITEMS: {
  id: ClientProfileMainTab;
  label: string;
  icon: typeof HiCalendarDays;
}[] = [
  { id: 'appointments', label: 'Мои записи', icon: HiCalendarDays },
  { id: 'favorites', label: 'Избранное', icon: HiHeart },
  { id: 'profile', label: 'Профиль', icon: HiUser },
];

type Props = {
  open: boolean;
  onClose: () => void;
  isMasterCabinet: boolean;
  hasNewNotifications: boolean;
  upcomingCount: number;
  favoritesCount: number;
};

export function ClientCabinetMobileMenu({
  open,
  onClose,
  isMasterCabinet,
  hasNewNotifications,
  upcomingCount,
  favoritesCount,
}: Props) {
  const { pathname, search } = useLocation();
  const activeMainTab = resolveActiveMainTab(pathname, search);

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Разделы">
      <nav className="flex flex-col gap-2 pb-1" aria-label="Разделы кабинета клиента">
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          const count =
            item.id === 'appointments' ? upcomingCount : item.id === 'favorites' ? favoritesCount : null;

          const active = activeMainTab === item.id;

          return (
            <Link
              key={item.id}
              to={getProfilePath(item.id)}
              onClick={onClose}
              className={navClass(active)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <Icon className="shrink-0 opacity-95" aria-hidden />
                <span className="truncate text-[15px] font-semibold">{item.label}</span>
              </span>
              {count != null && count > 0 ? (
                <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-neutral-700 shadow-sm">
                  {count}
                </span>
              ) : (
                <span className="w-3 shrink-0" aria-hidden />
              )}
            </Link>
          );
        })}

        <NavLink
          to={PROFILE_NOTIFICATIONS_PATH}
          onClick={onClose}
          className={({ isActive }) => navClass(isActive)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <HiBell className="shrink-0 opacity-95" aria-hidden />
            <span className="truncate text-[15px] font-semibold">Уведомления</span>
          </span>
          {hasNewNotifications ? (
            <span className="shrink-0 rounded-full bg-[#F47C8C] px-2 py-0.5 text-[11px] font-bold text-white">
              NEW
            </span>
          ) : (
            <span className="w-3 shrink-0" aria-hidden />
          )}
        </NavLink>

        <NavLink
          to={PROFILE_SETTINGS_PATH}
          onClick={onClose}
          className={({ isActive }) => navClass(isActive)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <HiCog6Tooth className="shrink-0 opacity-95" aria-hidden />
            <span className="truncate text-[15px] font-semibold">Настройки</span>
          </span>
          <span className="w-3 shrink-0" aria-hidden />
        </NavLink>

        {!isMasterCabinet ? (
          <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200/80 pt-3">
            <Link to={BECOME_MASTER_PATH} onClick={onClose} className={navClass(false)}>
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <HiSparkles className="shrink-0 opacity-95" aria-hidden />
                <span className="truncate text-[15px] font-semibold">Стать мастером</span>
              </span>
            </Link>
          </div>
        ) : null}
      </nav>
    </AdminBottomSheet>
  );
}
